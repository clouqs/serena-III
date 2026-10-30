# 4. Ambiente, compilazione e lavoro quotidiano

## 4.1 Il contesto corretto della toolchain

Questa repository usa **Rust con ESP-IDF e `std`**, non il target bare-metal `*-none-elf`. Il target predefinito è **`xtensa-esp32s3-espidf`**, con `MCU = esp32s3`, toolchain Rust `esp`, linker `ldproxy` e ricompilazione di `std`/`panic_abort` tramite `build-std`.

`.cargo/config.toml` imposta `ESP_IDF_VERSION = v6.1`. Nello stesso file è rimasto un commento che cita v5.4: il valore operativo letto è v6.1. Questa analisi non ha verificato il completamento della build con quella versione.

Per preparare un ambiente servono la toolchain Espressif gestita da `espup`, Cargo/Rust, `ldproxy`, `espflash`, Python e i prerequisiti del builder ESP-IDF per il sistema operativo. L’elenco esatto delle installazioni del team va completato con GitBook, che richiede accesso e non è stato letto. Qui si riportano la configurazione reale e i comandi derivati da essa.

**Fonti:** [toolchain](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/rust-toolchain.toml), [config Cargo](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/.cargo/config.toml), [build script](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/build.rs).

## 4.2 Accesso alle dipendenze

Le tre repository possono essere clonate via HTTPS con le credenziali Git presenti sul computer. Il manifest firmware usa però URL **SSH** per varie dipendenze del team: per esempio `messages`, `serena-messages`, `vcu-rt`, `tacom` e driver hardware.

Riuscire a clonare `firmware` via HTTPS non dimostra che Cargo possa scaricare tutte le dipendenze SSH. Se fallisce prima di compilare, distingui autenticazione Git/SSH, reperibilità della revisione bloccata, download ESP-IDF ed errore Rust. Non cambiare il lockfile per aggirare un problema di accesso.

Per analisi riproducibili registra commit firmware, `Cargo.lock`, feature, target, revisione hardware e toolchain. Le copie scaricate per questa guida sono sotto `02-codice/` e non sono state modificate per sviluppare nuove funzionalità.

## 4.3 Controlli iniziali senza programmare la scheda

Esegui i comandi **dalla radice della repository firmware**, qui `02-codice/firmware` rispetto al workspace. Cargo cerca la configurazione a partire dalla directory corrente: usare soltanto `--manifest-path` da una directory esterna può non caricare la `.cargo/config.toml` della repository.

```powershell
cd '02-codice/firmware'
git status --short
git rev-parse HEAD
rustup show
rustc +esp --version
cargo +esp --version
ldproxy --version
espflash --version
```

Se l’installazione Windows ha generato `export-esp.ps1`, caricalo nella sessione come indicato dalla propria installazione. La presenza di un precedente ambiente ESP32 bare-metal non garantisce tutti i prerequisiti di questa build ESP-IDF.

Per elencare i target senza scaricare o compilare le dipendenze:

```powershell
cargo +stable metadata --no-deps --format-version 1
```

Questo controllo è stato eseguito nell’analisi: i target sono `brain_old`, `brain_sync`, `brain_new` e gli altri eseguibili delle rispettive cartelle. Non esiste un target chiamato semplicemente `brain` nella revisione studiata. I metadati non verificano i corpi dei programmi.

## 4.4 Compilare la variante scelta

I comandi seguenti sono ricavati dal manifest e dalla configurazione; **non sono stati eseguiti fino a completamento in questa analisi**:

```powershell
# Dalla radice di firmware; nessun flash.
cargo +esp build --release --locked --bin brain_sync

# Variante asincrona, quando è quella richiesta dal lavoro del team.
cargo +esp build --release --locked --bin brain_old
```

`--locked` conserva le revisioni attuali. `--bin` seleziona il programma: è particolarmente utile qui perché una build globale includerebbe anche `brain_new`, il cui main è vuoto. Se una dipendenza o la configurazione impedisce la build, la selezione del binario non risolve quel problema.

Il file prodotto dal primo comando, se la build riesce, si trova convenzionalmente in `target/xtensa-esp32s3-espidf/release/brain_sync`. Il package steering richiede anche la propria catena grafica Slint ed è selezionabile con `-p steering`.

```powershell
cargo +esp build --release --locked -p steering
```

## 4.5 Flash e monitor seriale

La configurazione definisce il runner `espflash flash --monitor`. Perciò un comando `cargo run` sull’eseguibile **compila e poi programma la scheda**, non esegue semplicemente una simulazione sul PC.

```powershell
# Esempi operativi da usare solo sulla scheda scelta per la prova.
cargo +esp run --release --locked --bin brain_sync

# Per selezionare la porta: sostituire COM7 con la porta effettiva.
cargo +esp run --release --locked --bin brain_sync -- --port COM7
```

Il flashing non è stato eseguito per questa documentazione. Prima di usare il comando sul banco, allinea chip ESP32-S3, revisione PCB, pinout, alimentazione e variante firmware con la prova prevista dal team. Le feature `bypass_shutdown` e `bypass_r2d_brake` non sono parte dei comandi proposti.

`espflash.toml` imposta baudrate 1000000, flash 80 MHz e tabella partizioni. `partitions.csv` prevede NVS, dati OTA, calibrazione PHY e due slot app `ota_0`/`ota_1` da 1800K ciascuno. `sdkconfig.defaults` abilita rollback OTA; questo non dimostra da solo che un aggiornamento su una scheda sia stato validato.

**Fonti:** [espflash](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/espflash.toml), [partizioni](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/partitions.csv), [sdkconfig](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/sdkconfig.defaults).

## 4.6 Feature e configurazione che cambiano il comportamento

| Feature | Scopo dichiarato / uso osservato |
| --- | --- |
| `debug` | Abilita logging dettagliato di `vcu-rt` |
| `debug_assertions` | Alias che abilita `debug` nel manifest; distinto dal cfg Rust omonimo |
| `bypass_shutdown` | Nel monitor old forza lo shutdown percepito come chiuso |
| `bypass_r2d_brake` | Nel ramo TS old permette R2D senza la condizione sul freno |
| `plausibility_italy` | Nell’old azzera accelerazione/setpoint velocità quando scatta il relativo flag |
| `bypass_lvbms_warn` | Feature relativa alle segnalazioni LVBMS |
| `pio` | Abilita il builder PlatformIO nella dipendenza ESP-IDF |

La dichiarazione nel manifest non prova che la stessa feature sia applicata in ogni variante Brain. Cerca i `#[cfg(feature = ...)]` nel codice che stai compilando.

## 4.7 Come orientarsi durante una modifica

| Devo cambiare… | Punto di partenza | Cosa controllare insieme |
| --- | --- | --- |
| Range e percentuale acceleratore | `tasks/apps.rs`, `parameters.rs` | Unità, calibrazione, valori uguali, scadenza, plausibilità |
| Risposta del pedale | `utilities/ecu/map.rs`, `one_pedal.rs` | Correnti limite, coasting, regen, ramo velocità |
| Condizioni per R2D | `tasks/dashboard.rs`, `state_machine/mod.rs` | Flag freno, freschezza, eventi, vecchia/nuova variante |
| Reazione a shutdown | `tasks/shutdown.rs`, state machine | Ordine di valutazione, relè, blocchi, comando finale inverter |
| Dato sul bus | YAML Serena + produttore/listener | Versione protocollo, ID completo, scaling, payload, frequenza |
| Parametro remoto | Costruttore + registrazione dispatcher/runtime | Persistenza, ID, permessi, lock, aggiornamento in R2D |
| Pin o periferica | `main.rs` della variante | PCB effettivo e conflitti con altre periferiche |

Per un primo esercizio conviene seguire un messaggio esistente dall’origine alla callback e alla variabile consumata, senza modificare subito le logiche di marcia. Gli esempi `blink`, `adc_ads1115`, `can_receive`, `can_transmit` e i `dummy_*` aiutano a isolare singole periferiche; non sono automaticamente test completi della centralina.

## 4.8 Verifica proporzionata alla modifica

Per una modifica al protocollo sono utili round-trip di encoding/decoding e valori noti di scaling. Per mappe e conversioni servono casi di estremi, valori negativi e range degeneri. Per transizioni e timeout serve verificare la sequenza degli eventi e la reazione a dati assenti.

La repository Messages contiene già test per frame, macro, moltiplicatori e accesso dinamico. La CI firmware descrive formattazione, build workspace, Clippy e compilazione degli esempi; i job di test nel file letto sono commentati. La presenza del workflow non costituisce prova che il commit qui studiato abbia superato una specifica esecuzione CI.

La distinzione pratica è: build riuscita dimostra che il programma è costruibile con quell’ambiente; prova di banco verifica periferiche e tempi reali; prova integrata verifica la comunicazione con TSACU, inverter e dashboard. Nessuno di questi passaggi è stato eseguito dalla sola analisi documentale.

**Fonte:** [CI](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/.github/workflows/ci.yml).
