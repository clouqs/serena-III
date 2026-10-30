# Check these — revisione firmware Brain

Questa cartella raccoglie i tre problemi prioritari individuati nella lettura statica di `brain_old`, con estratti delle sorgenti, spiegazione del comportamento e una proposta per Brain New.

## Ambito della revisione

- Firmware analizzato: [`brain_old`, commit `8da023f`](https://github.com/uniuderacing/firmware/tree/8da023f3056b65683d110e69112bec1dfb4446ae/src/bin/brain_old).
- Lettura statica: le osservazioni descrivono il codice; non dimostrano il comportamento dell’inverter o della vettura sotto guasto.
- Scopo: trasformare i problemi in requisiti verificabili per Brain New; non applicare qui modifiche al firmware.

## Ordine consigliato

1. [Guasto APPS interpretato come pedale rilasciato e possibile regen](01-apps-fault-and-regen.md)
2. [Uscita da R2D senza disabilitazione esplicita dell’inverter](02-r2d-exit-and-drive-enable.md)
3. [Dati scaduti sostituiti da valori predefiniti](03-stale-inputs-and-fallbacks.md)

Prima della validazione in vettura, concordare con il team la risposta sicura per ogni guasto e verificare il comportamento dell’inverter e dello shutdown hardware.
