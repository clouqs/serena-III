# 3. Dati scaduti sostituiti da valori predefiniti

**Priorità: alta — definire una politica per ciascun dato critico.**

## Estratti del codice

In R2D, il dato velocità scaduto viene trasformato in `0.0` per la mappa. Lo stesso campione assente usa `630 ERPM` nel calcolo della potenza:

```rust
let velocity_msg = inverter_message_1.lock().await.get();
let velocity = velocity_msg
    .map(|m| into_velocity(m.erpm()))
    .unwrap_or_else(|| {
        // warning CAN omesso
        0.0 // la mappa riceve velocità zero anche se il sensore non è aggiornato
    });
motor_map.update_velocity(velocity);

let rad_velocity = (velocity_msg
    .map(|m| m.erpm() as f32)
    .unwrap_or(630.0) // un secondo fallback per lo stesso dato
    / MOTOR_MAGNETS) * 0.104_719_76;
```

La tensione bus scaduta diventa `400 V`; il limite cutoff è applicato solo se il relativo messaggio è presente:

```rust
let current_voltage = precharge_status
    .map(|m| m.v_bus().try_into().unwrap_or(400.0))
    .unwrap_or(400.0); // tensione stimata se il dato è scaduto

command = command.map_abs_acc(|value| {
    if let Some(cutoff) = cutoff_message {
        value.min(cutoff as f32)
    } else {
        value // senza cutoff valido, questo limite non viene applicato
    }
});
```

Fonti: [`r2d.rs`](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/bin/brain_old/tasks/state_machine/r2d.rs#L203-L281), [`timeout SafeTimedData`](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/bin/brain_old/shared_resources.rs#L22-L38).

## Cosa significa

Questi valori non dicono al controllo “dato scaduto”: sembrano misure valide. Inoltre per la velocità vengono usati fallback diversi nei due calcoli: la mappa vede zero, mentre il limite di potenza usa un ERPM nominale.

Se manca il cutoff, la relativa limitazione viene saltata. Non è detto che ogni messaggio mancante debba causare lo stesso fault; è però necessario definire questa scelta esplicitamente e non lasciare che `None` rimuova un limite senza una politica approvata.

## Come migliorarlo

1. Costruire uno snapshot degli ingressi del ciclo con valore, validità, timestamp/età e origine; consumare lo stesso snapshot in tutta la matematica del comando.
2. Definire la risposta per ogni timeout in base al ruolo del dato. Per i dati indispensabili al comando, impedire nuovi comandi di guida finché non sono di nuovo validi. Per i limiti dinamici, usare un limite conservativo concordato o impedire R2D; non cancellare il limite implicitamente.
3. Eliminare fallback numerici non documentati come `0 ERPM`, `630 ERPM` e `400 V` dalla logica di sicurezza. Se un fallback è richiesto, chiamarlo e documentarlo come valore di degradazione approvato, con limiti e condizioni d’uso.
4. Verificare range, unità, segno, conversioni e scadenze prima di usare ogni valore; registrare un fault specifico per velocità, tensione e cutoff.
5. Simulare ciascun timeout singolarmente e in combinazione, quindi controllare CAN e comando risultante al banco.

## Criterio di accettazione proposto

Ogni input critico scaduto ha una risposta esplicita e documentata. Un input mancante non può trasformarsi silenziosamente in un valore che mantenga o aumenti la richiesta di trazione, né rimuovere un limite di corrente.
