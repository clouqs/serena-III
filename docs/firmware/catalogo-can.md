# 6. Catalogo CAN — Serena 1.0.0 usato dal firmware

Generato dalle definizioni al commit `f7cbf162f1720c0c1dbaccd9f68a19ffbccf36bb`; firmware `8da023f3056b65683d110e69112bec1dfb4446ae`.

**131 messaggi · 14 file YAML · payload massimo 64 bit.**

Questo è il vocabolario completo della revisione bloccata, non la lista dei messaggi effettivamente trasmessi da Brain. Gli ID sono calcolati con le formule della libreria Messages. I byte sono ricavati dai bit dichiarati, includendo il padding. Gli offset indicano la posizione nella sequenza dei campi: per interpretare i byte occorre rispettare anche endianness e regole del bitfield.

Lo scaling riporta il multiplier del YAML. `get_value()` restituisce il valore scalato; la conversione verso il valore fisico divide per il multiplier. Le descrizioni dei campi sono riportate nella lingua originale delle definizioni.

## brain

Fonte: [definitions/brain.yaml](https://github.com/uniuderacing/serena-messages/blob/f7cbf162f1720c0c1dbaccd9f68a19ffbccf36bb/definitions/brain.yaml).

| Messaggio | Formato | ID CAN completo | Bit / byte |
| --- | --- | --- | --- |
| Raw APPS voltages | standard | `0x384` | 64 / 8 |
| Throttle percentage | standard | `0x3E4` | 48 / 6 |
| Control diagnostics | standard | `0x484` | 48 / 6 |
| Brake pressure | standard | `0x3AF` | 24 / 3 |
| Raw brake pressure voltages | standard | `0x3C4` | 40 / 5 |
| Brain Status | standard | `0x4C2` | 8 / 1 |
| Extensometer delta | standard | `0x404` | 40 / 5 |
| Motor Map | standard | `0x4E7` | 8 / 1 |

### Raw APPS voltages

**ID CAN `0x384` · standard.** Raw voltages of the two APPS potentiometers.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| APPS 1 | 0 | i32 / 32 | 1000 | mV | big (default) | Voltage read from the APPS1 potentiometer. |
| APPS 2 | 32 | i32 / 32 | 1000 | mV | big (default) | Voltage read from the APPS2 potentiometer. |

### Throttle percentage

**ID CAN `0x3E4` · standard.** Computed percentage of the throttle pedal.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Raw | 0 | u16 / 16 | 100 | % | big (default) | Raw throttle pedal percentage. |
| Mapped | 16 | i16 / 16 | 100 | % | big (default) | Throttle pedal percentage after applying the motor map. |
| Current mapped | 32 | i16 / 16 | 10 | A | big (default) | Throttle pedal percentage after applying the motor map |

### Control diagnostics

**ID CAN `0x484` · standard.** Useful diagnostics for the the control used to send torque commands.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Slip ratio | 0 | i16 / 16 | 1000 | — | big (default) | The slip ratio calculated |
| Current after traction control | 16 | i16 / 16 | 10 | — | big (default) | The current command after traction control has been applied |
| Current after power limit | 32 | i16 / 16 | 1000 | — | big (default) | The current command after power limit has been applied |

### Brake pressure

**ID CAN `0x3AF` · standard.** Pressure of the brake pedal lines.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Pressure | 0 | u16 / 16 | 100 | bar | big (default) | Pump pressure reading from the brake line. |
| Position | 16 | enum / 8 | 1 | — | big (default) | Front; Rear |

### Raw brake pressure voltages

**ID CAN `0x3C4` · standard.** Raw voltages of the brake pedal lines.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Raw voltage pressure | 0 | i32 / 32 | 1000 | mV | big (default) | Voltage reading from the brake line. |
| Position | 32 | enum / 8 | 1 | — | big (default) | Front; Rear |

### Brain Status

**ID CAN `0x4C2` · standard.** Global state of the Brain ECU.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| State | 0 | enum / 8 | 1 | — | big (default) | LV; TS; R2D; Calibration |

### Extensometer delta

**ID CAN `0x404` · standard.** Delta of the extensometer.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Delta | 0 | i32 / 32 | 1 | mm | big (default) | Delta of the extensometer. |
| Position | 32 | enum / 8 | 1 | — | big (default) | Front Left; Front Right; Rear Left; Rear Right |

### Motor Map

**ID CAN `0x4E7` · standard.** Motor map.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Map | 0 | enum / 8 | 1 | — | big (default) | Acceleration; Skidpad; Autocross; Endurance; TorqueTest; VelocityTest; Next |

## bridge

Fonte: [definitions/bridge.yaml](https://github.com/uniuderacing/serena-messages/blob/f7cbf162f1720c0c1dbaccd9f68a19ffbccf36bb/definitions/bridge.yaml).

| Messaggio | Formato | ID CAN completo | Bit / byte |
| --- | --- | --- | --- |
| ESP NOW Monitoring | standard | `0x304` | 40 / 5 |

### ESP NOW Monitoring

**ID CAN `0x304` · standard.** Monitoring information about ESP-NOW connection.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Sender | 0 | enum / 8 | 1 | — | big (default) | Telemetry; BMS |
| RSSI | 8 | i32 / 32 | 1 | dBm | big (default) | Signal strength indicator of a received packet. |

## charger

Fonte: [definitions/charger.yaml](https://github.com/uniuderacing/serena-messages/blob/f7cbf162f1720c0c1dbaccd9f68a19ffbccf36bb/definitions/charger.yaml).

| Messaggio | Formato | ID CAN completo | Bit / byte |
| --- | --- | --- | --- |
| Charger Ctl | standard raw | `0x618` | 56 / 7 |
| Charger Stat | standard raw | `0x610` | 32 / 4 |
| Charger Act1 | standard raw | `0x611` | 64 / 8 |
| Charger Act2 | standard raw | `0x614` | 64 / 8 |
| Charger Tst1 | standard raw | `0x615` | 64 / 8 |
| Charger SAE_EVSE_STATUS | standard raw | `0x619` | 64 / 8 |
| Charger Req | standard raw | `0x61B` | 24 / 3 |
| Charger SW | standard raw | `0x61E` | 64 / 8 |
| Charger FltA | standard raw | `0x61D` | 64 / 8 |
| Charger FltP | standard raw | `0x61C` | 64 / 8 |
| Charger Tst2 | standard raw | `0x616` | 64 / 8 |

### Charger Ctl

**ID CAN `0x618` · standard raw.** Charger control message. This control message must be sent every 100ms in order for the charger to provide output power.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| CanEnable | 0 | bool / 1 | 1 | — | big (default) | If both Can Enable and hardware enable pin are active and no error occurs, the charger is ready to start. |
| Padding 1 | 1 | padding / 3 | 1 | — | big (default) | A padding of 3 bits. |
| LED3_A | 4 | bool / 1 | 1 | — | big (default) | If true a Led connected to the pins 10 and one of 13,14,15 could be powered when AC Mains is provided. |
| Padding 2 | 5 | padding / 3 | 1 | — | big (default) | A padding of 3 bits. |
| IacMaxSet | 8 | u16 / 16 | 10 | A | big (default) | Set Iac Max set (not used if J1772 or EN61851 are enabled). |
| VoutMaxSet | 24 | u16 / 16 | 10 | V | big (default) | Set DC maximum output voltage. |
| IoutMaxSet | 40 | u16 / 16 | 10 | A | big (default) | Set DC maximum output current. |

### Charger Stat

**ID CAN `0x610` · standard raw.** Charger status message. This message is sent every 1000ms by the charger.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| PowerEnable | 0 | bool / 1 | 1 | — | big (default) | Indicates if the hardware enable pin is active. From 25 July 2016 (serial number ME292830152203) the HVIL signal management is passive. So, it is not still monitored and the flag value is always equal to 1. |
| ErrorLatch | 1 | bool / 1 | 1 | — | big (default) | If True, a failure or a soft failure has occurred (See the table 1 of Fault Code). |
| WarnLimit | 2 | bool / 1 | 1 | — | big (default) | If True, a warning condition is present (See the table 1 of Fault Code). |
| Padding 1 | 3 | padding / 1 | 1 | — | big (default) | A padding of 1 bit. |
| LimTemp | 4 | bool / 1 | 1 | — | big (default) | If True, the de-rating characteristic is active. |
| Padding 2 | 5 | padding / 1 | 1 | — | big (default) | A padding of 1 bit. |
| WarningHV | 6 | bool / 1 | 1 | — | big (default) | If True, the CAN SERVICE communication with HV side is not implemented (the CAN Service pins are not connected). |
| Bulks | 7 | bool / 1 | 1 | — | big (default) | If True, a Bulk error is present (See the table 1 of Fault Code). |
| BigPadding | 8 | padding / 24 | 1 | — | big (default) | A padding of 24 bits. It's there on the datasheet, I don't know if it's there also in the real message. |

### Charger Act1

**ID CAN `0x611` · standard raw.** Charger actual values message 1. This message is sent every 100ms by the charger.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Iacm | 0 | u16 / 16 | 10 | A | big (default) | AC Input Current. |
| Temp | 16 | u16 / 16 | 193 | °C | big (default) | Temperature over Power Stage, actual value is offset by -40°C (0x0000 is -40°C). |
| VOut | 32 | u16 / 16 | 10 | V | big (default) | DC Output Voltage. |
| IOut | 48 | u16 / 16 | 10 | A | big (default) | DC Output Current. |

### Charger Act2

**ID CAN `0x614` · standard raw.** Charger actual values message 2. This message is sent every 1000ms by the charger.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| TempLogLV | 0 | u16 / 16 | 193 | °C | big (default) | Temperature over Logic LV Stage, actual value is offset by -40°C (0x0000 is -40°C). |
| AcPower | 16 | u16 / 16 | 100 | kW | big (default) | AC input power. |
| ProxcurrentLimit | 32 | u16 / 16 | 10 | A | big (default) | It defines the maximum AC input current available considering Proximity Signal (EN61851 only). |
| PilotcurrentLimit | 48 | u16 / 16 | 10 | A | big (default) | It defines the maximum AC input current available considering Pilot Signal (this value is divided by the number of the EVO chargers detected over CAN). |

### Charger Tst1

**ID CAN `0x615` · standard raw.** Charger real time diagnostic message. This message is sent every 100ms by the charger.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| ACok | 0 | bool / 1 | 1 | — | big (default) | True if AC Mains is connected (this flag became true a little time before (300ms) the precharge starts). |
| PrCompl | 1 | bool / 1 | 1 | — | big (default) | True if AC Mains connected and pre-charge completed. |
| PwrOk | 2 | bool / 1 | 1 | — | big (default) | True if the charger starts to provide output power |
| VoutOk | 3 | bool / 1 | 1 | — | big (default) | True if the Output voltage is present on charger side. |
| Neutral | 4 | bool / 1 | 1 | — | big (default) | If False, the Neutral is connected correctly. It is referred to the correct connection of the Neutral in the following AC configurations: - 3-phase star configuration - 1-phase configuration This flag is linked to the other flags: Tst. 1 Neutro1 and Tst1.Neutro2. So, if the Tst. 1 Neutro1 is True and Tst. 1 Neutro2 is True, then Tst. 1Neutral is False. The Tst. 1 Neutral is TRUE only if there is a problem on the Neutral cable connection.. |
| LED3 | 5 | bool / 1 | 1 | — | big (default) | This flag becomes true when: Tst1.LED618 is True, charger supplied with AC Mains and 12Vdc are provided to the pins 10 and one of 13, 14, 15. |
| LED618 | 6 | bool / 1 | 1 | — | big (default) | This flag became true when Ct.LED3 is True. Tst1.LED618 represents an echo of the Ct.LED3 command. If True, a Led connected to the pins 10 and one of 13, 14, 15 could be powered when AC Mains is provided (see page 33, chapter 5.9.4.8 of the User's Manual EVO Series). |
| Padding 1 | 7 | padding / 1 | 1 | — | big (default) | A padding of 1 bit. |
| ovp | 8 | bool / 1 | 1 | — | big (default) | True if there is a DC output over voltage flag (the overvoltage is referred to the maximum output voltage allowed by the charger range). |
| connOpen | 9 | bool / 1 | 1 | — | big (default) | Control loop Fail flag (HVIL on DC output connector), true if the output connector is not connected. From 25 July 2016 (serial number ME292830152203) the HVIL signal management is passive. So, it is not still monitored and this flag is not still evaluated. |
| Padding 2 | 10 | padding / 3 | 1 | — | big (default) | A padding of 3 bits. |
| TherFail | 13 | bool / 1 | 1 | — | big (default) | If True, the charger is working in de-rating condition (see page 45, chapter 5.12 of the User's Manual). |
| Padding 3 | 14 | padding / 1 | 1 | — | big (default) | A padding of 1 bit. |
| rx618Fail | 15 | bool / 1 | 1 | — | big (default) | RX ID618 fail flag, true if the control message is not received for more than 600ms. |
| bulk1_fail | 16 | bool / 1 | 1 | — | big (default) | If True, a Bulk error related to the channel 1 is present (See the table 1 of Fault Code). |
| bulk2_fail | 17 | bool / 1 | 1 | — | big (default) | If True, a Bulk error related to the channel 2 is present (See the table 1 of Fault Code). |
| bulk3_fail | 18 | bool / 1 | 1 | — | big (default) | If True, a Bulk error related to the channel 3 is present (See the table 1 of Fault Code). |
| PUMPon | 19 | bool / 1 | 1 | — | big (default) | True if there is a Pump active request (when Act1.Temp or Act2. TempLogLV value is over 35°C) |
| FANon | 20 | bool / 1 | 1 | — | big (default) | True if there is a Fan active request (when Act1.Temp or Act2.TempLogLV value is over 40°C). |
| HVrxFail | 21 | bool / 1 | 1 | — | big (default) | If true, the communication with HV side of charger is erratic. |
| CoolingFail | 22 | bool / 1 | 1 | — | big (default) | If true, the cooling circuit is not connected or the liquid coolant is not present |
| Rx619fail | 23 | bool / 1 | 1 | — | big (default) | RX ID619 fail flag (used only if there are several charger in parallel for SAE J1772 or EN61851), true if the ID619 is not detected by slave chargers |
| Neutro1 | 24 | bool / 1 | 1 | — | big (default) | If true, there is a good connection on neutral cable. Tst. 1 Neutro1 and Tst. Neutro2 are linked to an internal system that detects the neutral disconnection. |
| Neutro2 | 25 | bool / 1 | 1 | — | big (default) | If true, there is a good connection on neutral cable. Tst. 1 Neutro1 and Tst. Neutro2 are linked to an internal system that detects the neutral disconnection. |
| ThreePhase | 26 | bool / 1 | 1 | — | big (default) | True if Three phase AC configuration is set (Pin 8 of J2 connector NOT short circuited to ND; this is the default condition), False if Single phase AC configuration is set (Pin 8 of J2 connector short circuited to one of GND pins of the J2 connector) (*). |
| Padding 4 | 27 | padding / 2 | 1 | — | big (default) | A padding of 2 bits. |
| IacFail | 29 | bool / 1 | 1 | — | big (default) | If True, the lac current value is over the maximum lac value permitted. |
| Ignition | 30 | bool / 1 | 1 | — | big (default) | If True, the ignition run signal wakes up the charger from SLEEP when SAE J1772 or EN61851 is enabled (see page 29, chapter 5.9.4.2 of the User's Manual). |
| LVBatteryNP | 31 | bool / 1 | 1 | — | big (default) | If True, the LV Battery always hot is not present. |
| ProxOk | 32 | bool / 1 | 1 | — | big (default) | True if Proximity level is correct (only when EN61851/SAEJ1772 enabled). |
| Padding 5 | 33 | padding / 1 | 1 | — | big (default) | A padding of 1 bit. |
| PilotOk | 34 | bool / 1 | 1 | — | big (default) | True if pilot signal is correct (only when EN61851/SAEJ1772 enabled). |
| Padding 6 | 35 | padding / 1 | 1 | — | big (default) | A padding of 1 bit. |
| S2Ok | 36 | bool / 1 | 1 | — | big (default) | True if S2 is closed (only when EN61851/SAEJ1772 enabled). |
| Padding 7 | 37 | padding / 3 | 1 | — | big (default) | A padding of 3 bits. |
| Padding 8 | 40 | padding / 8 | 1 | — | big (default) | A padding of 8 bits, god forgive me. |
| cntHours | 48 | u16 / 16 | 1 | h | big (default) | Hours counter (hours registered when the charger is providing output power. It is not considered the functioning of the charger when the control board is powered only with LV Battery always hot). |

### Charger SAE_EVSE_STATUS

**ID CAN `0x619` · standard raw.** Shows the status of the EVSE and the chargers present on the vehicle. This message is sent every 100ms by the charger.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| SAE_bitfield | 0 | bitfield / 48 | 1 | — | big (default) | The raw message as a bitfield, look at the datasheet for more info |
| Current | 48 | u16 / 16 | 10 | A | big (default) | It defines the maximum current available for each charger. |

### Charger Req

**ID CAN `0x61B` · standard raw.** Message request, has to be sent in order to get level 2 diagnostic messages.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| RequestEnable | 0 | bool / 1 | 1 | — | big (default) | Bit Enable of Request to the charger. Yes, I know |
| Padding 1 | 1 | padding / 7 | 1 | — | big (default) | A padding of 7 bits. |
| ID_req | 8 | u16 / 16 | 1 | logic | big (default) | Id of the diagnostic message requested |

### Charger SW

**ID CAN `0x61E` · standard raw.** Software version message

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Version | 0 | u64 / 64 | 1 | logic | big (default) | 8 bytes of software version, it's actually 8 ASCII chars. |

### Charger FltA

**ID CAN `0x61D` · standard raw.** Message with Fault active detected.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| FltA_bitfield | 0 | bitfield / 32 | 1 | — | big (default) | The raw message as a bitfield, look at the datasheet for more info |
| First | 32 | u16 / 16 | 1 | h | big (default) | Defines the first time that the fault occurred |
| Last | 48 | u16 / 16 | 1 | h | big (default) | Defines the last time that the fault occurred |

### Charger FltP

**ID CAN `0x61C` · standard raw.** Message with Fault passive detected.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| FltP_bitfield | 0 | bitfield / 32 | 1 | — | big (default) | The raw message as a bitfield, look at the datasheet for more info |
| First | 32 | u16 / 16 | 1 | h | big (default) | Defines the first time that the fault occurred |
| Last | 48 | u16 / 16 | 1 | h | big (default) | Defines the last time that the fault occurred |

### Charger Tst2

**ID CAN `0x616` · standard raw.** Shows the charger configuration. Only sent at startup.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Tst2_bitfield | 0 | bitfield / 16 | 1 | — | big (default) | The raw message as a bitfield, look at the datasheet for more info |
| IacmMaxSet | 16 | u8 / 8 | 5 | A | big (default) | Defines the maximum AC input current (**). |
| VoutMaxSet | 24 | u16 / 16 | 10 | A | big (default) | Define the maximum DC output voltage. |
| IoutMaxSet | 40 | u16 / 16 | 10 | A | big (default) | Define the maximum DC output current. |
| Psw | 56 | u8 / 8 | 10 |  | big (default) | System Password: 0b10100101 (0xA5) |

## cooling

Fonte: [definitions/cooling.yaml](https://github.com/uniuderacing/serena-messages/blob/f7cbf162f1720c0c1dbaccd9f68a19ffbccf36bb/definitions/cooling.yaml).

| Messaggio | Formato | ID CAN completo | Bit / byte |
| --- | --- | --- | --- |
| RAD fans speed | standard | `0x624` | 64 / 8 |
| Water pump info | standard | `0x644` | 24 / 3 |
| Water temperature | standard | `0x684` | 48 / 6 |
| Critical connector interlock | standard | `0x6A4` | 8 / 1 |

### RAD fans speed

**ID CAN `0x624` · standard.** Speed of finned coil fans.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Speed fan 1 | 0 | u16 / 16 | 1 | Hz | big (default) | Speed read from RAD fan 1. |
| Speed fan 2 | 16 | u16 / 16 | 1 | Hz | big (default) | Speed read from RAD fan 2. |
| Speed fan 3 | 32 | u16 / 16 | 1 | Hz | big (default) | Speed read from RAD fan 3. |
| Speed fan 4 | 48 | u16 / 16 | 1 | Hz | big (default) | Speed read from RAD  fan 4. |

### Water pump info

**ID CAN `0x644` · standard.** Infos about water pump

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Pump speed | 0 | u16 / 16 | 100 | % | big (default) | Speed of the water pump. |
| Pump status | 16 | bool / 1 | 1 | — | big (default) | Status of the water pump. |
| Padding | 17 | padding / 7 | 1 | — | big (default) | Padding of 7 bits |

### Water temperature

**ID CAN `0x684` · standard.** Water temperature from cooling system (3 sensors).

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Engine output | 0 | i16 / 16 | 100 | °C | big (default) | Temperature of the water coming out of the engine. |
| Inverter output | 16 | i16 / 16 | 100 | °C | big (default) | Temperature of the water coming out of the inverter. |
| Input | 32 | i16 / 16 | 100 | °C | big (default) | Temperature of the water coming out of the finned coil. |

### Critical connector interlock

**ID CAN `0x6A4` · standard.** Critical connector interlock status.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Interlock status | 0 | bool / 1 | 1 | — | big (default) | Status of the critical connector interlock. |
| Padding | 1 | padding / 7 | 1 | — | big (default) | Padding of 7 bits |

## energymeter

Fonte: [definitions/energymeter.yaml](https://github.com/uniuderacing/serena-messages/blob/f7cbf162f1720c0c1dbaccd9f68a19ffbccf36bb/definitions/energymeter.yaml).

| Messaggio | Formato | ID CAN completo | Bit / byte |
| --- | --- | --- | --- |
| EnergyMeter comp data | standard raw | `0x430` | 64 / 8 |
| EnergyMeter high rate data | standard raw | `0x4A0` | 40 / 5 |
| EnergyMeter power data | standard raw | `0x4A1` | 64 / 8 |

### EnergyMeter comp data

**ID CAN `0x430` · standard raw.** Data available from the EnergyMeter (like in the competitions).

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| MsgCntr | 0 | u8 / 8 | 1 | — | big (default) | TMsgCntr |
| Status | 8 | u8 / 8 | 1 | — | big (default) | Status |
| Power | 16 | i16 / 16 | 333 | kW | little | Power mesuared by the EnergyMeter. |
| Voltage | 32 | i16 / 16 | 25 | V | little | Voltage mesuared by the EnergyMeter. |
| Current | 48 | i16 / 16 | 20 | A | little | Current mesuared by the EnergyMeter. |

### EnergyMeter high rate data

**ID CAN `0x4A0` · standard raw.** Data available from the EnergyMeter (like in the competitions).

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Voltage | 0 | bitfield / 20 | 1 | mV | big (default) | Voltage mesuared by the EnergyMeter. |
| Padding 1 | 20 | padding / 1 | 1 | — | big (default) | A padding of 1 bit. |
| Current | 21 | bitfield / 19 | 1 | mA | big (default) | Current mesuared by the EnergyMeter. This is in 2-complement |

### EnergyMeter power data

**ID CAN `0x4A1` · standard raw.** Data available from the EnergyMeter (like in the competitions).

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Power in | 0 | u32 / 32 | 1 | — | big (default) | Power input by the EnergyMeter. |
| Power out | 32 | u32 / 32 | 1 | — | big (default) | Power output by the EnergyMeter. |

## faults

Fonte: [definitions/faults.yaml](https://github.com/uniuderacing/serena-messages/blob/f7cbf162f1720c0c1dbaccd9f68a19ffbccf36bb/definitions/faults.yaml).

| Messaggio | Formato | ID CAN completo | Bit / byte |
| --- | --- | --- | --- |
| Error | standard | `0x2` | 40 / 5 |
| Warning | standard | `0x1C2` | 40 / 5 |

### Error

**ID CAN `0x2` · standard.** Error message.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Error code | 0 | enum / 16 | 1 | — | big (default) | Other; BMS cell voltage out of range; BMS cell temperature out of range; BMS current out of range; BMS voltage sensor disconnected; BMS temperature sensor disconnected; BMS current sensor disconnected; Apps plausibility; APPS disconnected; Front brake disconnected; Rear brake disconnected; Burned fuse; ThreadFailed |
| Code | 16 | u16 / 16 | 1 | — | big (default) | Useful code for debugging |
| Board | 32 | u8 / 8 | 1 | — | big (default) | Board that generated the error |

### Warning

**ID CAN `0x1C2` · standard.** Warning message. We just have to notify telemetry.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Warning code | 0 | enum / 16 | 1 | — | big (default) | Other; APPS out of range; Messages error; Cooling temp invalid data; Cooling fans error; Rear left ext disconnected; Rear right ext disconnected; Sensors timeout; Sensor error; Parameter not found; Temperature check failed; Voltage check failed; LV battery charge low |
| Code | 16 | u16 / 16 | 1 | — | big (default) | Useful code for debugging |
| Board | 32 | u8 / 8 | 1 | — | big (default) | Board that generated the warning |

## generic

Fonte: [definitions/generic.yaml](https://github.com/uniuderacing/serena-messages/blob/f7cbf162f1720c0c1dbaccd9f68a19ffbccf36bb/definitions/generic.yaml).

| Messaggio | Formato | ID CAN completo | Bit / byte |
| --- | --- | --- | --- |
| Ping | extended | `0x81F86` | 8 / 1 |
| Current timestamp | standard | `0x324` | 64 / 8 |
| CAN bus status | standard | `0x344` | 32 / 4 |
| Board status | standard | `0x364` | 40 / 5 |
| New start finish line | standard | `0x5A4` | 8 / 1 |
| Reset reason | standard | `0x4A4` | 16 / 2 |
| Shutdown sensing | standard | `0x3EF` | 8 / 1 |

### Ping

**ID CAN `0x81F86` · extended.** Board ping.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Board ID | 0 | u8 / 8 | 1 | — | big (default) | The ID of the board that sent the ping. |

### Current timestamp

**ID CAN `0x324` · standard.** Current timestamp.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| UTC | 0 | i64 / 64 | 1 | — | big (default) | Current UTC timestamp. |

### CAN bus status

**ID CAN `0x344` · standard.** Status of the CAN bus.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Load | 0 | u32 / 32 | 10000 | % | big (default) | Load percentage of the CAN bus. |

### Board status

**ID CAN `0x364` · standard.** General status of a board.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Board ID | 0 | u8 / 8 | 1 | — | big (default) | The ID of the board that sent the message. |
| Power consumption | 8 | u32 / 32 | 100 | mA | big (default) | The power consumption of the board, measured by the eFuse. |

### New start finish line

**ID CAN `0x5A4` · standard.** A new start finish line was requested.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Request | 0 | bool / 1 | 1 | — | big (default) | True if requested. |
| Padding | 1 | padding / 7 | 1 | — | big (default) | Padding. |

### Reset reason

**ID CAN `0x4A4` · standard.** Reset reason of ECUs.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Board ID | 0 | u8 / 8 | 1 | — | big (default) | The ID of the board that sent the message. |
| Reset reason | 8 | enum / 8 | 1 | — | big (default) | ESP_RST_UNKNOWN; ESP_RST_POWERON; ESP_RST_EXT; ESP_RST_SW; ESP_RST_PANIC; ESP_RST_INT_WDT; ESP_RST_TASK_WDT; ESP_RST_WDT; ESP_RST_DEEPSLEEP; ESP_RST_BROWNOUT; ESP_RST_SDIO; ESP_RST_USB; ESP_RST_JTAG; ESP_RST_EFUSE; ESP_RST_PWR_GLITCH; ESP_RST_CPU_LOCKUP |

### Shutdown sensing

**ID CAN `0x3EF` · standard.** Shutdown sensing

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Is opened | 0 | bool / 1 | 1 | logic | big (default) | True if the device is opened, false otherwise |
| Device name | 1 | enum / 7 | 1 | — | big (default) | TSMS; AMS; IMD; TSAC interlock; BSPD; HVD interlock; TSMP interlock; Inverter interlock; Rollbar switch LX; Dashboard switch; Inertia; Activation logic; BOTS; Rollbar switch RX; LVMS |

## imd_bender

Fonte: [definitions/imd_bender.yaml](https://github.com/uniuderacing/serena-messages/blob/f7cbf162f1720c0c1dbaccd9f68a19ffbccf36bb/definitions/imd_bender.yaml).

| Messaggio | Formato | ID CAN completo | Bit / byte |
| --- | --- | --- | --- |
| IMD Info | standard raw | `0x37` | 48 / 6 |

### IMD Info

**ID CAN `0x37` · standard raw.** Contains data values that represent the insulation resistance and the internal operating states of the VIFC and IMC

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| D_IMC_R_ISO | 0 | u16 / 16 | 1 | kΩ | little | Mean insulation resistance measured by the IMC. |
| Insulation fault | 16 | bool / 1 | 1 | — | big (default) | Insulation fault. |
| Chassis fault | 17 | bool / 1 | 1 | — | big (default) | Chassis fault. |
| System failure | 18 | bool / 1 | 1 | — | big (default) | System failure. |
| Calibration running | 19 | bool / 1 | 1 | — | big (default) | Calibration running. |
| Self test running | 20 | bool / 1 | 1 | — | big (default) | Self test running. |
| Insulation warning | 21 | bool / 1 | 1 | — | big (default) | Insulation warning. |
| Padding 1 | 22 | padding / 10 | 1 | — | big (default) | A padding of 10 bits. |
| Insulation measurement | 32 | bool / 1 | 1 | — | big (default) | Insulation measurement. |
| Padding 2 | 33 | padding / 1 | 1 | — | big (default) | A padding of 1 bit. |
| IMC Alive status detection | 34 | bool / 1 | 1 | — | big (default) | IMC Alive status detection. |
| Padding 3 | 35 | padding / 5 | 1 | — | big (default) | A padding of 5 bits. |
| Insulation resistance value | 40 | bool / 1 | 1 | — | big (default) | Insulation resistance value. |
| Padding 3 | 41 | padding / 3 | 1 | — | big (default) | A padding of 3 bits. |
| IMC self test OverAll scenario | 44 | bool / 1 | 1 | — | big (default) | IMC self test. |
| IMC self test ParameterConfig scenario | 45 | bool / 1 | 1 | — | big (default) | IMC self test. |
| Padding 4 | 46 | padding / 2 | 1 | — | big (default) | A padding of 5 bits. |

## inverter

Fonte: [definitions/inverter.yaml](https://github.com/uniuderacing/serena-messages/blob/f7cbf162f1720c0c1dbaccd9f68a19ffbccf36bb/definitions/inverter.yaml).

| Messaggio | Formato | ID CAN completo | Bit / byte |
| --- | --- | --- | --- |
| Inverter general data 1 | standard | `0x407` | 64 / 8 |
| Inverter general data 2 | standard | `0x427` | 32 / 4 |
| Inverter general data 3 | standard | `0x447` | 40 / 5 |
| Inverter general data 4 | standard | `0x467` | 64 / 8 |
| Inverter general data 5 | standard | `0x487` | 64 / 8 |
| Set inverter AC current | standard | `0x27` | 16 / 2 |
| Set inverter brake current | standard | `0x47` | 16 / 2 |
| Set inverter speed | standard | `0x67` | 32 / 4 |
| Set inverter position | standard | `0x87` | 16 / 2 |
| Set inverter relative current | standard | `0xA7` | 16 / 2 |
| Set inverter relative brake current | standard | `0xC7` | 16 / 2 |
| Set inverter digital output | standard | `0xE7` | 8 / 1 |
| Set inverter maximum AC current | standard | `0x107` | 16 / 2 |
| Set inverter maximum AC brake current | standard | `0x127` | 16 / 2 |
| Set inverter maximum DC current | standard | `0x147` | 16 / 2 |
| Set inverter maximum DC brake current | standard | `0x167` | 16 / 2 |
| Inverter drive enable | standard | `0x187` | 8 / 1 |

### Inverter general data 1

**ID CAN `0x407` · standard.** ERPM, duty cycle and input voltage.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| ERPM | 0 | i32 / 32 | 1 | ERPM | big (default) | Electrical RPM. Equation: ERPM = Motor RPM * number of the motor pole pairs. |
| Duty cycle | 32 | i16 / 16 | 10 | % | big (default) | The controller duty cycle. The sign of this value will represent whether the motor is running(positive) current or regenerating (negative) current. |
| Input voltage | 48 | i16 / 16 | 1 | V | big (default) | Input voltage is the DC voltage. |

### Inverter general data 2

**ID CAN `0x427` · standard.** AC and DC current.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| AC current | 0 | i16 / 16 | 10 | A_pk | big (default) | The motor current. The sign of this value represents whether the motor is running(positive) current or regenerating (negative) current. |
| DC current | 16 | i16 / 16 | 10 | A_dc | big (default) | DC Current: Current on DC side. The sign of this value represents whether the motor is running(positive) current or regenerating (negative) current. |

### Inverter general data 3

**ID CAN `0x447` · standard.** Controller temperature, motor temperature and status codes.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Controller temperature | 0 | i16 / 16 | 10 | °C | big (default) | Temperature of the inverter semiconductors. |
| Motor temperature | 16 | i16 / 16 | 10 | °C | big (default) | Temperature of the motor measured by the inverter. |
| Fault code | 32 | enum / 8 | 1 | — | big (default) | No fault; Overvoltage; Undervoltage; Transistor drive error; AC overcurrent; Controller overtemperature; Motor overtemperature; Sensor wire fault; Sensor general fault; CAN command error; Analog input error |

### Inverter general data 4

**ID CAN `0x467` · standard.** FOC algorithm components.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Id | 0 | i32 / 32 | 100 | A_pk | big (default) | FOC algorithm component I_d. |
| Iq | 32 | i32 / 32 | 100 | A_pk | big (default) | FOC algorithm component I_q. |

### Inverter general data 5

**ID CAN `0x487` · standard.** Signals, drive enable, limits, and version.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Throttle signal | 0 | i8 / 8 | 1 | % | big (default) | Throttle signal derived from analog inputs or CAN2. |
| Brake signal | 8 | i8 / 8 | 1 | % | big (default) | Brake signal derived from analog inputs or CAN2. |
| Digital input 1 | 16 | bool / 1 | 1 | — | big (default) | Digital input 1. Active high. |
| Digital input 2 | 17 | bool / 1 | 1 | — | big (default) | Digital input 2. Active high. |
| Digital input 3 | 18 | bool / 1 | 1 | — | big (default) | Digital input 3. Active high. |
| Digital input 4 | 19 | bool / 1 | 1 | — | big (default) | Digital input 4. Active high. |
| Digital output 1 | 20 | bool / 1 | 1 | — | big (default) | Digital output 1. Active high. |
| Digital output 2 | 21 | bool / 1 | 1 | — | big (default) | Digital output 2. Active high. |
| Digital output 3 | 22 | bool / 1 | 1 | — | big (default) | Digital output 3. Active high. |
| Digital output 4 | 23 | bool / 1 | 1 | — | big (default) | Digital output 4. Active high. |
| Drive enable | 24 | bool / 1 | 1 | — | big (default) | Drive enable. Active high. Drive can be enabled/disabled by the digital input or/and via CAN2 interface. |
| Reserved | 25 | padding / 7 | 1 | — | big (default) | Drive enable padding. |
| Capacitor temperature limit | 32 | bool / 1 | 1 | — | big (default) | The inverter can limit the output power to not to overheat the internal capacitors (only valid HW version 3.6 or newer). Active high. |
| DC current limit | 33 | bool / 1 | 1 | — | big (default) | DC current limit. Active high. |
| Drive enable limit | 34 | bool / 1 | 1 | — | big (default) | Indicates whether the drive enable limitation is active or inactive. Used for software development purposes. For true indication of the drive state please use byte 3, bit 24 of this message. |
| IGBT acceleration temperature limit | 35 | bool / 1 | 1 | — | big (default) | IGBT acceleration temperature limit. Active high. |
| IGBT temperature limit | 36 | bool / 1 | 1 | — | big (default) | IGBT temperature limit. Active high. |
| Input voltage limit | 37 | bool / 1 | 1 | — | big (default) | Input voltage limit. Active high. |
| Motor acceleration temperature limit | 38 | bool / 1 | 1 | — | big (default) | Motor acceleration temperature limit. Active high. |
| Motor temperature limit | 39 | bool / 1 | 1 | — | big (default) | Motor temperature limit. Active high. |
| RPM min limit | 40 | bool / 1 | 1 | — | big (default) | RPM min limit. Active high. |
| RPM max limit | 41 | bool / 1 | 1 | — | big (default) | RPM max limit. Active high. |
| Power limit | 42 | bool / 1 | 1 | — | big (default) | Power limit. Active high. |
| Reserved | 43 | padding / 5 | 1 | — | big (default) | Set to 0. |
| Reserved | 48 | padding / 8 | 1 | — | big (default) | Filled with FF's. For future use. |
| CAN map version | 56 | u8 / 8 | 1 | — | big (default) | Indicates the CAN map version. For example, 23 is v2.3 |

### Set inverter AC current

**ID CAN `0x27` · standard.** This command sets the target motor AC current (peak, not RMS). When the controller receives this message, it automatically switches to current control mode. This value must not be above the limits of the inverter and must be multiplied by 10 before sending. This is a signed parameter, and the sign represents the direction of the torque which correlates with the motor AC current (for the correlation, please refer to the motor parameters).

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| AC current | 0 | i16 / 16 | 10 | A_pk | big (default) | Target motor AC current (peak). |

### Set inverter brake current

**ID CAN `0x47` · standard.** Targets the brake current of the motor. It will result negative torque relatively to the forward direction of the motor. This value must be multiplied by 10 before sending, only positive currents are accepted.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Target brake current | 0 | i16 / 16 | 10 | A_pk | big (default) | Target brake current (peak). |

### Set inverter speed

**ID CAN `0x67` · standard.** This command enables the speed control of the motor with a target ERPM. This is a signed parameter, and the sign represents the direction of the spinning. For better operation you need to tune the PID of speed control. Equation: ERPM = Motor RPM * number of the motor pole pairs.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Target ERPM | 0 | i32 / 32 | 1 | ERPM | big (default) | Target ERPM. |

### Set inverter position

**ID CAN `0x87` · standard.** This value targets the desired position of the motor in degrees. This command is used to hold a position of the motor. This feature is enabled only if encoder is used as position sensor. The value has to be multiplied by 10 before sending.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Target position | 0 | i16 / 16 | 10 | ° | big (default) | Target position. |

### Set inverter relative current

**ID CAN `0xA7` · standard.** This command sets a relative AC current to the minimum and maximum limits set by configuration. This achieves the same function as the “Set AC current” command. Gives you a freedom to send values between -100,0% and 100,0%. You do not need to know the motor limit parameters. This value must be between -100 and 100 and must be multiplied by 10 before sending.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Target relative AC current | 0 | i16 / 16 | 10 | % | big (default) | Target relative AC current. |

### Set inverter relative brake current

**ID CAN `0xC7` · standard.** Targets the relative brake current of the motor. It will result negative torque relatively to the forward direction of the motor. This value must be between 0 and 100 and must be multiplied by 10 before sending Gives you a freedom to send values between 0% and 100,0%. You do not need to know the motor limit parameters. This value must be between 0 and 100 and has to be multiplied by 10 before sending.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Target relative brake AC current | 0 | i16 / 16 | 10 | % | big (default) | Target relative brake AC current. |

### Set inverter digital output

**ID CAN `0xE7` · standard.** Sets a digital output to a desired state.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Padding | 0 | padding / 4 | 1 | — | big (default) | Set to 0. |
| Digital output 4 | 4 | bool / 1 | 1 | — | big (default) | Sets the digital output 4 to HIGH (1) or LOW (0) state. |
| Digital output 3 | 5 | bool / 1 | 1 | — | big (default) | Sets the digital output 3 to HIGH (1) or LOW (0) state. |
| Digital output 2 | 6 | bool / 1 | 1 | — | big (default) | Sets the digital output 2 to HIGH (1) or LOW (0) state. |
| Digital output 1 | 7 | bool / 1 | 1 | — | big (default) | Sets the digital output 1 to HIGH (1) or LOW (0) state. |

### Set inverter maximum AC current

**ID CAN `0x107` · standard.** This value determines the maximum allowable drive current on the AC side. With this function you are able maximize the maximum torque on the motor. The value must be multiplied by 10 before sending.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Maximum AC current | 0 | i16 / 16 | 10 | A_pk | big (default) | Maximum AC current. |

### Set inverter maximum AC brake current

**ID CAN `0x127` · standard.** This value sets the maximum allowable brake current on the AC side. This value must be multiplied by 10 before sending, only negative currents are accepted.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Maximum brake AC current | 0 | i16 / 16 | 10 | A_pk | big (default) | Maximum brake AC current. |

### Set inverter maximum DC current

**ID CAN `0x147` · standard.** This value determines the maximum allowable drive current on the DC side. With this command the BMS can limit the maximum allowable battery discharge current. The value has to be multiplied by 10 before sending.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Maximum DC current | 0 | i16 / 16 | 10 | A | big (default) | Maximum DC current. |

### Set inverter maximum DC brake current

**ID CAN `0x167` · standard.** This value determines the maximum allowable brake current on the DC side. With this command the BMS can limit the maximum allowable battery charge current. The value has to be multiplied by 10 before sending. Only negative currents are accepted.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Maximum brake DC current | 0 | i16 / 16 | 10 | A | big (default) | Maximum brake DC current. |

### Inverter drive enable

**ID CAN `0x187` · standard.** 0: Drive not allowed; 1: Drive allowed. Only 0 and 1 values are accepted. Must be sent periodically to be enabled. Refer to chapter 4.3 of the datasheet.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Padding | 0 | padding / 7 | 1 | — | big (default) | Set to 0. |
| Drive enable | 7 | bool / 1 | 1 | — | big (default) | Enables the motor drive. |

## lv_bms

Fonte: [definitions/lv_bms.yaml](https://github.com/uniuderacing/serena-messages/blob/f7cbf162f1720c0c1dbaccd9f68a19ffbccf36bb/definitions/lv_bms.yaml).

| Messaggio | Formato | ID CAN completo | Bit / byte |
| --- | --- | --- | --- |
| LV cell voltages | standard | `0x744` | 64 / 8 |
| LV status 1 | standard | `0x766` | 64 / 8 |
| LV status 2 | standard | `0x797` | 56 / 7 |
| Fuse status | standard | `0x7A4` | 16 / 2 |

### LV cell voltages

**ID CAN `0x744` · standard.** Cell voltages of the LV battery.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Cell 1 voltage | 0 | u16 / 16 | 1 | mV | big (default) | Voltage of cell 1. |
| Cell 2 voltage | 16 | u16 / 16 | 1 | mV | big (default) | Voltage of cell 2. |
| Cell 3 voltage | 32 | u16 / 16 | 1 | mV | big (default) | Voltage of cell 3. |
| Cell 4 voltage | 48 | u16 / 16 | 1 | mV | big (default) | Voltage of cell 4 |

### LV status 1

**ID CAN `0x766` · standard.** General status of the LV battery.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Voltage | 0 | u16 / 16 | 1 | mV | big (default) | Voltage of the LV battery. |
| Current | 16 | i32 / 32 | 1 | mA | big (default) | Current being drawn from the LV battery. |
| Temperature | 48 | i16 / 16 | 100 | °C | big (default) | Temperature of the LV battery. |

### LV status 2

**ID CAN `0x797` · standard.** General status of the LV battery.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| SoC | 0 | u16 / 16 | 100 | % | big (default) | State of charge of the LV battery. |
| SoH | 16 | u16 / 16 | 100 | % | big (default) | State of health of the LV battery. |
| Time to empty | 32 | u16 / 16 | 1 | s | big (default) | Remaining time before the LV battery completely discharges. |
| Status | 48 | enum / 8 | 1 | — | big (default) | Unknown; Idle; Charging; Discharging |

### Fuse status

**ID CAN `0x7A4` · standard.** Status of the fuses.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| F1 | 0 | bool / 1 | 1 | — | big (default) | Status of the fuse F1. |
| F2 | 1 | bool / 1 | 1 | — | big (default) | Status of the fuse F2. |
| F3 | 2 | bool / 1 | 1 | — | big (default) | Status of the fuse F3. |
| F4 | 3 | bool / 1 | 1 | — | big (default) | Status of the fuse F4. |
| F5 | 4 | bool / 1 | 1 | — | big (default) | Status of the fuse F5. |
| F6 | 5 | bool / 1 | 1 | — | big (default) | Status of the fuse F6. |
| F7 | 6 | bool / 1 | 1 | — | big (default) | Status of the fuse F7. |
| F8 | 7 | bool / 1 | 1 | — | big (default) | Status of the fuse F8. |
| F9 | 8 | bool / 1 | 1 | — | big (default) | Status of the fuse F9. |
| Padding | 9 | padding / 7 | 1 | — | big (default) | Padding. |

## telemetry

Fonte: [definitions/telemetry.yaml](https://github.com/uniuderacing/serena-messages/blob/f7cbf162f1720c0c1dbaccd9f68a19ffbccf36bb/definitions/telemetry.yaml).

| Messaggio | Formato | ID CAN completo | Bit / byte |
| --- | --- | --- | --- |
| SD card status | extended | `0x100103` | 8 / 1 |
| Vehicle Attitude 1 | extended | `0x100104` | 64 / 8 |
| Vehicle Attitude 2 | extended | `0x100105` | 64 / 8 |
| Vehicle dynamics 1 | extended | `0x100106` | 64 / 8 |
| Vehicle dynamics 2 | extended | `0x3C0107` | 64 / 8 |
| Vehicle dynamics 3 | extended | `0x3C0108` | 64 / 8 |
| Raw X Angular Rate | extended | `0x10010F` | 32 / 4 |
| Raw Y Angular Rate | extended | `0x100110` | 32 / 4 |
| Raw Z Angular Rate | extended | `0x100111` | 32 / 4 |
| Raw X Acceleration | extended | `0x100112` | 32 / 4 |
| Raw Y Acceleration | extended | `0x100113` | 32 / 4 |
| Raw Z Acceleration | extended | `0x100114` | 32 / 4 |
| Position 1 | extended | `0x100109` | 64 / 8 |
| Position 2 | extended | `0x10010A` | 64 / 8 |
| Velocity 1 | extended | `0x10010B` | 64 / 8 |
| Velocity 2 | extended | `0x10010C` | 64 / 8 |
| Odometer solution | extended | `0x10010D` | 64 / 8 |
| Lap report 1 | extended | `0x10010E` | 64 / 8 |
| Lap report 2 | standard | `0x6D7` | 48 / 6 |
| Steering angle | standard | `0x6E4` | 32 / 4 |
| Front wheels tick frequency | standard | `0x704` | 32 / 4 |

### SD card status

**ID CAN `0x100103` · extended.** SD card status.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| SD card status | 0 | bool / 1 | 1 | — | big (default) | Status of the SD card (connected or disconnected). |
| Padding | 1 | padding / 7 | 1 | — | big (default) | Padding of 7 bits |

### Vehicle Attitude 1

**ID CAN `0x100104` · extended.** This message outputs the attitude solution as roll, pitch and heading angles.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Roll | 0 | i32 / 32 | 100 | mdeg | big (default) | Roll angle in milli-degrees. |
| Pitch | 32 | i32 / 32 | 100 | mdeg | big (default) | Pitch angle in milli-degrees. |

### Vehicle Attitude 2

**ID CAN `0x100105` · extended.** This message outputs the attitude solution as roll, pitch and heading angles.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Heading | 0 | i32 / 32 | 100 | mdeg | big (default) | Heading angle in milli-degrees. |
| Heading Accuracy | 32 | u16 / 16 | 100 | mdeg | big (default) | Roll angle accuracy in milli-degrees. |
| Roll Accuracy | 48 | u16 / 16 | 100 | mdeg | big (default) | Roll angle accuracy in milli-degrees. |

### Vehicle dynamics 1

**ID CAN `0x100106` · extended.** This message outputs high rate information about vehicle dynamics computed by the Inertial Navigation System (INS) during ESF-based navigation.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| X Angular Rate | 0 | i32 / 32 | 1000 | deg/s | big (default) | Compensated x-axis angular rate. |
| Y Angular Rate | 32 | i32 / 32 | 1000 | deg/s | big (default) | Compensated y-axis angular rate. |

### Vehicle dynamics 2

**ID CAN `0x3C0107` · extended.** This message outputs high rate information about vehicle dynamics computed by the Inertial Navigation System (INS) during ESF-based navigation.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Z Angular Rate | 0 | i32 / 32 | 1000 | deg/s | big (default) | Compensated z-axis angular rate. |
| X Acceleration | 32 | i32 / 32 | 100 | m/s^2 | big (default) | Compensated x-axis acceleration (with gravity). |

### Vehicle dynamics 3

**ID CAN `0x3C0108` · extended.** This message outputs high rate information about vehicle dynamics computed by the Inertial Navigation System (INS) during ESF-based navigation.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Y Acceleration | 0 | i32 / 32 | 100 | m/s^2 | big (default) | Compensated y-axis acceleration (with gravity). |
| Z Acceleration | 32 | i32 / 32 | 100 | m/s^2 | big (default) | Compensated z-axis acceleration (with gravity). |

### Raw X Angular Rate

**ID CAN `0x10010F` · extended.** x-axis gyroscope angular rate.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| X Angular Rate | 0 | i32 / 32 | 1000 | deg/s | big (default) | x-axis gyroscope angular rate. |

### Raw Y Angular Rate

**ID CAN `0x100110` · extended.** y-axis gyroscope angular rate.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Y Angular Rate | 0 | i32 / 32 | 1000 | deg/s | big (default) | y-axis gyroscope angular rate. |

### Raw Z Angular Rate

**ID CAN `0x100111` · extended.** z-axis gyroscope angular rate.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Z Angular Rate | 0 | i32 / 32 | 1000 | deg/s | big (default) | z-axis gyroscope angular rate. |

### Raw X Acceleration

**ID CAN `0x100112` · extended.** x-axis accelerometer specific force

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| X Acceleration | 0 | i32 / 32 | 100 | m/s^2 | big (default) | x-axis accelerometer specific force |

### Raw Y Acceleration

**ID CAN `0x100113` · extended.** y-axis accelerometer specific force

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Y Acceleration | 0 | i32 / 32 | 100 | m/s^2 | big (default) | y-axis accelerometer specific force |

### Raw Z Acceleration

**ID CAN `0x100114` · extended.** z-axis accelerometer specific force

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Z Acceleration | 0 | i32 / 32 | 100 | m/s^2 | big (default) | z-axis accelerometer specific force |

### Position 1

**ID CAN `0x100109` · extended.** Position of the vehicle

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| longitude | 0 | i32 / 32 | 10000 | mdeg | big (default) | Longitude in milli-degrees. |
| latitude | 32 | i32 / 32 | 10000 | mdeg | big (default) | Latitude in milli-degrees. |

### Position 2

**ID CAN `0x10010A` · extended.** Position of the vehicle

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| height | 0 | i32 / 32 | 1 | mm | big (default) | Height in meters. |
| Horizontal Accuracy | 32 | u32 / 32 | 1 | mm | big (default) | Horizontal Accuracy |

### Velocity 1

**ID CAN `0x10010B` · extended.** Velocity of the vehicle

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Ground speed | 0 | i32 / 32 | 1 | mm/s | big (default) | Ground Speed (2-D) |
| Speed | 32 | i32 / 32 | 1 | mm/s | big (default) | Speed (3-D) |

### Velocity 2

**ID CAN `0x10010C` · extended.** Velocity of the vehicle

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Heading of motion | 0 | i32 / 32 | 100 | mdeg | big (default) | Heading of motion (2-D) |
| Heading of vehicle | 32 | i32 / 32 | 100 | mdeg | big (default) | Heading of vehicle (2-D) |

### Odometer solution

**ID CAN `0x10010D` · extended.** Odometer solution

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Distance | 0 | u32 / 32 | 1 | m | big (default) | Ground distance since last reset |
| Odometer accuracy | 32 | u32 / 32 | 1 | m | big (default) | Ground distance accuracy (1-sigma) |

### Lap report 1

**ID CAN `0x10010E` · extended.** Summary about lap count and times.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Reference point X | 0 | i32 / 32 | 10000 | mdeg | big (default) | The X coordinate of the reference point used to count laps. |
| Reference point Y | 32 | i32 / 32 | 10000 | mdeg | big (default) | The Y coordinate of the reference point used to count laps. |

### Lap report 2

**ID CAN `0x6D7` · standard.** Summary about lap count and times.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Lap count | 0 | u16 / 16 | 1 | — | big (default) | The total number of laps performed. |
| Last lap time | 16 | u32 / 32 | 1 | ms | big (default) | The time taken to complete the last lap. |

### Steering angle

**ID CAN `0x6E4` · standard.** The steering angle.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| angle | 0 | i32 / 32 | 10000 | deg | big (default) | The steering angle. |

### Front wheels tick frequency

**ID CAN `0x704` · standard.** The front wheels tick frequency.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Front left tick | 0 | u16 / 16 | 1000 | Hz | big (default) | Front left wheel tick frequency per second. |
| Front right tick | 16 | u16 / 16 | 1000 | Hz | big (default) | Front right wheel tick frequency per second. |

## tsac_unit

Fonte: [definitions/tsac_unit.yaml](https://github.com/uniuderacing/serena-messages/blob/f7cbf162f1720c0c1dbaccd9f68a19ffbccf36bb/definitions/tsac_unit.yaml).

| Messaggio | Formato | ID CAN completo | Bit / byte |
| --- | --- | --- | --- |
| BMS current | standard | `0x204` | 32 / 4 |
| BMS cell voltage | standard | `0x224` | 24 / 3 |
| BMS cell temperature | standard | `0x244` | 32 / 4 |
| BMS slaves die | standard | `0x264` | 56 / 7 |
| BMS slaves power supply | standard | `0x284` | 56 / 7 |
| BMS discharging cells | standard | `0x2A4` | 56 / 7 |
| Soc | standard | `0x2D7` | 64 / 8 |
| Precharge status | standard | `0x2EF` | 40 / 5 |
| TSAC cooling status | standard | `0x1E4` | 40 / 5 |
| TSAC cutoff current | standard | `0x60F` | 16 / 2 |

### BMS current

**ID CAN `0x204` · standard.** The total current value of the TSAC. Positive during discharge, negative in charge.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Current | 0 | i32 / 32 | 1000 | A | big (default) | Current value |

### BMS cell voltage

**ID CAN `0x224` · standard.** The voltage of a parallel inside the TSAC.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Segment identifier | 0 | bitfield / 4 | 1 | — | big (default) | Segment identifier. |
| Parallel identifier | 4 | bitfield / 4 | 1 | — | big (default) | The parallel identifier inside the specified segment. |
| Voltage | 8 | u16 / 16 | 10000 | V | big (default) | Voltage of the specified parallel. |

### BMS cell temperature

**ID CAN `0x244` · standard.** The temperature of a thermometer inside the TSAC.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Segment identifier | 0 | bitfield / 4 | 1 | — | big (default) | Segment identifier. |
| Thermometer identifier | 4 | bitfield / 5 | 1 | — | big (default) | First thermometer identifier. |
| Thermometer padding | 9 | padding / 7 | 1 | — | big (default) | Padding. |
| Temperature | 16 | i16 / 16 | 100 | °C | big (default) | Temperature of the specified thermometer. |

### BMS slaves die

**ID CAN `0x264` · standard.** BMS slave chips die data.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Segment padding | 0 | padding / 4 | 1 | — | big (default) | Padding. |
| Segment identifier | 4 | bitfield / 4 | 1 | — | big (default) | Segment identifier. |
| Total voltage | 8 | u16 / 16 | 100 | V | big (default) | Total voltage of the segment. |
| Die temperature | 24 | i16 / 16 | 100 | °C | big (default) | Temperature of the die. |
| S1n to Vminus | 40 | u16 / 16 | 100 | V | big (default) | Total voltage from s1n to V- |

### BMS slaves power supply

**ID CAN `0x284` · standard.** BMS slave chips power supply data.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Segment padding | 0 | padding / 4 | 1 | — | big (default) | Padding. |
| Segment identifier | 4 | bitfield / 4 | 1 | — | big (default) | Segment identifier. |
| Analog supply voltage | 8 | u16 / 16 | 100 | V | big (default) | Analog input supply voltage. |
| Digital supply voltage | 24 | u16 / 16 | 100 | V | big (default) | Digital input supply voltage. |
| Second reference | 40 | u16 / 16 | 100 | V | big (default) | Voltage of the second reference |

### BMS discharging cells

**ID CAN `0x2A4` · standard.** The cells that are currently discharging.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Segment identifier | 0 | bitfield / 4 | 1 | — | big (default) | Segment identifier. |
| Upper voltage threshold | 4 | u16 / 16 | 10000 | V | big (default) | Upper voltage hysteresis threshold. |
| Lower voltage threshold | 20 | u16 / 16 | 10000 | V | big (default) | Lower voltage hysteresis threshold. |
| Parallel 1 discharging | 36 | bool / 1 | 1 | — | big (default) | Whether the first parallel is discharging. |
| Parallel 2 discharging | 37 | bool / 1 | 1 | — | big (default) | Whether the second parallel is discharging. |
| Parallel 3 discharging | 38 | bool / 1 | 1 | — | big (default) | Whether the third parallel is discharging. |
| Parallel 4 discharging | 39 | bool / 1 | 1 | — | big (default) | Whether the fourth parallel is discharging. |
| Parallel 5 discharging | 40 | bool / 1 | 1 | — | big (default) | Whether the fifth parallel is discharging. |
| Parallel 6 discharging | 41 | bool / 1 | 1 | — | big (default) | Whether the sixth parallel is discharging. |
| Parallel 7 discharging | 42 | bool / 1 | 1 | — | big (default) | Whether the seventh parallel is discharging. |
| Parallel 8 discharging | 43 | bool / 1 | 1 | — | big (default) | Whether the eighth parallel is discharging. |
| Parallel 9 discharging | 44 | bool / 1 | 1 | — | big (default) | Whether the ninth parallel is discharging. |
| Parallel 10 discharging | 45 | bool / 1 | 1 | — | big (default) | Whether the tenth parallel is discharging. |
| Parallel 11 discharging | 46 | bool / 1 | 1 | — | big (default) | Whether the eleventh parallel is discharging. |
| Parallel 12 discharging | 47 | bool / 1 | 1 | — | big (default) | Whether the twelfth parallel is discharging. |
| Parallel 13 discharging | 48 | bool / 1 | 1 | — | big (default) | Whether the thirteenth parallel is discharging. |
| Parallel 14 discharging | 49 | bool / 1 | 1 | — | big (default) | Whether the fourteenth parallel is discharging. |
| Padding | 50 | padding / 6 | 1 | — | big (default) | Padding. |

### Soc

**ID CAN `0x2D7` · standard.** The state of charge of the TSAC.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Soc | 0 | u32 / 32 | 1000 | % | big (default) | The state of charge of the TSAC. |
| Last soc with voltage | 32 | u32 / 32 | 1000 | % | big (default) | The last state of charge calculated with voltage. |

### Precharge status

**ID CAN `0x2EF` · standard.** Precharge infos.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| V bat | 0 | u16 / 16 | 100 | V | big (default) | Battery voltage |
| V bus | 16 | u16 / 16 | 100 | V | big (default) | Bus voltage |
| Air minus status | 32 | bool / 1 | 1 | — | big (default) | Air minus status |
| Air plus status | 33 | bool / 1 | 1 | — | big (default) | Air plus status |
| Precharge relay status | 34 | bool / 1 | 1 | — | big (default) | Precharge relay status |
| Padding | 35 | padding / 5 | 1 | — | big (default) | A padding of 6 bits. |

### TSAC cooling status

**ID CAN `0x1E4` · standard.** Status of the TSAC cooling system.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Fan speed | 0 | u16 / 16 | 1 | RPM | big (default) | Speed read from TSAC fan |
| Speed target | 16 | u16 / 16 | 1 | RPM | big (default) | Speed target of the fans. |
| Gate SiC feedback | 32 | bool / 1 | 1 | — | big (default) | SiC Gate-Driver Ready Feedback. High means that the Driver is ready to receive the closing signal |
| Supply SiC feedback | 33 | bool / 1 | 1 | — | big (default) | SiC supply generation feedback. High means everything is fine, low if there are problems |
| Ready SiC feedback | 34 | bool / 1 | 1 | — | big (default) | SiC Gate-Driver Ready Feedback. High means the Driver is ready to receive the closing signal. |
| Padding | 35 | padding / 5 | 1 | — | big (default) | A padding of 5 bits. |

### TSAC cutoff current

**ID CAN `0x60F` · standard.** Message to set the cutoff current of the TSAC. Current grater than this value should not be sent.

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Cutoff current | 0 | u16 / 16 | 10 | A | big (default) | Current grater than this value should not be sent. |

## tyre_brake_temps

Fonte: [definitions/tyre_brake_temps.yaml](https://github.com/uniuderacing/serena-messages/blob/f7cbf162f1720c0c1dbaccd9f68a19ffbccf36bb/definitions/tyre_brake_temps.yaml).

| Messaggio | Formato | ID CAN completo | Bit / byte |
| --- | --- | --- | --- |
| Temperature 1 F L Tire | standard raw | `0x310` | 64 / 8 |
| Temperature 2 F L Tire | standard raw | `0x311` | 64 / 8 |
| Temperature 3 F L Tire | standard raw | `0x312` | 64 / 8 |
| Temperature 4 F L Tire | standard raw | `0x313` | 64 / 8 |
| Temperature 1 F R Tire | standard raw | `0x330` | 64 / 8 |
| Temperature 2 F R Tire | standard raw | `0x331` | 64 / 8 |
| Temperature 3 F R Tire | standard raw | `0x332` | 64 / 8 |
| Temperature 4 F R Tire | standard raw | `0x333` | 64 / 8 |
| Temperature 1 R L Tire | standard raw | `0x350` | 64 / 8 |
| Temperature 2 R L Tire | standard raw | `0x351` | 64 / 8 |
| Temperature 3 R L Tire | standard raw | `0x352` | 64 / 8 |
| Temperature 4 R L Tire | standard raw | `0x353` | 64 / 8 |
| Temperature 1 R R Tire | standard raw | `0x370` | 64 / 8 |
| Temperature 2 R R Tire | standard raw | `0x371` | 64 / 8 |
| Temperature 3 R R Tire | standard raw | `0x372` | 64 / 8 |
| Temperature 4 R R Tire | standard raw | `0x373` | 64 / 8 |
| Temperature 1 F L Brake | standard raw | `0x510` | 64 / 8 |
| Temperature 2 F L Brake | standard raw | `0x511` | 64 / 8 |
| Temperature 3 F L Brake | standard raw | `0x512` | 64 / 8 |
| Temperature 4 F L Brake | standard raw | `0x513` | 64 / 8 |
| Temperature 1 F R Brake | standard raw | `0x530` | 64 / 8 |
| Temperature 2 F R Brake | standard raw | `0x531` | 64 / 8 |
| Temperature 3 F R Brake | standard raw | `0x532` | 64 / 8 |
| Temperature 4 F R Brake | standard raw | `0x533` | 64 / 8 |
| Temperature 1 R L Brake | standard raw | `0x550` | 64 / 8 |
| Temperature 2 R L Brake | standard raw | `0x551` | 64 / 8 |
| Temperature 3 R L Brake | standard raw | `0x552` | 64 / 8 |
| Temperature 4 R L Brake | standard raw | `0x553` | 64 / 8 |
| Temperature 1 R R Brake | standard raw | `0x570` | 64 / 8 |
| Temperature 2 R R Brake | standard raw | `0x571` | 64 / 8 |
| Temperature 3 R R Brake | standard raw | `0x572` | 64 / 8 |
| Temperature 4 R R Brake | standard raw | `0x573` | 64 / 8 |

### Temperature 1 F L Tire

**ID CAN `0x310` · standard raw.** Data temperature of channel from 1 to 4 for the front left tire. Subtract 200 to get the real value

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Temp ch 1 | 0 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 2 | 16 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 3 | 32 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 4 | 48 | u16 / 16 | 10 | — | big (default) |  |

### Temperature 2 F L Tire

**ID CAN `0x311` · standard raw.** Data temperature of channel from 5 to 8 for the front left tire. Subtract 200 to get the real value

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Temp ch 5 | 0 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 6 | 16 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 7 | 32 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 8 | 48 | u16 / 16 | 10 | — | big (default) |  |

### Temperature 3 F L Tire

**ID CAN `0x312` · standard raw.** Data temperature of channel from 9 to 12 for the front left tire. Subtract 200 to get the real value

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Temp ch 9 | 0 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 10 | 16 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 11 | 32 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 12 | 48 | u16 / 16 | 10 | — | big (default) |  |

### Temperature 4 F L Tire

**ID CAN `0x313` · standard raw.** Data temperature of channel from 13 to 16 for the front left tire. Subtract 200 to get the real value

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Temp ch 13 | 0 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 14 | 16 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 15 | 32 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 16 | 48 | u16 / 16 | 10 | — | big (default) |  |

### Temperature 1 F R Tire

**ID CAN `0x330` · standard raw.** Data temperature of channel from 1 to 4 for the front left tire. Subtract 200 to get the real value

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Temp ch 1 | 0 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 2 | 16 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 3 | 32 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 4 | 48 | u16 / 16 | 10 | — | big (default) |  |

### Temperature 2 F R Tire

**ID CAN `0x331` · standard raw.** Data temperature of channel from 5 to 8 for the front left tire. Subtract 200 to get the real value

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Temp ch 5 | 0 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 6 | 16 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 7 | 32 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 8 | 48 | u16 / 16 | 10 | — | big (default) |  |

### Temperature 3 F R Tire

**ID CAN `0x332` · standard raw.** Data temperature of channel from 9 to 12 for the front left tire. Subtract 200 to get the real value

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Temp ch 9 | 0 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 10 | 16 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 11 | 32 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 12 | 48 | u16 / 16 | 10 | — | big (default) |  |

### Temperature 4 F R Tire

**ID CAN `0x333` · standard raw.** Data temperature of channel from 13 to 16 for the front left tire. Subtract 200 to get the real value

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Temp ch 13 | 0 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 14 | 16 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 15 | 32 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 16 | 48 | u16 / 16 | 10 | — | big (default) |  |

### Temperature 1 R L Tire

**ID CAN `0x350` · standard raw.** Data temperature of channel from 1 to 4 for the front left tire. Subtract 200 to get the real value

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Temp ch 1 | 0 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 2 | 16 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 3 | 32 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 4 | 48 | u16 / 16 | 10 | — | big (default) |  |

### Temperature 2 R L Tire

**ID CAN `0x351` · standard raw.** Data temperature of channel from 5 to 8 for the front left tire. Subtract 200 to get the real value

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Temp ch 5 | 0 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 6 | 16 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 7 | 32 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 8 | 48 | u16 / 16 | 10 | — | big (default) |  |

### Temperature 3 R L Tire

**ID CAN `0x352` · standard raw.** Data temperature of channel from 9 to 12 for the front left tire. Subtract 200 to get the real value

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Temp ch 9 | 0 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 10 | 16 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 11 | 32 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 12 | 48 | u16 / 16 | 10 | — | big (default) |  |

### Temperature 4 R L Tire

**ID CAN `0x353` · standard raw.** Data temperature of channel from 13 to 16 for the front left tire. Subtract 200 to get the real value

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Temp ch 13 | 0 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 14 | 16 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 15 | 32 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 16 | 48 | u16 / 16 | 10 | — | big (default) |  |

### Temperature 1 R R Tire

**ID CAN `0x370` · standard raw.** Data temperature of channel from 1 to 4 for the front left tire. Subtract 200 to get the real value

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Temp ch 1 | 0 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 2 | 16 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 3 | 32 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 4 | 48 | u16 / 16 | 10 | — | big (default) |  |

### Temperature 2 R R Tire

**ID CAN `0x371` · standard raw.** Data temperature of channel from 5 to 8 for the front left tire. Subtract 200 to get the real value

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Temp ch 5 | 0 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 6 | 16 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 7 | 32 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 8 | 48 | u16 / 16 | 10 | — | big (default) |  |

### Temperature 3 R R Tire

**ID CAN `0x372` · standard raw.** Data temperature of channel from 9 to 12 for the front left tire. Subtract 200 to get the real value

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Temp ch 9 | 0 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 10 | 16 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 11 | 32 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 12 | 48 | u16 / 16 | 10 | — | big (default) |  |

### Temperature 4 R R Tire

**ID CAN `0x373` · standard raw.** Data temperature of channel from 13 to 16 for the front left tire. Subtract 200 to get the real value

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Temp ch 13 | 0 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 14 | 16 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 15 | 32 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 16 | 48 | u16 / 16 | 10 | — | big (default) |  |

### Temperature 1 F L Brake

**ID CAN `0x510` · standard raw.** Data temperature of channel from 1 to 4 for the front left tire. Subtract 200 to get the real value

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Temp ch 1 | 0 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 2 | 16 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 3 | 32 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 4 | 48 | u16 / 16 | 10 | — | big (default) |  |

### Temperature 2 F L Brake

**ID CAN `0x511` · standard raw.** Data temperature of channel from 5 to 8 for the front left tire. Subtract 200 to get the real value

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Temp ch 5 | 0 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 6 | 16 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 7 | 32 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 8 | 48 | u16 / 16 | 10 | — | big (default) |  |

### Temperature 3 F L Brake

**ID CAN `0x512` · standard raw.** Data temperature of channel from 9 to 12 for the front left tire. Subtract 200 to get the real value

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Temp ch 9 | 0 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 10 | 16 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 11 | 32 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 12 | 48 | u16 / 16 | 10 | — | big (default) |  |

### Temperature 4 F L Brake

**ID CAN `0x513` · standard raw.** Data temperature of channel from 13 to 16 for the front left tire. Subtract 200 to get the real value

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Temp ch 13 | 0 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 14 | 16 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 15 | 32 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 16 | 48 | u16 / 16 | 10 | — | big (default) |  |

### Temperature 1 F R Brake

**ID CAN `0x530` · standard raw.** Data temperature of channel from 1 to 4 for the front left tire. Subtract 200 to get the real value

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Temp ch 1 | 0 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 2 | 16 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 3 | 32 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 4 | 48 | u16 / 16 | 10 | — | big (default) |  |

### Temperature 2 F R Brake

**ID CAN `0x531` · standard raw.** Data temperature of channel from 5 to 8 for the front left tire. Subtract 200 to get the real value

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Temp ch 5 | 0 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 6 | 16 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 7 | 32 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 8 | 48 | u16 / 16 | 10 | — | big (default) |  |

### Temperature 3 F R Brake

**ID CAN `0x532` · standard raw.** Data temperature of channel from 9 to 12 for the front left tire. Subtract 200 to get the real value

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Temp ch 9 | 0 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 10 | 16 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 11 | 32 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 12 | 48 | u16 / 16 | 10 | — | big (default) |  |

### Temperature 4 F R Brake

**ID CAN `0x533` · standard raw.** Data temperature of channel from 13 to 16 for the front left tire. Subtract 200 to get the real value

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Temp ch 13 | 0 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 14 | 16 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 15 | 32 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 16 | 48 | u16 / 16 | 10 | — | big (default) |  |

### Temperature 1 R L Brake

**ID CAN `0x550` · standard raw.** Data temperature of channel from 1 to 4 for the front left tire. Subtract 200 to get the real value

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Temp ch 1 | 0 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 2 | 16 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 3 | 32 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 4 | 48 | u16 / 16 | 10 | — | big (default) |  |

### Temperature 2 R L Brake

**ID CAN `0x551` · standard raw.** Data temperature of channel from 5 to 8 for the front left tire. Subtract 200 to get the real value

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Temp ch 5 | 0 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 6 | 16 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 7 | 32 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 8 | 48 | u16 / 16 | 10 | — | big (default) |  |

### Temperature 3 R L Brake

**ID CAN `0x552` · standard raw.** Data temperature of channel from 9 to 12 for the front left tire. Subtract 200 to get the real value

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Temp ch 9 | 0 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 10 | 16 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 11 | 32 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 12 | 48 | u16 / 16 | 10 | — | big (default) |  |

### Temperature 4 R L Brake

**ID CAN `0x553` · standard raw.** Data temperature of channel from 13 to 16 for the front left tire. Subtract 200 to get the real value

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Temp ch 13 | 0 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 14 | 16 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 15 | 32 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 16 | 48 | u16 / 16 | 10 | — | big (default) |  |

### Temperature 1 R R Brake

**ID CAN `0x570` · standard raw.** Data temperature of channel from 1 to 4 for the front left tire. Subtract 200 to get the real value

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Temp ch 1 | 0 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 2 | 16 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 3 | 32 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 4 | 48 | u16 / 16 | 10 | — | big (default) |  |

### Temperature 2 R R Brake

**ID CAN `0x571` · standard raw.** Data temperature of channel from 5 to 8 for the front left tire. Subtract 200 to get the real value

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Temp ch 5 | 0 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 6 | 16 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 7 | 32 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 8 | 48 | u16 / 16 | 10 | — | big (default) |  |

### Temperature 3 R R Brake

**ID CAN `0x572` · standard raw.** Data temperature of channel from 9 to 12 for the front left tire. Subtract 200 to get the real value

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Temp ch 9 | 0 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 10 | 16 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 11 | 32 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 12 | 48 | u16 / 16 | 10 | — | big (default) |  |

### Temperature 4 R R Brake

**ID CAN `0x573` · standard raw.** Data temperature of channel from 13 to 16 for the front left tire. Subtract 200 to get the real value

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| Temp ch 13 | 0 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 14 | 16 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 15 | 32 | u16 / 16 | 10 | — | big (default) |  |
| Temp ch 16 | 48 | u16 / 16 | 10 | — | big (default) |  |

## tyre_brake_temps_config

Fonte: [definitions/tyre_brake_temps_config.yaml](https://github.com/uniuderacing/serena-messages/blob/f7cbf162f1720c0c1dbaccd9f68a19ffbccf36bb/definitions/tyre_brake_temps_config.yaml).

| Messaggio | Formato | ID CAN completo | Bit / byte |
| --- | --- | --- | --- |
| Temp sensor cfg request | standard raw | `0x300` | 64 / 8 |
| Temp sensor cfg response | standard raw | `0x301` | 64 / 8 |
| Sensor data summary F L Tire | standard raw | `0x314` | 64 / 8 |
| Sensor data summary F R Tire | standard raw | `0x334` | 64 / 8 |
| Sensor data summary R L Tire | standard raw | `0x354` | 64 / 8 |
| Sensor data summary R R Tire | standard raw | `0x374` | 64 / 8 |
| Sensor data summary F L Brake | standard raw | `0x514` | 64 / 8 |
| Sensor data summary F R Brake | standard raw | `0x534` | 64 / 8 |
| Sensor data summary R L Brake | standard raw | `0x554` | 64 / 8 |
| Sensor data summary R R Brake | standard raw | `0x574` | 64 / 8 |

### Temp sensor cfg request

**ID CAN `0x300` · standard raw.** Configuration message to the device

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| New Base Id | 0 | u16 / 16 | 1 | — | big (default) | New base ID for CAN messages |
| Emissivity | 16 | u8 / 8 | 100 | — | big (default) | Material emissivity in range from 0 to 1 |
| Sample Rate | 24 | u8 / 8 | 1 | Hz | big (default) | Sample frequency of the temperature from 1 to 64 hz |
| Sensor Data Order padding | 32 | padding / 7 | 1 | — | big (default) | Padding 2 |
| Sensor Data Order | 39 | bool / 1 | 1 | — | big (default) | Order of the temperature read from the sensor |
| Initial Configuration Duration | 40 | u8 / 8 | 1 | s | big (default) | Duration of the initial configuration (seconds) |
| Padding | 48 | padding / 7 | 1 | — | big (default) | Padding 1 |
| CAN Baud Rate | 55 | bool / 1 | 1 | — | big (default) | CAN baud rate: 0 - 500kbps, 1 - 1Mbps |
| Number of Channels | 56 | u8 / 8 | 1 | — | big (default) | Number of channel to read the temperatures 1/4/8/16 |

### Temp sensor cfg response

**ID CAN `0x301` · standard raw.** Configuration message to the device

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| New Base Id | 0 | u16 / 16 | 1 | — | big (default) | New base ID for CAN messages |
| Emissivity | 16 | u8 / 8 | 100 | — | big (default) | Material emissivity in range from 0 to 1 |
| Sample Rate | 24 | u8 / 8 | 1 | Hz | big (default) | Sample frequency of the temperature from 1 to 64 hz |
| Sensor Data Order padding | 32 | padding / 7 | 1 | — | big (default) | Padding 2 |
| Sensor Data Order | 39 | bool / 1 | 1 | — | big (default) | Order of the temperature read from the sensor |
| Initial Configuration Duration | 40 | u8 / 8 | 1 | s | big (default) | Duration of the initial configuration (seconds) |
| Padding | 48 | padding / 7 | 1 | — | big (default) | Padding 1 |
| CAN Baud Rate | 55 | bool / 1 | 1 | — | big (default) | CAN baud rate: 0 - 500kbps, 1 - 1Mbps |
| Number of Channels | 56 | u8 / 8 | 1 | — | big (default) | Number of channel to read the temperatures 1/4/8/16 |

### Sensor data summary F L Tire

**ID CAN `0x314` · standard raw.** Data summary sended every 10 seconds

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| FW Major | 0 | u8 / 8 | 1 | — | big (default) |  |
| FW Minor | 8 | u8 / 8 | 1 | — | big (default) |  |
| Emissivity | 16 | u8 / 8 | 100 | — | big (default) | Material emissivity in range from 0 to 1 |
| Sample Rate | 24 | u8 / 8 | 1 | Hz | big (default) | Sample frequency of the temperature from 1 to 64 hz |
| Reserved | 32 | u8 / 8 | 1 | — | big (default) |  |
| Sensor Data Order padding | 40 | padding / 7 | 1 | — | big (default) | Padding for the sensor data order |
| Sensor Data Order | 47 | bool / 1 | 1 | — | big (default) | Order of the temperature read from the sensor |
| Number of Channels | 48 | u8 / 8 | 1 | — | big (default) | Number of channel to read the temperatures 1/4/8/16 |
| Ambient Temperature | 56 | u8 / 8 | 1 | °C | big (default) | Ambient temperature around the sensor, subtract 100 to get the real value |

### Sensor data summary F R Tire

**ID CAN `0x334` · standard raw.** Data summary sended every 10 seconds

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| FW Major | 0 | u8 / 8 | 1 | — | big (default) |  |
| FW Minor | 8 | u8 / 8 | 1 | — | big (default) |  |
| Emissivity | 16 | u8 / 8 | 100 | — | big (default) | Material emissivity in range from 0 to 1 |
| Sample Rate | 24 | u8 / 8 | 1 | Hz | big (default) | Sample frequency of the temperature from 1 to 64 hz |
| Reserved | 32 | u8 / 8 | 1 | — | big (default) |  |
| Sensor Data Order padding | 40 | padding / 7 | 1 | — | big (default) | Padding for the sensor data order |
| Sensor Data Order | 47 | bool / 1 | 1 | — | big (default) | Order of the temperature read from the sensor |
| Number of Channels | 48 | u8 / 8 | 1 | — | big (default) | Number of channel to read the temperatures 1/4/8/16 |
| Ambient Temperature | 56 | u8 / 8 | 1 | °C | big (default) | Ambient temperature around the sensor, subtract 100 to get the real value |

### Sensor data summary R L Tire

**ID CAN `0x354` · standard raw.** Data summary sended every 10 seconds

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| FW Major | 0 | u8 / 8 | 1 | — | big (default) |  |
| FW Minor | 8 | u8 / 8 | 1 | — | big (default) |  |
| Emissivity | 16 | u8 / 8 | 100 | — | big (default) | Material emissivity in range from 0 to 1 |
| Sample Rate | 24 | u8 / 8 | 1 | Hz | big (default) | Sample frequency of the temperature from 1 to 64 hz |
| Reserved | 32 | u8 / 8 | 1 | — | big (default) |  |
| Sensor Data Order padding | 40 | padding / 7 | 1 | — | big (default) | Padding for the sensor data order |
| Sensor Data Order | 47 | bool / 1 | 1 | — | big (default) | Order of the temperature read from the sensor |
| Number of Channels | 48 | u8 / 8 | 1 | — | big (default) | Number of channel to read the temperatures 1/4/8/16 |
| Ambient Temperature | 56 | u8 / 8 | 1 | °C | big (default) | Ambient temperature around the sensor, subtract 100 to get the real value |

### Sensor data summary R R Tire

**ID CAN `0x374` · standard raw.** Data summary sended every 10 seconds

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| FW Major | 0 | u8 / 8 | 1 | — | big (default) |  |
| FW Minor | 8 | u8 / 8 | 1 | — | big (default) |  |
| Emissivity | 16 | u8 / 8 | 100 | — | big (default) | Material emissivity in range from 0 to 1 |
| Sample Rate | 24 | u8 / 8 | 1 | Hz | big (default) | Sample frequency of the temperature from 1 to 64 hz |
| Reserved | 32 | u8 / 8 | 1 | — | big (default) |  |
| Sensor Data Order padding | 40 | padding / 7 | 1 | — | big (default) | Padding for the sensor data order |
| Sensor Data Order | 47 | bool / 1 | 1 | — | big (default) | Order of the temperature read from the sensor |
| Number of Channels | 48 | u8 / 8 | 1 | — | big (default) | Number of channel to read the temperatures 1/4/8/16 |
| Ambient Temperature | 56 | u8 / 8 | 1 | °C | big (default) | Ambient temperature around the sensor, subtract 100 to get the real value |

### Sensor data summary F L Brake

**ID CAN `0x514` · standard raw.** Data summary sended every 10 seconds

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| FW Major | 0 | u8 / 8 | 1 | — | big (default) |  |
| FW Minor | 8 | u8 / 8 | 1 | — | big (default) |  |
| Emissivity | 16 | u8 / 8 | 100 | — | big (default) | Material emissivity in range from 0 to 1 |
| Sample Rate | 24 | u8 / 8 | 1 | Hz | big (default) | Sample frequency of the temperature from 1 to 64 hz |
| Reserved | 32 | u8 / 8 | 1 | — | big (default) |  |
| Sensor Data Order padding | 40 | padding / 7 | 1 | — | big (default) | Padding for the sensor data order |
| Sensor Data Order | 47 | bool / 1 | 1 | — | big (default) | Order of the temperature read from the sensor |
| Number of Channels | 48 | u8 / 8 | 1 | — | big (default) | Number of channel to read the temperatures 1/4/8/16 |
| Ambient Temperature | 56 | u8 / 8 | 1 | °C | big (default) | Ambient temperature around the sensor, subtract 100 to get the real value |

### Sensor data summary F R Brake

**ID CAN `0x534` · standard raw.** Data summary sended every 10 seconds

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| FW Major | 0 | u8 / 8 | 1 | — | big (default) |  |
| FW Minor | 8 | u8 / 8 | 1 | — | big (default) |  |
| Emissivity | 16 | u8 / 8 | 100 | — | big (default) | Material emissivity in range from 0 to 1 |
| Sample Rate | 24 | u8 / 8 | 1 | Hz | big (default) | Sample frequency of the temperature from 1 to 64 hz |
| Reserved | 32 | u8 / 8 | 1 | — | big (default) |  |
| Sensor Data Order padding | 40 | padding / 7 | 1 | — | big (default) | Padding for the sensor data order |
| Sensor Data Order | 47 | bool / 1 | 1 | — | big (default) | Order of the temperature read from the sensor |
| Number of Channels | 48 | u8 / 8 | 1 | — | big (default) | Number of channel to read the temperatures 1/4/8/16 |
| Ambient Temperature | 56 | u8 / 8 | 1 | °C | big (default) | Ambient temperature around the sensor, subtract 100 to get the real value |

### Sensor data summary R L Brake

**ID CAN `0x554` · standard raw.** Data summary sended every 10 seconds

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| FW Major | 0 | u8 / 8 | 1 | — | big (default) |  |
| FW Minor | 8 | u8 / 8 | 1 | — | big (default) |  |
| Emissivity | 16 | u8 / 8 | 100 | — | big (default) | Material emissivity in range from 0 to 1 |
| Sample Rate | 24 | u8 / 8 | 1 | Hz | big (default) | Sample frequency of the temperature from 1 to 64 hz |
| Reserved | 32 | u8 / 8 | 1 | — | big (default) |  |
| Sensor Data Order padding | 40 | padding / 7 | 1 | — | big (default) | Padding for the sensor data order |
| Sensor Data Order | 47 | bool / 1 | 1 | — | big (default) | Order of the temperature read from the sensor |
| Number of Channels | 48 | u8 / 8 | 1 | — | big (default) | Number of channel to read the temperatures 1/4/8/16 |
| Ambient Temperature | 56 | u8 / 8 | 1 | °C | big (default) | Ambient temperature around the sensor, subtract 100 to get the real value |

### Sensor data summary R R Brake

**ID CAN `0x574` · standard raw.** Data summary sended every 10 seconds

| Campo | Offset bit | Tipo / bit | Scala | Unità | Endian | Note / varianti |
| --- | --- | --- | --- | --- | --- | --- |
| FW Major | 0 | u8 / 8 | 1 | — | big (default) |  |
| FW Minor | 8 | u8 / 8 | 1 | — | big (default) |  |
| Emissivity | 16 | u8 / 8 | 100 | — | big (default) | Material emissivity in range from 0 to 1 |
| Sample Rate | 24 | u8 / 8 | 1 | Hz | big (default) | Sample frequency of the temperature from 1 to 64 hz |
| Reserved | 32 | u8 / 8 | 1 | — | big (default) |  |
| Sensor Data Order padding | 40 | padding / 7 | 1 | — | big (default) | Padding for the sensor data order |
| Sensor Data Order | 47 | bool / 1 | 1 | — | big (default) | Order of the temperature read from the sensor |
| Number of Channels | 48 | u8 / 8 | 1 | — | big (default) | Number of channel to read the temperatures 1/4/8/16 |
| Ambient Temperature | 56 | u8 / 8 | 1 | °C | big (default) | Ambient temperature around the sensor, subtract 100 to get the real value |
