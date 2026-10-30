# 1. Architettura e mappa delle repository

## 1.1 Il quadro generale

Il software è distribuito su più centraline della famiglia ESP32. Ogni centralina acquisisce i propri segnali, esegue la propria logica e comunica tramite CAN. Brain decide lo stato operativo e costruisce la richiesta all’inverter. La gestione fisica della precharge e dell’accumulatore è svolta dalla TSACU; Brain ne legge lo stato per decidere se può entrare in TS.

```text
Pedali e pulsanti ──> BRAIN ── richiesta di corrente / velocità ──> Inverter
                        ▲                                          │
                        └──────── CAN: velocità e correnti ──────────┘
                        ▲
                 CAN: precharge, AIR, cutoff
                        │
                      TSACU

Steering <── CAN: stato Brain e mappa ──> Brain
LVBMS ── CAN: stato bassa tensione ──> rete veicolo
Cooling ── CAN: sensori e raffreddamento ──> rete veicolo
Rete CAN ──> Telemetry ── collegamento radio ──> Bridge
```

Lo schema esprime responsabilità software, non sostituisce lo schema elettrico dello shutdown. Brain può comandare il proprio relè di activation logic; non è l’unico elemento della catena hardware.

## 1.2 Cosa contiene ogni repository

| Repository | Domanda a cui risponde | Dove iniziare |
| --- | --- | --- |
| `firmware` | Che cosa fa ciascuna centralina? | `src/bin/<centralina>/main.rs` |
| `messages` | Come rappresento, codifico e decodifico un messaggio? | `src/lib.rs`, `src/frame.rs`, `messages_macro/src/lib.rs` |
| `serena-messages` | Quali messaggi e campi esistono per il veicolo? | `definitions/*.yaml`, `src/definitions.rs` |

Il rapporto è: **il firmware usa i tipi di Serena, che vengono generati dalla libreria Messages**. Un nuovo dato sul bus coinvolge spesso tutti e tre questi livelli, ma con responsabilità diverse.

## 1.3 Struttura reale di firmware

Il manifest definisce il package radice `firmware` e il membro `steering`, con il solo package radice tra i `default-members`. La libreria radice espone utilità e costanti condivise. `vcu-rt` è una dipendenza Git, non un membro locale del workspace analizzato. Il README che parla di tre membri è quindi disallineato rispetto al manifest.

```text
firmware/
├── Cargo.toml / Cargo.lock        package, dipendenze e revisioni bloccate
├── .cargo/config.toml            target ESP-IDF, linker, runner e variabili
├── rust-toolchain.toml           toolchain esp
├── sdkconfig.defaults            impostazioni ESP-IDF / FreeRTOS
├── partitions.csv                NVS e slot OTA
├── src/
│   ├── lib.rs                    libreria condivisa
│   ├── constants/                identificatori, tempi, soglie, configurazioni
│   ├── utilities/
│   │   ├── ecu/                  inizializzazione, mappe motore, GPS, tempi giro
│   │   ├── hal/                  CAN, ADC, I²C, debounce, speaker, SD
│   │   ├── ops/                  conversioni e filtri
│   │   ├── param/                gestione parametri condivisa
│   │   ├── svc/                  OTA, Wi-Fi, ESP-NOW
│   │   └── sync/                 dati con scadenza temporale
│   └── bin/                      un eseguibile per cartella con main.rs
├── steering/                     package separato, GUI Slint
└── examples/                     prove isolate di periferiche e simulatori
```

## 1.4 Le centraline, viste da firmware

| Cartella / package | Ruolo e relazione con Brain |
| --- | --- |
| `brain_old` | Versione asincrona, costruita sul runtime `vcu-rt` |
| `brain_sync` | Versione a thread standard: pedali, dashboard, CAN, shutdown, speaker, stati |
| `brain_new` | Struttura iniziale per una nuova versione; `main.rs` e quasi tutti i task sono vuoti |
| `tsac_unit` | Accumulatore HV: misure celle, temperature, corrente, precharge, bilanciamento e comunicazione |
| `newtsac_unit` | Ulteriore variante presente; il nome da solo non ne dimostra l’adozione sul veicolo |
| `lvbms` | Batteria LV: misure, interazione con MPF42790, SoC e diagnostica |
| `cooling` | Controllo raffreddamento, sensori e relativi messaggi |
| `steering` | Interfaccia del volante; riceve stati e dati del veicolo e gestisce l’interazione del pilota |
| `telemetry`, `telemetry_async` | Varianti per acquisire e inoltrare dati e gestire la telemetria |
| `bridge` | Collegamento tra telemetria e lato esterno al veicolo |
| `charger` | Firmware della scheda caricatore |
| `template` | Punto di partenza per strutturare un nuovo eseguibile |

Questa guida approfondisce Brain. Per le altre ECU è una mappa di orientamento: non è un’analisi completa delle loro strategie di controllo o dei loro fault.

## 1.5 I tre Brain: quale leggere

`brain_old` usa task asincroni, canali Flume e mutex asincroni. Il `main` costruisce un `Vcu`, registra parametri e task, quindi chiama `start()`. In questa versione CAN e servizi Tacom sono affidati al runtime esterno.

`brain_sync` crea esplicitamente thread, canali `std::sync::mpsc`, mutex standard e callback CAN. È il percorso principale del capitolo successivo perché rende visibile gran parte del flusso operativo nello stesso repository. **Questa è una scelta di esposizione, non una dichiarazione di versione in produzione.**

`brain_new` non è ancora un’applicazione eseguibile completa nella revisione studiata: il `main.rs` è di zero byte. Cargo lo riconosce comunque come target perché trova il file nel percorso convenzionale. “Target presente” non significa “programma compilabile e funzionante”.

## 1.6 Tre numeri da non confondere

- L’identificatore applicativo della scheda Brain è `BRAIN = 0`, usato per esempio nei parametri e nei fault.
- Il node ID dei messaggi CAN è una parte dell’arbitration ID e serve alla convenzione di filtraggio.
- Il message ID identifica la famiglia di messaggio all’interno di questa convenzione.

Il valore `BRAIN = 0` non implica che tutti i messaggi di Brain abbiano arbitration ID 0.

**Fonti:** [manifest](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/Cargo.toml), [costanti e board ID](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/constants/mod.rs), [avvio asincrono](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/bin/brain_old/main.rs), [avvio a thread](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/bin/brain_sync/main.rs), [struttura nuova](https://github.com/uniuderacing/firmware/tree/8da023f3056b65683d110e69112bec1dfb4446ae/src/bin/brain_new).
