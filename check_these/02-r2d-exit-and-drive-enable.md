# 2. Uscita da R2D senza disabilitazione esplicita dell’inverter

**Priorità: massima — definire una sequenza unica di uscita da R2D.**

## Estratti del codice

All’ingresso in R2D, `brain_old` invia `DriveEnable(true)` e prepara un messaggio periodico di mantenimento:

```rust
let drive_enable_message = InverterDriveEnableMessage::new()
    .with_drive_enable(true);

// Primo invio all’ingresso in R2D
stream.send(drive_enable_message);

// Ogni scadenza del timer R2D
stream.send(drive_enable_message);
```

Il loop invia i comandi di controllo all’inverter. Quando riceve l’apertura dello shutdown o un comando dashboard, restituisce direttamente il nuovo stato:

```rust
if shutdown_is_open {
    return self.into_lv();
}

ButtonType::R2d => return self.into_ts(),

ButtonType::Ts => {
    // apre il relay di activation logic
    return self.into_lv();
}
```

Nelle uscite mostrate non compare un invio esplicito di comando coppia zero o `DriveEnable(false)`. Le transizioni `into_lv()` e `into_ts()` trasferiscono le risorse al nuovo stato, senza azioni di uscita proprie.

Fonti: [`r2d.rs`](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/bin/brain_old/tasks/state_machine/r2d.rs#L99-L115), [`uscite da R2D`](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/bin/brain_old/tasks/state_machine/r2d.rs#L318-L369), [`transizioni type-state`](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/bin/brain_old/tasks/state_machine/mod.rs#L260-L270).

## Cosa significa

Il firmware smette di eseguire il loop R2D e cambia stato, ma dal solo codice non possiamo concludere che l’inverter abbia ricevuto o applicato una disabilitazione. Il suo comportamento potrebbe dipendere dai timeout interni, dal comando precedentemente ricevuto e dal circuito di shutdown hardware.

L’apertura fisica dello shutdown è una protezione separata e fondamentale. Non sostituisce però una sequenza software esplicita, verificabile e uguale per tutte le uscite da R2D.

## Come migliorarlo

1. Creare un’unica funzione/azione di uscita R2D che riceva il motivo: shutdown aperto, richiesta TS/LV, fault APPS, fault CAN, watchdog o altro.
2. Prima del cambio di stato, fermare la generazione di nuovi comandi di guida e inviare la sequenza definita con il team: comando di coppia zero, `DriveEnable(false)` e aggiornamento dello stato CAN. L’ordine e i tempi devono corrispondere al protocollo dell’inverter.
3. Fare passare ogni uscita da R2D attraverso la stessa funzione, evitando che un ramo dimentichi una parte della sequenza.
4. Definire cosa succede se la coda CAN è piena o il messaggio non può essere inviato. La sicurezza primaria deve restare garantita dallo shutdown hardware e dalla supervisione indipendente.
5. Verificare al banco, con acquisizione CAN, ciascun percorso: pulsante TS, pulsante R2D, apertura shutdown, fault sensore e task che non avanza. Osservare i messaggi effettivamente trasmessi e la risposta dell’inverter.

## Criterio di accettazione proposto

Ogni uscita da R2D ha una sequenza documentata e verificata. Nessun ramo può terminare il controllo R2D senza attivare tale sequenza; la protezione hardware rimane indipendente dal software.
