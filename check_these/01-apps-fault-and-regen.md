# 1. Guasto APPS interpretato come pedale rilasciato

**Priorità: massima — comportamento da chiarire prima di portare la logica in Brain New.**

## Estratti del codice

In `apps.rs`, un valore APPS non valido viene convertito in zero. Il controllo di plausibilità restituisce anch’esso zero in caso di errore e il risultato viene comunque registrato come lettura APPS:

```rust
let apps_1_percentage = get_apps_percentage(...).unwrap_or_else(|err| {
    log::error!("Failed to get APPS1 percentage: {err}");
    // warning CAN omesso
    0.0 // valore non valido trasformato in una percentuale apparentemente valida
});

let percentage = apps_plausibility(apps_1_percentage, apps_2_percentage)
    .unwrap_or_else(|err| {
        log::error!("Failed APPS plausibility check: {err}");
        // error CAN omesso
        0.0 // anche un errore di plausibilità diventa pedale a zero
    });

self.sr.last_apps.lock().await.update(AppsReading {
    apps_1_millis,
    apps_2_millis,
    percentage, // SafeTimedData ora contiene un campione fresco, pur dopo un errore
});
```

Se invece la lettura ADC fallisce, `last_apps` non viene aggiornato. In R2D, quando il dato scade, il codice assegna comunque `0.0` e passa il valore alla mappa:

```rust
let throttle_pos = self.resources.sr.last_apps.lock().await.get()
    .map(|reading| reading.percentage)
    .unwrap_or_else(|| {
        // warning CAN omesso
        0.0 // dato scaduto trattato come acceleratore completamente rilasciato
    });

motor_map.update_position(throttle_pos);
let mut command = motor_map.get_command();
```

La mappa one-pedal interpreta una posizione sotto la fascia di veleggio come richiesta di frenata. Per Autocross, Endurance e TorqueTest è configurata una curva di regen; sopra 2 km/h la curva di frenata può produrre una richiesta negativa:

```rust
if self.position < coasting_lower {
    CommandRelative::Brake(self.brake_torque.get_brake_torque_value(...))
} else if self.position > coasting_upper {
    CommandRelative::Acc(...)
} else {
    CommandRelative::Acc(0.0)
}

// Nella curva BrakeTorque:
if velocity < 2.0 { return 0.0; }
```

Fonti: [`apps.rs`](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/bin/brain_old/tasks/apps.rs#L184-L254), [`r2d.rs`](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/bin/brain_old/tasks/state_machine/r2d.rs#L174-L201), [`one_pedal.rs`](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/utilities/ecu/one_pedal.rs#L43-L55), [`map.rs`](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/utilities/ecu/map.rs#L37-L55).

## Cosa significa

Il codice non conserva la differenza tra queste due condizioni:

- pedale misurato e rilasciato: `0%` è un dato valido;
- sensore fuori range, letture non plausibili o campione scaduto: la percentuale non è conosciuta.

Entrambe possono diventare `0%`. La mappa selezionata può quindi interpretare un problema di sensore come il normale rilascio dell’acceleratore e applicare regen. Inoltre, se entrambi i sensori risultano fuori range e vengono sostituiti con zero, il confronto tra loro può risultare plausibile e la lettura a zero viene rinnovata come dato fresco.

La conseguenza concreta dipende dalla mappa attiva, dalla velocità e dal comportamento dell’inverter: va verificata, non dedotta solo dal firmware.

## Come migliorarlo

1. Rappresentare il risultato come dato tipizzato, ad esempio `Valid { percentage, timestamp }` oppure `Fault { reason }`; non usare `0.0` come codice di errore.
2. Non aggiornare `last_apps` con una lettura invalidata. Registrare separatamente il fault e la sua origine: ADC, fuori range, mismatch APPS o timeout.
3. Se APPS è invalido durante R2D, impedire che la mappa generi accelerazione **o regen** dal valore sentinella. Definire con il team se la risposta richiesta sia coppia zero, `DriveEnable(false)` e/o passaggio a uno stato di fault; validarla con inverter e regolamento.
4. Rendere visibile al pilota il motivo del fault e impedire il rientro in R2D finché non sono soddisfatte condizioni di recupero esplicite.
5. Verificare almeno questi casi: errore ADC su un canale, errori su entrambi, uno o entrambi fuori range, differenza oltre soglia, dato scaduto e recupero dopo fault.

## Criterio di accettazione proposto

Nessun errore o timeout APPS può essere interpretato come un comando di rilascio valido. Con ogni guasto APPS simulato, Brain deve produrre la risposta di fault concordata e non deve generare una richiesta di regen dalla mappa one-pedal.
