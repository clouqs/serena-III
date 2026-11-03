//! Harness isolato: importa sorgenti reali, sostituisce solo HAL e logger.
//! Eseguito dal verificatore Python con rustc, senza Cargo o ESP-IDF.
#![allow(dead_code, unused_variables)]
extern crate self as embedded_hal;
extern crate self as log;
extern crate self as max1161x;

use std::{cell::RefCell, rc::Rc, sync::Mutex};
static LOGS: Mutex<Vec<String>> = Mutex::new(Vec::new());
#[macro_export]
macro_rules! info { ($($arg:tt)*) => { $crate::LOGS.lock().unwrap().push(format!($($arg)*)) }; }
#[macro_export]
macro_rules! error { ($($arg:tt)*) => { $crate::LOGS.lock().unwrap().push(format!($($arg)*)) }; }

pub mod i2c {
    pub trait ErrorType { type Error: core::fmt::Debug; }
    pub enum Operation<'a> { Read(&'a mut [u8]), Write(&'a [u8]) }
    pub trait I2c: ErrorType {
        fn transaction(&mut self, address: u8, ops: &mut [Operation<'_>]) -> Result<(), Self::Error>;
        fn write(&mut self, address: u8, bytes: &[u8]) -> Result<(), Self::Error> {
            self.transaction(address, &mut [Operation::Write(bytes)])
        }
        fn write_read(&mut self, address: u8, tx: &[u8], rx: &mut [u8]) -> Result<(), Self::Error> {
            self.transaction(address, &mut [Operation::Write(tx), Operation::Read(rx)])
        }
    }
    impl<T: ErrorType + ?Sized> ErrorType for &mut T { type Error = T::Error; }
    impl<T: I2c + ?Sized> I2c for &mut T {
        fn transaction(&mut self, address: u8, ops: &mut [Operation<'_>]) -> Result<(), Self::Error> {
            T::transaction(self, address, ops)
        }
    }
}

// Python sostituisce questi percorsi con quelli assoluti del checkout.
#[path = "@SETUP@"] pub mod setup_file;
#[path = "@CONFIG@"] pub mod config_file;
pub mod max_messages { pub use crate::config_file as config_byte; pub use crate::setup_file as setup_byte; }
#[path = "@VARIANTS@"] pub mod max_variants;
#[path = "@DRIVER@"] pub mod max_driver;

use i2c::{ErrorType, I2c, Operation};
use max_driver::MAX116xx;
use max_messages::{config_byte::*, setup_byte::*};
use max_variants::*;

#[derive(Clone, Debug, PartialEq)] enum BusError { Absent, ReadFailed }
#[derive(Clone, Debug, PartialEq)] struct Event { addr: u8, tx: Vec<u8>, rx_len: usize }
#[derive(Default)] struct State { events: Vec<Event>, fail_init: bool, fail_read: bool, fail_read_number: Option<usize>, reads: usize, raw: Option<u16> }
struct FakeBus(Rc<RefCell<State>>);
impl ErrorType for FakeBus { type Error = BusError; }
impl I2c for FakeBus {
    fn transaction(&mut self, addr: u8, ops: &mut [Operation<'_>]) -> Result<(), Self::Error> {
        let mut state = self.0.borrow_mut();
        let mut event = Event { addr, tx: Vec::new(), rx_len: 0 };
        for op in ops.iter() {
            match op { Operation::Write(bytes) => event.tx.extend_from_slice(bytes), Operation::Read(bytes) => event.rx_len += bytes.len() }
        }
        let reading = event.rx_len > 0;
        state.events.push(event);
        if !reading && state.fail_init { return Err(BusError::Absent); }
        if reading {
            state.reads += 1;
            if state.fail_read || state.fail_read_number == Some(state.reads) { return Err(BusError::ReadFailed); }
            for op in ops.iter_mut() {
                if let Operation::Read(bytes) = op {
                    for (index, pair) in bytes.chunks_exact_mut(2).enumerate() {
                        let raw = state.raw.unwrap_or(1024 + index as u16 * 64);
                        pair[0] = 0xF0 | ((raw >> 8) as u8 & 0x0F);
                        pair[1] = raw as u8;
                    }
                }
            }
        }
        Ok(())
    }
}
fn bus() -> (FakeBus, Rc<RefCell<State>>) { let state = Rc::new(RefCell::new(State::default())); (FakeBus(state.clone()), state) }
fn expected_temperature(raw: u16) -> f32 {
    let v = (raw as f32 * 3.3 / 4096.0) as f64;
    (1.79615598298204 * v.powi(3) - 9.37248626037254 * v.powi(2) + 38.0779254777707 * v - 2.53332540256446) as f32
}

#[test] fn setup_defaults_and_all_48_combinations() {
    assert_eq!(SetupByte::default().to_byte(), 0x82);
    let refs = [RefSelect::VddRef, RefSelect::ExternalRef, RefSelect::InternalRefOff, RefSelect::InternalRefOn, RefSelect::InternalRefOutputOff, RefSelect::InternalRefOutputOn];
    for r in refs { for c in [Clock::Internal, Clock::External] { for m in [Mode::Unipolar, Mode::Bipolar] { for reset in [false, true] {
        let actual = SetupByte::new(r, c, m, reset).to_byte();
        assert_eq!(actual, 0x80 + 16 * r as u8 + 8 * c as u8 + 4 * m as u8 + 2 * reset as u8);
    } } } }
    assert_eq!(SetupByte::new(RefSelect::InternalRefOn, Clock::Internal, Mode::Unipolar, true).to_byte(), 0xD2);
}
#[test] fn config_defaults_and_all_96_combinations() {
    assert_eq!(ConfigByte::default().to_byte(), 0x17);
    let channels = [ChannelSelect::Ain0, ChannelSelect::Ain1, ChannelSelect::Ain2, ChannelSelect::Ain3, ChannelSelect::Ain4, ChannelSelect::Ain5, ChannelSelect::Ain6, ChannelSelect::Ain7, ChannelSelect::Ain8, ChannelSelect::Ain9, ChannelSelect::Ain10, ChannelSelect::Ain11];
    for scan in [ScanConfig::ScanFromZero, ScanConfig::RepeatEight, ScanConfig::ScanUpperHalf, ScanConfig::SingleChannel] { for channel in channels { for mode in [InputMode::SingleEnded, InputMode::Differential] {
        assert_eq!(ConfigByte::new(scan, channel, mode).to_byte(), 32 * scan as u8 + 2 * channel as u8 + mode as u8);
    } } }
    assert_eq!(ConfigByte::new(ScanConfig::SingleChannel, ChannelSelect::Ain0, InputMode::SingleEnded).to_byte(), 0x61);
    assert_eq!(ConfigByte::new(ScanConfig::SingleChannel, ChannelSelect::Ain5, InputMode::SingleEnded).to_byte(), 0x6B);
}
fn variant_check<V: Variant>(addr: u8, channels: usize) {
    assert_eq!((V::ADDR, V::CHANNELS), (addr, channels));
    let (i2c, state) = bus();
    let mut adc: MAX116xx<_, V> = MAX116xx::new(i2c, SetupByte::default(), 0x61);
    let mut out = [0_f32; 12];
    adc.read_all_sensors(&mut out).unwrap();
    assert_eq!(state.borrow().events, [Event {addr, tx: vec![0x82], rx_len: 0}, Event {addr, tx: vec![0x17], rx_len: 2 * channels}]);
}
#[test] fn six_variants_choose_address_and_length_but_same_config() {
    variant_check::<MAX11612>(0x34, 4); variant_check::<MAX11613>(0x34, 4);
    variant_check::<MAX11614>(0x33, 8); variant_check::<MAX11615>(0x33, 8);
    variant_check::<MAX11616>(0x35, 12); variant_check::<MAX11617>(0x35, 12);
}
#[test] fn sample_order_mask_temperature_and_untouched_tail() {
    let (i2c, _) = bus();
    let mut adc: MAX116xx<_, MAX11617> = MAX116xx::new(i2c, SetupByte::default(), 0x61);
    let mut out = [-999_f32; 14]; adc.read_all_sensors(&mut out).unwrap();
    for i in 0..12 { assert!((out[i] - expected_temperature(1024 + i as u16 * 64)).abs() < 0.00002); }
    assert_eq!(out[12..], [-999_f32; 2]);
}
#[test] fn documented_numeric_examples() {
    for (raw, temp) in [(0, -2.5333254), (1024, 23.510384), (2048, 42.847215), (4095, 85.5778)] {
        let (i2c, state) = bus(); state.borrow_mut().raw = Some(raw);
        let mut adc: MAX116xx<_, MAX11617> = MAX116xx::new(i2c, SetupByte::default(), 0);
        let mut out = [0.0; 12]; adc.read_all_sensors(&mut out).unwrap();
        assert!((out[0] - temp).abs() < 0.0001);
    }
}
#[test] fn constructor_swallows_init_error() {
    let (i2c, state) = bus(); state.borrow_mut().fail_init = true;
    let mut adc: MAX116xx<_, MAX11617> = MAX116xx::new(i2c, SetupByte::default(), 0);
    let mut out = [0.0; 12]; assert!(adc.read_all_sensors(&mut out).is_ok());
}
#[test] fn read_error_is_returned_and_preserves_output() {
    let (i2c, state) = bus(); state.borrow_mut().fail_read = true;
    let mut adc: MAX116xx<_, MAX11617> = MAX116xx::new(i2c, SetupByte::default(), 0);
    let mut out = [77.0; 12]; assert_eq!(adc.read_all_sensors(&mut out), Err(BusError::ReadFailed)); assert_eq!(out, [77.0; 12]);
}
#[test] fn short_slice_panics_after_partial_update() {
    let (i2c, _) = bus(); let mut adc: MAX116xx<_, MAX11617> = MAX116xx::new(i2c, SetupByte::default(), 0);
    let mut out = [-999.0; 11];
    assert!(std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| adc.read_all_sensors(&mut out))).is_err());
    assert!(out.iter().all(|v| *v != -999.0));
}
#[test] fn custom_variant_overflow_panics_before_bus_read() {
    struct TooMany; impl Variant for TooMany { const ADDR: u8 = 0x35; const CHANNELS: usize = 13; }
    let (i2c, state) = bus(); let mut adc: MAX116xx<_, TooMany> = MAX116xx::new(i2c, SetupByte::default(), 0);
    let mut out = [0.0; 13];
    assert!(std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| adc.read_all_sensors(&mut out))).is_err());
    assert_eq!(state.borrow().events.len(), 1);
}
#[test] fn borrowed_bus_is_reusable_after_driver_drop() {
    let (mut i2c, state) = bus();
    let adc: MAX116xx<_, MAX11617> = MAX116xx::new(&mut i2c, SetupByte::default(), 0); drop(adc);
    i2c.write(0x35, &[0x82]).unwrap(); assert_eq!(state.borrow().events.len(), 2);
}
#[test] fn diagnostic_failed_read_still_divides_by_five() {
    LOGS.lock().unwrap().clear();
    let (i2c, state) = bus(); { let mut s = state.borrow_mut(); s.raw = Some(2000); s.fail_read_number = Some(3); }
    let mut adc: MAX116xx<_, MAX11617> = MAX116xx::new(i2c, SetupByte::default(), 0);
    adc.calibrate_me();
    assert_eq!(state.borrow().reads, 5);
    assert!(LOGS.lock().unwrap().iter().any(|line| line.contains("Raw Value 1600")));
}

// Le funzioni complete degli esempi Markdown vengono aggiunte da Python.
@SNIPPETS@
