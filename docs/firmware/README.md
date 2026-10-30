# Firmware UNIUD E-Racing — guida per il reparto

**Edizione del 30 ottobre 2026 · Focus: Brain · Lingua: italiano**

Questa guida spiega come è organizzato il firmware, come Brain passa dalla lettura dei pedali al comando dell’inverter e come usare le repository `messages` e `serena-messages`. È pensata per entrare nel reparto e poi orientarsi direttamente nelle sorgenti.

**Come leggerla:** parti dalla panoramica, segui il percorso di Brain, approfondisci il protocollo e infine passa alla compilazione. Le anomalie osservate sono raccolte in un capitolo separato, ma sono richiamate anche dove cambiano il significato del codice.

1. [Architettura e mappa delle repository](01-architettura.md)
2. [Brain: avvio, task, stati e controllo motore](02-brain.md)
3. [Messaggi: dalle definizioni YAML al CAN](03-messaggi.md)
4. [Ambiente, compilazione, flash e lavoro quotidiano](04-sviluppo.md)
5. [Punti da verificare e limiti dell’analisi](05-verifiche.md)
6. [Catalogo CAN completo della revisione bloccata dal firmware](catalogo-can.md)

La versione HTML riunisce tutti i capitoli e il catalogo in un unico documento con indice e ricerca del browser: **[apri la guida completa](guida-firmware.html)**.

## Quale codice è stato studiato

| Repository | Branch predefinito scaricato | Commit analizzato | Data del commit |
| --- | --- | --- | --- |
| firmware | develop | `8da023f3056b65683d110e69112bec1dfb4446ae` | 30 settembre 2026 |
| messages | master | `56f028257b1cfbb9f44f50d629b039f797d1a110` | 25 ottobre 2025 |
| serena-messages | master | `1f717b7262bfcad8282136fbf0e661181ee6dd3b` | 17 ottobre 2026 |

**Attenzione alla compatibilità:** `firmware/Cargo.lock` blocca `serena-messages` al commit `f7cbf162f1720c0c1dbaccd9f68a19ffbccf36bb`, versione 1.0.0. Il master scaricato è invece 2.0.0. Per spiegare i messaggi usati dal firmware e generare il catalogo ho letto anche la revisione 1.0.0, senza cambiare il checkout del master. `messages` coincide invece con la revisione del lockfile. `vcu-rt` è una dipendenza Git esterna, bloccata a `49a4eb0bf70eb2c5d7fb13e2aa179df63ec49049`: qui se ne descrive l’uso visibile nei chiamanti, senza attribuirgli dettagli interni non verificati.

**Stato della guida GitBook:** sono stati tentati sia il collegamento `project-overview` sia la home fornita in chat. Nel browser disponibile la home mostra “Sign in to GitBook”; le pagine tecniche non sono state lette. Il capitolo operativo deriva quindi dai file del repository e non viene presentato come trascrizione della guida del team.

**Metodo:** lettura statica delle sorgenti, confronto con manifest e lockfile, controllo dei target con `cargo metadata --no-deps`, estrazione dei messaggi YAML. Non sono state compilate le ECU né effettuati flash o prove sul veicolo. Non è noto quale branch/commit sia effettivamente installato in macchina. I valori riportati descrivono il codice, non certificano conformità al regolamento o validazione in pista.

## Glossario essenziale

| Termine | Significato in questa guida |
| --- | --- |
| ECU / VCU | Centralina elettronica / centralina di controllo veicolo |
| Brain | Centralina che coordina stati del veicolo e richiesta di controllo all’inverter |
| LV | Low Voltage: alimentazione e stato a bassa tensione |
| TS | Tractive System: sistema di trazione ad alta tensione |
| R2D / RTD | Ready to Drive: stato in cui Brain invia i comandi di marcia |
| APPS | Accelerator Pedal Position Sensor: i due sensori del pedale acceleratore |
| SDC / shutdown | Catena hardware di sicurezza la cui apertura disabilita il sistema di trazione |
| AIR+ / AIR− | Relè principali che collegano l’accumulatore al circuito di trazione |
| TSAC / TSACU | Accumulatore di trazione / sua centralina di gestione |
| BMS / LVBMS | Gestione batteria / gestione della batteria a bassa tensione |
| CAN | Bus di comunicazione tra centraline; qui i frame hanno fino a 8 byte di dati |
| ADC | Convertitore da segnale analogico a valore numerico |
| NVS | Memoria non volatile usata per conservare i parametri |
| Tacom | Infrastruttura di comunicazione usata per parametri e OTA |
| OTA | Aggiornamento del firmware senza riprogrammazione seriale diretta |
| ERPM | Velocità elettrica del motore, distinta dai giri meccanici |

## Fonti e copie locali

Le tre repository sono disponibili nella cartella `02-codice` del workspace, due livelli sopra questa guida. I collegamenti alle sorgenti nei capitoli puntano a commit GitHub precisi e richiedono l’accesso all’organizzazione. Questo permette di ritrovare il codice anche dopo che i branch saranno avanzati.

- [Organizzazione UNIUD E-Racing](https://github.com/uniuderacing)
- [Firmware analizzato](https://github.com/uniuderacing/firmware/tree/8da023f3056b65683d110e69112bec1dfb4446ae)
- [Messages analizzato](https://github.com/uniuderacing/messages/tree/56f028257b1cfbb9f44f50d629b039f797d1a110)
- [Serena attuale analizzato](https://github.com/uniuderacing/serena-messages/tree/1f717b7262bfcad8282136fbf0e661181ee6dd3b)
- [Serena usato dal lockfile](https://github.com/uniuderacing/serena-messages/tree/f7cbf162f1720c0c1dbaccd9f68a19ffbccf36bb)
- [GitBook: pagina indicata nel README](https://app.gitbook.com/o/-Mh7negWVifDHkkRsFvb/s/AHEVzy7OU8VWroZxTDhL/project-overview)
- [GitBook: home fornita in chat](https://app.gitbook.com/o/-Mh7negWVifDHkkRsFvb/home)
