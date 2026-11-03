# MAX1161x · Capire la libreria

Guida alle sorgenti Rust, alla configurazione e al percorso dal segnale alla temperatura. Edizione del **2 novembre 2026**, libreria **0.1.0**, Rust 2021.

Questa guida serve a imparare a usare e leggere la libreria `max1161x` del reparto UNIUD E-Racing. Parte dal suo scopo, spiega ogni tipo e funzione e segue una lettura I²C fino ai valori restituiti. Le anomalie del codice sono richiamate nel punto in cui diventano rilevanti.

## 00 · Come usare questa guida

### Percorso di studio

| Passaggio | Cosa leggere | Cosa dovresti saper spiegare |
| --- | --- | --- |
| 1 · Orientarsi | [Scopo](#01-scopo) e [architettura](#02-architettura) | Dove finisce il bus e dove inizia la conversione applicativa |
| 2 · Configurare | [Setup](#03-setup) e [configuration](#04-configuration) | Come ottenere `0x82`, `0x17` e `0x61` dai campi Rust |
| 3 · Seguire il codice | [API del driver](#05-driver) e [conversioni](#06-conversioni) | Che cosa succede a ogni chiamata e che cosa contiene `output` |
| 4 · Integrare | [Esempi](#07-esempi) e [multiplexer](#08-multiplexer) | Quali parti può usare oggi il firmware e quali mancano |
| 5 · Consolidare | [Limiti](#09-limiti), [diagnostica](#10-diagnostica) e [autoverifica](#11-autoverifica) | Perché una lettura plausibile potrebbe essere comunque sbagliata |

La [versione HTML](guida-max1161x.html) contiene una ricerca su tutto il testo, risultati con estratti, filtro per argomento, indice delle sottosezioni, tema chiaro/scuro e pulsanti per copiare il codice. `Ctrl+K` o `/` apre la ricerca; `Esc` la chiude. `Ctrl+F` resta disponibile per la ricerca nativa del browser. Due laboratori permettono di comporre i byte e seguire una conversione numerica. Tutto funziona senza CDN, rete o server.

### Revisione e metodo

La fonte principale è il checkout locale della repository `max1161x`, commit `ac91bd8ca657ee3962acefc0e5e57291e7d0ba19`. La guida descrive i file presenti, non una versione futura. I collegamenti alle sorgenti a fine capitolo puntano al commit analizzato; potrebbero richiedere l'accesso GitHub all'organizzazione. Dal 3 novembre 2026 la documentazione è raccolta in `docs/tsac/` della repository Serena III; le sorgenti Rust restano nella repository MAX1161x separata.

Il file fornito `documentazione-firmware.rar` è stato usato come riferimento editoriale: capitoli progressivi, schemi, tabelle e rimandi alle sorgenti. I contenuti sul firmware Brain e sul CAN appartengono a quell'altro documento e non descrivono questa libreria. Nessuno script dell'archivio è stato eseguito.

La spiegazione nasce dalla lettura statica di tutti i file della libreria, del manifest, dell'esempio e del README; i dettagli hardware aggiuntivi sono verificati sui datasheet ufficiali. Le verifiche riproducibili e i loro limiti sono riportati in [manutenzione](#12-manutenzione). Non sono state eseguite acquisizioni su hardware né una validazione della taratura.

### Tre etichette da riconoscere

| Etichetta | Significato |
| --- | --- |
| **Attuale** | Comportamento direttamente leggibile nel codice analizzato |
| **Hardware** | Informazione del datasheet, utile a interpretare i campi |
| **Proposta** | Possibile evoluzione; non è un metodo disponibile nella libreria |

## 01 · Scopo

### Che problema risolve

Il MAX1161x è un ADC esterno: riceve segnali analogici e il firmware ne legge i risultati via I²C. Questa libreria costruisce i byte di comando, seleziona indirizzo e numero di canali dal tipo del chip, legge i dati e li converte in temperature secondo una taratura del progetto.

Il punto fondamentale è che `read_all_sensors()` restituisce già **temperature stimate**, non codici ADC e non tensioni. Il nome generico della famiglia di chip non implica una API di acquisizione analogica altrettanto generica: la conversione applicativa è incorporata nel driver.

```text
Sensore analogico
      │ tensione
      ▼
MAX11617 ── I²C, due byte per campione ──► MAX116xx<I2C, MAX11617>
                                              │ maschera e unisce i byte
                                              ▼
                                         codice 0…4095
                                              │ raw × 3.3 / 4096
                                              ▼
                                         tensione stimata
                                              │ polinomio del progetto
                                              ▼
                                         temperatura in output
```

### Hardware previsto dal progetto

Il README immagina due MAX11617 e dodici sensori per ciascun ADC, dietro un TCA9543A. Il supporto software al mux non è implementato. Il driver può comunque rappresentare un ADC standalone.

```text
ESP ── I²C ── TCA9543A ── ramo 0 ── MAX11617 (0x35) ── 12 ingressi
                      └─ ramo 1 ── MAX11617 (0x35) ── 12 ingressi
```

**Hardware:** MAX11612/14/16 richiedono 4,5–5,5 V e hanno riferimento interno nominale 4,096 V; MAX11613/15/17 richiedono 2,7–3,6 V e hanno riferimento interno 2,048 V. Quindi scegliere una variante cambia anche i requisiti elettrici, che il trait Rust non rappresenta. [Datasheet MAX11612–MAX11617, p. 1](https://www.analog.com/media/en/technical-documentation/data-sheets/MAX11612-MAX11617.pdf#page=1).

### Capacità attuali

| Funzione | Stato nel checkout |
| --- | --- |
| Costruire setup e configuration byte | Presente, con campi ed enum pubblici |
| Rappresentare sei varianti | Presente, tramite indirizzo e numero di canali |
| Inviare il setup alla creazione | Presente, ma l'errore viene soltanto registrato nei log |
| Leggere e convertire tutti gli ingressi | Presente; configurazione di lettura fissa orientata ai 12 canali |
| Leggere pubblicamente un singolo canale | API assente; si può soltanto costruire il relativo byte |
| Ottenere pubblicamente raw o volt dal driver | API assente |
| Scegliere la Vref della formula | API assente: la formula usa sempre 3,3 V |
| Acquisizione asincrona | API assente, nonostante una dipendenza async nel manifest |
| Coordinare più ADC tramite mux | Previsto dal README; file segnaposto |
| Calibrare automaticamente i coefficienti | Assente: `calibrate_me()` fa una misura diagnostica |

Fonte: [README della libreria](https://github.com/uniuderacing/max1161x/blob/ac91bd8ca657ee3962acefc0e5e57291e7d0ba19/README.md), [driver](https://github.com/uniuderacing/max1161x/blob/ac91bd8ca657ee3962acefc0e5e57291e7d0ba19/src/max_driver.rs).

## 02 · Architettura

### Mappa dei file

```text
max1161x/
├── Cargo.toml                  package 0.1.0 e dipendenze
├── Cargo.lock                  risoluzione delle dipendenze
├── src/
│   ├── lib.rs                  espone tre moduli pubblici
│   ├── max_variants.rs         trait Variant e sei tipi di chip
│   ├── max_driver.rs           possiede I²C, legge e converte
│   ├── max_messages/
│   │   ├── mod.rs              espone i due moduli di messaggi
│   │   ├── setup_byte.rs       riferimento, clock, polarità, reset
│   │   └── config_byte.rs      scansione, selezione canale, ingressi
│   └── mux_governor.rs         contiene soltanto un commento
└── examples/test.rs            esempio ESP non allineato all'API
```

Questa è la mappa della libreria analizzata. La guida e il generatore si trovano invece in `serena-III/docs/tsac/`, insieme al relativo [README](README.md).

`lib.rs` dichiara solo `max_driver`, `max_messages` e `max_variants`. Il file `mux_governor.rs` non è dichiarato come modulo: non entra nell'API della crate. Non esistono un builder o una facade del mux utilizzabili, anche se il README li descrive come obiettivo architetturale.

### Tipi generici e ownership

```rust
pub struct MAX116xx<I2C, V: Variant> {
    i2c: I2C,
    _variant: PhantomData<V>,
}
```

`I2C` è il tipo concreto del bus, o di un adattatore di bus, e deve implementare il trait sincrono `embedded_hal::i2c::I2c`. `V` è il tipo della variante. Per esempio `MAX116xx<_, MAX11617>` lascia a Rust l'inferenza del tipo del bus e fissa il modello dell'ADC.

Il costruttore riceve `i2c` per valore e lo sposta nell'oggetto. Il chiamante non può continuare a usare quel valore dopo il passaggio. Il campo è privato e manca un metodo `release()` o un accesso pubblico al bus. Per condividere il bus servirebbe passare un adattatore che implementi `I2c` e gestisca la condivisione. Questo, da solo, non seleziona un ramo del multiplexer.

Il valore passato può anche essere un riferimento mutabile: `embedded-hal` implementa `I2c` per `&mut T` quando `T` lo implementa. Con `MAX116xx::new(&mut i2c, setup, config)` il driver possiede il riferimento; il bus originale resta preso in prestito fino alla fine dell'uso del driver. Dopo `drop(adc)` si può riusare `i2c`. Questa possibilità non consente accessi concorrenti al bus.

`PhantomData<V>` collega il driver al tipo `V` senza memorizzare un chip fisico o un'istanza della variante. Indirizzo e canali sono costanti del tipo; non si esegue un riconoscimento automatico del modello sul bus.

### Variant e tipi di chip

```rust
pub trait Variant {
    const ADDR: u8;
    const CHANNELS: usize;
}
```

| Tipo pubblico | `ADDR`, 7 bit | Binario | `CHANNELS` | Byte ricevuti dal driver |
| --- | --- | --- | --- | --- |
| `MAX11612` | `0x34` | `0110100` | 4 | 8 |
| `MAX11613` | `0x34` | `0110100` | 4 | 8 |
| `MAX11614` | `0x33` | `0110011` | 8 | 16 |
| `MAX11615` | `0x33` | `0110011` | 8 | 16 |
| `MAX11616` | `0x35` | `0110101` | 12 | 24 |
| `MAX11617` | `0x35` | `0110101` | 12 | 24 |

Questi sono i valori codificati nella libreria. Le coppie di chip condividono gli stessi indirizzi. Non passare al trait l'indirizzo già traslato con il bit R/W.

`Variant` è pubblico e non è sealed: una crate esterna può implementarlo. Il driver però usa buffer fissi e presume al massimo dodici canali. Un'implementazione con `CHANNELS > 12` può causare un panic nel slicing del buffer. Il trait non valida il numero di canali, la Vref, la tensione di alimentazione o l'intervallo di indirizzi.

### Manifest e portabilità

| Dipendenza diretta | Versione richiesta | Uso visibile nei file attuali |
| --- | --- | --- |
| `embedded-hal` | `1.0.0` | Trait I²C sincrono del driver |
| `log` | `0.4.33` | Messaggi di inizializzazione, errore e diagnostica |
| `esp-idf-hal` | `0.45.2` | Nessun riferimento nella libreria; dipendenza diretta e non opzionale |
| `embedded-hal-async` | `1.0.0` | Nessuna API async implementata |
| `embedded-hal-bus` | `0.3.0` | Nessun adattatore usato nella libreria |
| `heapless` | `0.8.0` | Nessun uso nei sorgenti analizzati |
| `thiserror-no-std` | `2.0.2` | Nessun tipo di errore custom definito |

Le versioni in questa tabella sono i requisiti del manifest, non una promessa che tutte le versioni risolte coincidano esattamente con queste stringhe. Il lockfile conserva la risoluzione del progetto.

La crate usa `std::thread` e `std::time::Duration` e non dichiara `#![no_std]`. L'impiego di `core` in altri punti non la rende `no_std`. La dipendenza ESP-IDF non opzionale limita inoltre la compilazione su target generici: il fatto che l'I²C sia un generic non basta a rendere l'intero package indipendente dalla piattaforma.

Fonti: [lib.rs](https://github.com/uniuderacing/max1161x/blob/ac91bd8ca657ee3962acefc0e5e57291e7d0ba19/src/lib.rs), [varianti](https://github.com/uniuderacing/max1161x/blob/ac91bd8ca657ee3962acefc0e5e57291e7d0ba19/src/max_variants.rs), [Cargo.toml](https://github.com/uniuderacing/max1161x/blob/ac91bd8ca657ee3962acefc0e5e57291e7d0ba19/Cargo.toml).

## 03 · Setup

### Scopo e layout di SetupByte

`SetupByte` descrive riferimento, clock, polarità e azione sul registro di configurazione. I campi sono pubblici e il tipo deriva `Clone` e `Copy`, quindi si può copiare per valore. Creare un `SetupByte` non comunica con il dispositivo: soltanto il driver o una chiamata I²C possono inviarlo.

```text
bit        7     6 5 4      3       2        1       0
campo     REG    SEL        CLK    BIP      RST      X
codice     1  ref_select   clock   mode    reset     0
```

| Campo Rust | Tipo | Bit | Effetto nella serializzazione |
| --- | --- | --- | --- |
| `ref_select` | `RefSelect` | 6…4 | Valore dell'enum spostato di 4 posizioni |
| `clock` | `Clock` | 3 | Valore dell'enum spostato di 3 posizioni |
| `mode` | `Mode` | 2 | Valore dell'enum spostato di 2 posizioni |
| `reset` | `bool` | 1 | `false` scrive 0, `true` scrive 1 |
| — | — | 7 e 0 | `REG=1`; bit 0 scritto a zero |

### RefSelect: tutti i valori

| Variante | SEL | Significato dichiarato dal codice |
| --- | --- | --- |
| `VddRef` | `000` | Usa VDD come riferimento |
| `ExternalRef` | `010` | Riferimento esterno sul pin REF |
| `InternalRefOff` | `100` | Seleziona il riferimento interno ma lo tiene spento |
| `InternalRefOn` | `101` | Seleziona il riferimento interno acceso |
| `InternalRefOutputOff` | `110` | Uscita REF selezionata, riferimento interno spento |
| `InternalRefOutputOn` | `111` | Uscita REF selezionata, riferimento interno acceso |

`InternalRefOff` e `InternalRefOutputOff` non significano riferimento pronto all'uso: lo stato spento è parte della configurazione. Il codice non aggiunge una procedura di avvio del riferimento.

**Hardware:** con riferimento interno acceso attendere 10 ms prima della conversione. Se il pin condiviso AIN/REF è usato come riferimento, la scansione esclude AIN3 sui 4 canali e AIN11 sui 12 canali; i MAX11614/15 hanno REF separato. Il driver continua a richiedere il numero nominale di campioni e non gestisce questa riduzione. [Datasheet, tabelle 3 e 6, pp. 15 e 19](https://www.analog.com/media/en/technical-documentation/data-sheets/MAX11612-MAX11617.pdf#page=19).

### Clock, Mode e reset

| Tipo / valore | Codifica | Cosa esprime |
| --- | --- | --- |
| `Clock::Internal` | 0 | Clock interno dell'ADC |
| `Clock::External` | 1 | Modalità clock esterno dell'ADC; non imposta il baudrate del controller ESP |
| `Mode::Unipolar` | 0 | Bit BIP a zero |
| `Mode::Bipolar` | 1 | Bit BIP a uno |
| `reset: false` | RST=0 | Richiede il reset della configuration |
| `reset: true` | RST=1 | Non richiede quel reset |

> **Attenzione al nome:** il booleano `reset` è controintuitivo: `true` significa **nessuna azione**, come dichiara il commento nel sorgente. Non è un flag alto per resettare tutto il chip. La serializzazione del bit resta identica ogni volta che si invia l'oggetto.

**Hardware:** RST=0 ripristina la configuration, non il setup. Il bit BIP riguarda la conversione differenziale; il single-ended resta unipolare. Il dato bipolare usa il complemento a due, che il driver attuale non decodifica. [Datasheet, pp. 12, 14 e 20](https://www.analog.com/media/en/technical-documentation/data-sheets/MAX11612-MAX11617.pdf#page=14).

### Metodi di SetupByte

| Metodo | Firma | Restituisce / operazioni |
| --- | --- | --- |
| `new` | `pub fn new(ref_select: RefSelect, clock: Clock, mode: Mode, reset: bool) -> Self` | Memorizza i quattro campi; nessun I/O o controllo di coerenza |
| `default` | `pub fn default() -> Self` | `VddRef`, `Internal`, `Unipolar`, `reset=true` |
| `to_byte` | `pub fn to_byte(&self) -> u8` | Costruisce il byte con shift e OR; non modifica l'oggetto |

`default()` è una funzione associata scritta a mano. Il tipo **non implementa il trait `Default`**: `SetupByte::default()` funziona, ma un vincolo `T: Default` non è soddisfatto da questo solo metodo. La stessa distinzione vale per `ConfigByte`.

### Calcolo passo per passo

```rust
let reg = 1 << 7;
let sel = (self.ref_select as u8) << 4;
let clk = (self.clock as u8) << 3;
let bip = (self.mode as u8) << 2;
let rst = (self.reset as u8) << 1;
// Risultato: reg | sel | clk | bip | rst
```

Con il default: `10000000 | 00000010 = 10000010 = 0x82`. La configurazione degli ingressi verrà inviata separatamente durante la lettura.

Con `InternalRefOn`, clock interno, unipolare e `reset=true`: `0x80 | (0b101 << 4) | 0x02 = 0xD2`. È il byte che compare nell'esempio originale, ma in quell'esempio viene passato come `u8` a un parametro che oggi richiede `SetupByte`.

Fonte: [setup_byte.rs](https://github.com/uniuderacing/max1161x/blob/ac91bd8ca657ee3962acefc0e5e57291e7d0ba19/src/max_messages/setup_byte.rs).

## 04 · Configuration

### Scopo e layout di ConfigByte

`ConfigByte` descrive come scegliere e scandire gli ingressi. Il tipo e tutti i suoi campi sono pubblici, con `Clone` e `Copy`. Non confondere `config_byte::InputMode` con `setup_byte::Mode`: il primo seleziona single-ended/differenziale, il secondo codifica il bit di polarità.

```text
bit        7     6 5       4 3 2 1       0
campo     REG    SCAN         CS        SGL/DIF
codice     0  scanconfig  channelselect   mode
```

| Campo Rust | Tipo | Bit | Significato |
| --- | --- | --- | --- |
| `scanconfig` | `ScanConfig` | 6…5 | Strategia di scansione |
| `channelselect` | `ChannelSelect` | 4…1 | Selettore canale |
| `mode` | `InputMode` | 0 | Single-ended = 1; differenziale = 0 |

### ScanConfig: tutti i valori

Le descrizioni seguenti riassumono i commenti delle enum. Il driver usa sempre `ScanFromZero`; gli altri valori possono essere serializzati ma non si possono selezionare nell'API di lettura attuale.

| Variante | SCAN | Intenzione dichiarata |
| --- | --- | --- |
| `ScanFromZero` | `00` | Da AIN0 fino al selettore scelto |
| `RepeatEight` | `01` | Ripete otto letture del canale scelto |
| `ScanUpperHalf` | `10` | Scansione dalla metà superiore fino al canale scelto |
| `SingleChannel` | `11` | Conversione del canale scelto |

Per implementare una lettura alternativa servono una dimensione di buffer e una mappatura dei risultati coerenti con la scansione. Non basta sostituire un byte e mantenere automaticamente `2 * V::CHANNELS` e l'indice 0 = AIN0. Per i dettagli delle modalità diverse da quella usata dal driver consultare la [tabella 5 del datasheet](https://www.analog.com/media/en/technical-documentation/data-sheets/MAX11612-MAX11617.pdf#page=18), soprattutto quando cambia il clock.

### ChannelSelect e InputMode

| Selettore | Valore | Selettore | Valore | Selettore | Valore |
| --- | --- | --- | --- | --- | --- |
| `Ain0` | `0000` | `Ain4` | `0100` | `Ain8` | `1000` |
| `Ain1` | `0001` | `Ain5` | `0101` | `Ain9` | `1001` |
| `Ain2` | `0010` | `Ain6` | `0110` | `Ain10` | `1010` |
| `Ain3` | `0011` | `Ain7` | `0111` | `Ain11` | `1011` |

`ChannelSelect` non dipende da `V`: Rust permette di costruire `Ain11` anche per una variante a quattro canali. La libreria non verifica questa coerenza. Nella modalità differenziale il selettore codifica una coppia e una polarità: non interpretarlo automaticamente come un singolo pin indipendente.

| Variante di InputMode | Bit 0 |
| --- | --- |
| `SingleEnded` | 1 |
| `Differential` | 0 |

### Metodi di ConfigByte

| Metodo | Firma | Comportamento |
| --- | --- | --- |
| `new` | `pub fn new(scanconfig: ScanConfig, channelselect: ChannelSelect, mode: InputMode) -> Self` | Assegna i tre campi, senza validazione |
| `default` | `pub fn default() -> Self` | `ScanFromZero`, `Ain11`, `SingleEnded` |
| `to_byte` | `pub fn to_byte(&self) -> u8` | `(scanconfig << 5) | (channelselect << 1) | mode` |

Il commento di `default()` lo presenta come default di power-up; il valore restituito seleziona però AIN11. **Hardware:** il default del chip seleziona AIN0. [Datasheet, tabella 2](https://www.analog.com/media/en/technical-documentation/data-sheets/MAX11612-MAX11617.pdf#page=15). Il default della libreria è dunque una scelta applicativa, non il ripristino fedele dello stato iniziale.

### Tre byte da saper riconoscere

| Composizione | Operazione | Risultato |
| --- | --- | --- |
| Default della libreria | `(0 << 5) | (11 << 1) | 1` | `0x17`, `00010111` |
| Singolo canale AIN0, single-ended | `(3 << 5) | (0 << 1) | 1` | `0x61`, `01100001` |
| Da AIN0 ad AIN3, single-ended | `(0 << 5) | (3 << 1) | 1` | `0x07`, `00000111` |

> **Attuale:** passare `0x61` come terzo argomento di `MAX116xx::new()` non fa leggere solo AIN0. Quell'argomento è ignorato; `read_all_sensors()` ricostruisce sempre `ConfigByte::default()`, cioè `0x17`.

### Laboratorio dei byte

Nella versione HTML puoi cambiare tutti i campi del setup e della configuration e osservare i bit, il valore esadecimale e il codice Rust corrispondente. Il laboratorio costruisce i byte secondo il sorgente; non modifica il driver e non invia comandi I²C.

<!-- laboratorio-byte -->

Fonte: [config_byte.rs](https://github.com/uniuderacing/max1161x/blob/ac91bd8ca657ee3962acefc0e5e57291e7d0ba19/src/max_messages/config_byte.rs).

## 05 · Driver

### MAX116xx::new

```rust
pub fn new(
    mut i2c: I2C,
    setup_byte: setup_byte::SetupByte,
    config_byte: u8,
) -> Self
```

| Aspetto | Contratto reale |
| --- | --- |
| Ingresso | Un oggetto che implementa `I2c`, un `SetupByte`, un `u8` |
| Effetto | Un tentativo di `i2c.write(V::ADDR, &[setup_byte.to_byte()])` |
| Esito positivo | Log `Trovato` e restituzione dell'oggetto |
| Esito negativo | Log con indirizzo ed errore, poi restituzione dell'oggetto comunque |
| Terzo parametro | Mai letto, inviato o conservato |
| Stato conservato | Solo bus e `PhantomData`; nessuna copia dei due byte |
| Attese / retry | Nessuna attesa esplicita, nessun retry nel driver |

Il log `Trovato` significa che la scrittura è riuscita secondo l'HAL. Non verifica un'identità del chip né legge un registro di identificazione. Un oggetto costruito non dimostra che il setup sia arrivato al destinatario: la funzione non restituisce `Result`.

Non si può scrivere `MAX116xx::new(...)?`, perché il risultato è `Self`, non un risultato fallibile. La successiva `read_all_sensors()` può invece restituire un errore I²C. Una lettura riuscita non dimostra retroattivamente che il setup originario fosse quello richiesto.

### MAX116xx::read_all_sensors

```rust
pub fn read_all_sensors(&mut self, output: &mut [f32])
    -> Result<(), I2C::Error>
```

La chiamata richiede accesso mutabile al driver e a una slice fornita dal chiamante. L'API è sincrona: il thread rimane occupato fino al ritorno della transazione e della conversione software.

1. Legge `V::ADDR` e alloca sullo stack un buffer di 24 byte inizializzato a zero.
2. Costruisce `[ConfigByte::default().to_byte()]`, quindi `[0x17]`.
3. Calcola `rx_size = 2 * V::CHANNELS`.
4. Esegue `i2c.write_read(addr, &[0x17], &mut rx_buffer[..rx_size])`.
5. Se la transazione riesce, divide il buffer in coppie di byte.
6. Per ogni coppia ricostruisce il codice a 12 bit, calcola la tensione con 3,3 V e applica il polinomio.
7. Scrive la temperatura in `output[channel_index]` e restituisce `Ok(())`.
8. Se la transazione fallisce, registra un messaggio generico e restituisce l'errore originale.

| Condizione | Effetto osservabile |
| --- | --- |
| `output.len() == V::CHANNELS` | Tutti gli elementi vengono sovrascritti dopo una transazione riuscita |
| `output.len() > V::CHANNELS` | Solo il prefisso viene scritto; la coda resta invariata |
| `output.len() < V::CHANNELS` | Nessun controllo preventivo: dopo una transazione riuscita può avvenire un panic per indice fuori limite, con prefisso già modificato |
| Errore restituito da `write_read` | `Err(e)`; la slice `output` non viene aggiornata da questa chiamata |
| `Variant` custom con troppi canali | Possibile panic prima dell'I/O nel slicing del buffer |

> **Uso corretto attuale:** prepara una slice di almeno `V::CHANNELS` elementi, gestisci il `Result` e considera validi i nuovi dati solo in caso di `Ok`. Se la chiamata fallisce, i vecchi valori eventualmente presenti in `output` restano vecchi: l'API non aggiunge timestamp o flag di validità.

Con la configurazione fissa e una scansione completa, `output[0]` corrisponde al primo risultato e viene interpretato come AIN0. Questa corrispondenza è un'assunzione del percorso attuale: con scansioni, pin REF o mappature differenti deve essere rivista.

### MAX116xx::voltage_to_temperature

```rust
fn voltage_to_temperature(&mut self, v: f32) -> f32
```

È un metodo **privato**, non chiamabile dal firmware utente. Richiede `&mut self` ma il corpo non modifica campi dell'oggetto. Converte l'argomento in `f64`, valuta un polinomio cubico tramite `powi()` e torna a `f32`. Non legge I²C, non gestisce errori e non limita il risultato a un intervallo.

La formula e il significato della taratura sono spiegati nel [capitolo sulle conversioni](#06-conversioni). Non esiste una funzione pubblica per sostituire i coefficienti.

### MAX116xx::calibrate_me

```rust
pub fn calibrate_me(&mut self)
```

La funzione è commentata come strumento di test. Alloca due array da 12 `f32`, uno per i codici medi e uno per le tensioni medie. Esegue cinque tentativi con la stessa configuration fissa della lettura ordinaria. Dopo ogni tentativo chiama `thread::sleep(Duration::from_millis(500))`, anche dopo l'ultimo.

Se una lettura riesce, accumula codici e volt per i canali della variante. Se fallisce, registra `ERR` e prosegue. Alla fine divide tutti e dodici gli elementi per **5**, anche se sono riuscite meno di cinque letture, e registra solo `raw_arr[0]` e `volt_arr[0]`.

| Aspetto | Conseguenza |
| --- | --- |
| Cinque sleep da 500 ms | Circa 2,5 s di pause, più tempo I²C e scheduling |
| Nessun `Result` o valore restituito | Il chiamante non riceve medie o conteggio dei successi |
| Divisore sempre 5 | Gli errori abbassano artificialmente la media |
| Un solo canale nei log finali | Gli altri risultati accumulati non sono esposti |
| Coefficienti mai modificati | Non effettua fitting, non salva una calibrazione e non tara il driver |

Esempio: quattro letture riuscite da raw 2000 e una fallita producono `8000 / 5 = 1600`, mentre la media delle letture valide sarebbe 2000. Non usare il risultato come taratura senza tenere conto di questo comportamento.

### Errori, log e metodi assenti

L'unico errore propagato dall'API ordinaria è `I2C::Error`, il tipo associato dell'implementazione HAL. Non ci sono errori applicativi per slice corta, setup non valido, sensore scollegato o temperatura fuori intervallo. I panic e gli errori I²C sono quindi due percorsi distinti.

Per vedere le macro `log::info!` e `log::error!` il firmware deve installare e configurare un logger. Il driver non lo inizializza. Non esistono `read_channel`, `read_raw`, `read_voltage`, `set_config`, `set_vref`, `reset`, `release` o metodi async pubblici in questo checkout.

Fonte: [max_driver.rs](https://github.com/uniuderacing/max1161x/blob/ac91bd8ca657ee3962acefc0e5e57291e7d0ba19/src/max_driver.rs).

## 06 · Conversioni

### Una lettura completa sul bus

Per `MAX11617`, la libreria sceglie indirizzo `0x35`, dodici canali e 24 byte di ricezione. Con setup di default il percorso è questo:

```text
Creazione:
  write(addr=0x35, data=[0x82])

Ogni read_all_sensors():
  write_read(addr=0x35, tx=[0x17], rx=24 byte)
                                      │
                                      ├─ [0,1]   → primo campione → output[0]
                                      ├─ [2,3]   → secondo        → output[1]
                                      └─ [22,23] → dodicesimo     → output[11]
```

Il contratto di `write_read` è una transazione combinata: scrittura e lettura allo stesso indirizzo, con repeated START fra le due fasi. Il driver delega la generazione dei segnali all'implementazione HAL. Il bit R/W non è incluso in `V::ADDR`: nell'analisi di un logic analyzer `0x35 << 1` dà `0x6A` in scrittura e `0x6B` in lettura. Alcuni strumenti mostrano direttamente `0x35` con la direzione separata.

```text
START → 0x35 W → ACK → 0x17 → ACK → repeated START → 0x35 R
      → byte 0 … byte 23, ACK intermedi → NACK finale → STOP
```

La configurazione del controller I²C, dei pin, del timeout e della velocità è responsabilità del chiamante. Anche il supporto al clock stretching appartiene all'HAL/controller; questa libreria non contiene una sua temporizzazione delle conversioni.

### Ricostruire i 12 bit

```rust
let high_part = (pair[0] & 0x0F) as u16;
let raw_value = (high_part << 8) | (pair[1] as u16);
```

La maschera `0x0F` elimina il nibble alto del primo byte. I quattro bit rimasti diventano i bit 11…8 del campione; il secondo byte fornisce i bit 7…0. Non si tratta di due campioni a 8 bit e non si deve fare una media dei due byte.

```text
primo byte     secondo byte
1111 1010      1011 1100
     └──┐      └───────┐
        1010 1011 1100 = 0xABC = 2748
```

Per esempio `[0xFA, 0xBC]` e `[0x0A, 0xBC]` producono lo stesso codice `0xABC` perché i quattro bit alti vengono scartati. Il codice è sempre interpretato come intero senza segno. Questo non è un decoder differenziale bipolare.

### Dal codice alla tensione

```rust
let voltage = (raw_value as f32 * 3.3) / 4096.0;
```

Nel driver, uno step vale `3.3 / 4096 = 0.0008056640625 V`, circa 0,806 mV. Il divisore è 4096, cioè il numero dei livelli a 12 bit; il codice massimo è 4095. Quindi il massimo numerico ricostruito è circa 3,299194 V.

| Raw | Hex | Tensione con la formula attuale |
| --- | --- | --- |
| 0 | `0x000` | 0 V |
| 1024 | `0x400` | 0,825 V |
| 2048 | `0x800` | 1,650 V |
| 2748 | `0xABC` | 2,214 V circa |
| 4095 | `0xFFF` | 3,299 V circa |

> **Attuale:** il numero 3,3 è hardcoded e non dipende da `SetupByte`, da `V` o dall'alimentazione misurata. Se si seleziona un riferimento diverso, la formula resta la stessa e può produrre un errore sistematico. Anche con `VddRef`, 3,3 V è un'assunzione sul valore effettivo di VDD.

### Dalla tensione alla temperatura

Il commento del sorgente descrive una regressione cubica tarata sperimentalmente con MAX11617, fra **15 e 75 °C**, con punti ogni 5 °C. Non sono inclusi dati grezzi della taratura, modello del sensore, errore residuo o incertezza: quel commento documenta l'intenzione, non misura l'accuratezza del sistema.

```text
T(v) = a·v³ + b·v² + c·v + d

a =  1.79615598298204
b = -9.37248626037254
c = 38.0779254777707
d = -2.53332540256446
```

La variabile `v` è la tensione in volt calcolata dalla formula precedente. L'uscita viene interpretata dal progetto come temperatura in °C. I coefficienti sono parte del sorgente, non parametri del dispositivo ADC.

| Esempio | Volt usati | Temperatura stimata, arrotondata |
| --- | --- | --- |
| Raw 0 | 0 | −2,53 °C |
| Raw 1024 | 0,825 | 23,51 °C |
| Raw 2048 | 1,650 | 42,85 °C |
| Raw 4095 | 3,299194… | 85,58 °C |

I valori esterni a 15…75 °C sono possibili perché il codice non esegue clamp né rifiuta l'estrapolazione. Una temperatura fuori dal campo di taratura non equivale a una misura validata in quel campo. Anche un sensore scollegato può dare un risultato numerico: l'API non diagnostica da sola la connessione fisica del sensore.

### Laboratorio numerico

La versione HTML ricostruisce due byte a partire da un raw, mostra i passaggi e confronta la formula fissa del driver con un riferimento alternativo scelto per studio. Il confronto non modifica l'API: il driver continua a usare 3,3 V. I risultati sono illustrativi; JavaScript usa precisione diversa dai passaggi `f32`/`f64` del codice Rust.

<!-- laboratorio-conversione -->

Fonti: [driver e coefficienti](https://github.com/uniuderacing/max1161x/blob/ac91bd8ca657ee3962acefc0e5e57291e7d0ba19/src/max_driver.rs), [contratto I2c::write_read di embedded-hal 1.0.0](https://docs.rs/embedded-hal/1.0.0/embedded_hal/i2c/trait.I2c.html#method.write_read).

## 07 · Esempi

### Collegare la dipendenza

Nel `Cargo.toml` del firmware, adattando il percorso alla sua posizione:

```toml
[dependencies]
max1161x = { path = "../max1161x" }
embedded-hal = "1.0.0"
```

Per rendere riproducibile una dipendenza Git si può fissare la revisione analizzata:

```toml
[dependencies]
max1161x = { git = "https://github.com/uniuderacing/max1161x.git", rev = "ac91bd8ca657ee3962acefc0e5e57291e7d0ba19" }
embedded-hal = "1.0.0"
```

Scegli una delle due forme. L'accesso Git alla repository e il toolchain ESP sono requisiti dell'ambiente del team; qui non vengono inventati pin o target universali. La crate non include una configurazione `.cargo` o `rust-toolchain.toml` propria per completare l'ambiente firmware.

### Esempio coerente con l'API: dodici temperature

Questo frammento è una funzione di integrazione: riceve un bus già inizializzato. Il chiamante deve configurare periferica, pin, clock, logger e timeout per la propria scheda. L'esempio usa MAX11617, VDD come riferimento e l'assunzione applicativa VDD = 3,3 V.

```rust
use embedded_hal::i2c::I2c;
use max1161x::{
    max_driver::MAX116xx,
    max_messages::{config_byte::ConfigByte, setup_byte::SetupByte},
    max_variants::MAX11617,
};

pub fn acquisisci_temperature<I: I2c>(i2c: I) -> Result<[f32; 12], I::Error> {
    let setup = SetupByte::default(); // 0x82, VDD, clock interno
    let config = ConfigByte::default().to_byte(); // 0x17

    // Il terzo argomento è richiesto dalla firma ma oggi è ignorato.
    // new() non propaga gli errori di inizializzazione.
    let mut adc: MAX116xx<I, MAX11617> = MAX116xx::new(i2c, setup, config);

    let mut temperature = [0.0_f32; 12];
    adc.read_all_sensors(&mut temperature)?;
    Ok(temperature)
}
```

Questo esempio crea e consuma il driver per una singola acquisizione. In un task periodico conviene costruire `adc` una volta, prima del loop, e riusare `adc.read_all_sensors(&mut temperature)`. Il chiamante decide periodicità, pubblicazione dei dati e gestione degli errori.

```rust
// Frammento da inserire dove adc e temperature sono già stati creati.
match adc.read_all_sensors(&mut temperature) {
    Ok(()) => {
        // Qui i 12 elementi sono nuovi. Pubblicarli con un timestamp.
    }
    Err(error) => {
        // Qui temperature contiene ancora i valori precedenti.
        // Marcare il campione come non aggiornato e gestire error.
        let _ = error;
    }
}
```

### Costruire un setup esplicito

```rust
use max1161x::max_messages::setup_byte::{Clock, Mode, RefSelect, SetupByte};

let setup = SetupByte::new(
    RefSelect::VddRef,
    Clock::Internal,
    Mode::Unipolar,
    true, // RST=1: nessun reset della configuration
);
assert_eq!(setup.to_byte(), 0x82);
```

Cambiare `RefSelect` è tecnicamente possibile, ma non aggiorna la formula di conversione o i canali attesi. Per sperimentare il riferimento interno servono un'attesa appropriata e una conversione software coerente, non soltanto un enum diverso.

### Costruire una lettura singola: serializzazione soltanto

```rust
use max1161x::max_messages::config_byte::{
    ChannelSelect, ConfigByte, InputMode, ScanConfig,
};

let config = ConfigByte::new(
    ScanConfig::SingleChannel,
    ChannelSelect::Ain0,
    InputMode::SingleEnded,
);
assert_eq!(config.to_byte(), 0x61);
```

Il frammento dimostra la codifica. Non rende `read_all_sensors()` una funzione a singolo canale, neppure passando il byte a `new()`.

### Lettura raw diretta per studio, fuori dall'API del driver

Questo helper è **codice applicativo di esempio**, non una funzione esistente nella crate. Usa direttamente il bus, che deve essere ancora posseduto dal chiamante. Presuppone che il MAX11617 sia già configurato con setup coerente con la lettura single-ended; non converte il dato in temperatura.

```rust
use embedded_hal::i2c::I2c;
use max1161x::{
    max_messages::config_byte::{ChannelSelect, ConfigByte, InputMode, ScanConfig},
    max_variants::{MAX11617, Variant},
};

pub fn leggi_ain0_raw<I: I2c>(i2c: &mut I) -> Result<u16, I::Error> {
    let config = ConfigByte::new(
        ScanConfig::SingleChannel,
        ChannelSelect::Ain0,
        InputMode::SingleEnded,
    );
    let mut rx = [0_u8; 2];
    i2c.write_read(MAX11617::ADDR, &[config.to_byte()], &mut rx)?;
    Ok((((rx[0] & 0x0F) as u16) << 8) | rx[1] as u16)
}
```

Dopo aver spostato il bus posseduto in `MAX116xx::new()` non puoi riusare quel valore per questo helper. Un'alternativa è costruire il driver passando `&mut i2c`, terminare il suo utilizzo con `drop(adc)` e poi richiamare l'helper sul bus originale. Non esiste un metodo del driver per estrarre un bus posseduto.

### Perché examples/test.rs richiede correzioni

L'esempio nel repository passa `setup_byte: u8` mentre la firma attuale richiede `SetupByte`. Inoltre usa `vcu_rt`, `Peripherals`, `I2cConfig`, `I2cDriver` e `400.kHz()` senza fornire tutte le dipendenze e gli import necessari nel package standalone. Non lo presentiamo come un programma pronto da compilare.

Il suo byte `0xD2` seleziona il riferimento interno acceso; la formula del driver usa comunque 3,3 V. Il suo `config_byte = 0x61` sembra voler leggere AIN0, ma viene ignorato. Il file crea il driver e termina: non contiene una chiamata di acquisizione.

Fonte: [esempio originale](https://github.com/uniuderacing/max1161x/blob/ac91bd8ca657ee3962acefc0e5e57291e7d0ba19/examples/test.rs).

## 08 · Multiplexer

### A cosa servirebbe il governor

Due MAX11617 hanno entrambi indirizzo `0x35`. Il progetto prevede il TCA9543A per separarli in rami e un oggetto governor per presentare al firmware un insieme di sensori. Questa facade avrebbe il compito di selezionare un ramo, accedere al suo ADC e associare i risultati a un'identità stabile.

**Attuale:** `src/mux_governor.rs` contiene solo `// mux_governor` e non è esportato da `lib.rs`. Mancano selezione del ramo, gestione degli ADC, builder, buffer aggregato e propagazione degli errori del mux. Non esiste un import `max1161x::mux_governor` utilizzabile.

### Sequenza concettuale, non API implementata

```text
seleziona soltanto ramo 0
  → configura / legge ADC A a 0x35
  → associa campioni ad AIN0…AIN11 di A
seleziona soltanto ramo 1
  → configura / legge ADC B a 0x35
  → associa campioni ad AIN0…AIN11 di B
```

**Hardware:** TCA9543A ha due rami, selezionabili singolarmente o insieme, e supporta fino a 400 kHz. Al power-up i rami sono disabilitati. Con due ADC allo stesso indirizzo occorre selezionarne uno alla volta per evitare risposte sovrapposte. La selezione del ramo richiede una scrittura al registro di controllo del mux e uno STOP prima delle transazioni sul ramo. [Datasheet TCA9543A, descrizione e programmazione](https://www.ti.com/lit/ds/symlink/tca9543a.pdf#page=13).

### Responsabilità da progettare

| Responsabilità | Perché conta |
| --- | --- |
| Ownership / condivisione del bus | L'ADC attuale prende possesso dell'oggetto I²C |
| Selezione e transazione protette insieme | Un altro task non deve cambiare ramo tra selezione e lettura |
| Configurazione per ogni ADC | Lo stato del setup appartiene a ciascun chip, non al mux |
| Identità sensore | `(ramo, canale)` deve restare distinguibile |
| Errori e validità | Un errore sul ramo 1 non deve far apparire aggiornati i suoi dati |
| Dimensione dei risultati | Due ADC da 12 canali richiedono una convenzione per 24 risultati |

Questa tabella è una **proposta di responsabilità**, non una descrizione di codice già presente. Una dipendenza da `embedded-hal-bus` non implementa automaticamente il governor o il protocollo del mux.

Fonte: [segnaposto mux_governor.rs](https://github.com/uniuderacing/max1161x/blob/ac91bd8ca657ee3962acefc0e5e57291e7d0ba19/src/mux_governor.rs).

## 09 · Limiti

### Anomalie che cambiano l'uso della libreria

| ID | Evidenza nel codice | Conseguenza pratica | Comportamento consigliato nell'uso attuale |
| --- | --- | --- | --- |
| L01 | `new()` ignora `config_byte` | La configurazione passata dal chiamante non viene applicata | Ricordare che la lettura invia sempre `0x17` |
| L02 | `new()` restituisce `Self` anche su errore | Un oggetto può esistere senza setup riuscito | Non trattare la costruzione come una conferma hardware |
| L03 | Formula volt con costante `3.3` | Riferimenti e alimentazioni diversi producono una scala errata | Usare solo condizioni coerenti con quell'assunzione o aggiornare il driver |
| L04 | `ConfigByte::default()` usa sempre `Ain11` | La configurazione non è adattata alle varianti a 4 e 8 canali | Non considerare validato il supporto completo alle sei varianti |
| L05 | Nessun controllo sulla slice `output` | Possibile panic e aggiornamento parziale del prefisso | Allocare almeno `V::CHANNELS` elementi |
| L06 | Riferimento, polarità e numero di risultati non conservati | La conversione non può adeguarsi al setup | Restare nel percorso single-ended unipolare previsto |
| L07 | Nessun sign extension | Non decodifica campioni bipolari correttamente | Non riusare il decoder come decoder bipolare |
| L08 | `calibrate_me()` divide sempre per 5 | Media falsata in presenza di errori | Considerarlo strumento diagnostico incompleto |
| L09 | Mux segnaposto e non esportato | Il progetto a due ADC non è gestibile dalla facade descritta | Progettare un livello mux separato prima dell'integrazione |
| L10 | Esempio con tipi/import non allineati | L'esempio standalone non è una guida di compilazione affidabile | Usare i frammenti esplicitamente spiegati in questa guida |
| L11 | `std` e dipendenza ESP-IDF non opzionale | Portabilità limitata del package | Verificare il target firmware; non assumere `no_std` |
| L12 | Nessun dato di validazione o suite di test nel checkout originale | Accuratezza e comportamento su bus non dimostrati | Separare analisi del codice e prove sperimentali |

Per L04 non è corretto affermare che ogni variante piccola fallisca sicuramente: parte della selezione può essere interpretata dal chip in modo specifico. Il problema dimostrato dal sorgente è che il driver **non costruisce una configuration specifica per `V`** e che la documentazione originale non contiene prove sulle sei varianti. La validazione resta da eseguire.

### Evoluzioni ragionevoli, non realizzate qui

Un driver più generale potrebbe restituire un `Result` dal costruttore, conservare setup e configuration, derivare il selettore finale dal numero di canali e validare la capacità del buffer. La lettura potrebbe esporre codici raw e tensioni con una Vref esplicita, lasciando il polinomio della temperatura a un livello sensore distinto.

Per i riferimenti e i pin condivisi andrebbe modellato il numero di risultati effettivo. Per il differenziale andrebbero specificati coppie, polarità e segno. Per `calibrate_me()` andrebbero contati i successi e restituiti i dati. Queste sono proposte progettuali: i sorgenti della libreria non sono stati modificati per implementarle.

## 10 · Diagnostica

### Partire dal sintomo

| Sintomo | Primo controllo | Collegamento al codice |
| --- | --- | --- |
| Log “Nessun dispositivo I2C trovato” | Alimentazione, GND, SDA/SCL, pull-up, indirizzo, ramo mux | La scrittura iniziale fallisce ma `new()` ritorna comunque |
| Log “Trovato”, poi errore di lettura | Setup reale, ramo selezionato, timeout/controller e cablaggio | Successo della scrittura non garantisce tutte le operazioni successive |
| `Err` da `read_all_sensors()` | Registrare l'errore HAL concreto nel chiamante | Il log interno della lettura è generico, ma `Err(e)` conserva il dettaglio |
| Panic durante la lettura | Lunghezza di `output`, eventuale `Variant` custom | Indicizzazione e slicing senza validazione |
| Un solo canale desiderato ma dodici risultati | Controllare la configuration effettivamente inviata | Il parametro passato a `new()` è ignorato |
| Temperature sistematicamente fuori scala | Riferimento selezionato e VDD reale | Formula fissa a 3,3 V |
| Valori negativi o molto alti | Codice raw, cablaggio, taratura e campo di utilizzo | Il polinomio non impone limiti |
| Media diagnostica troppo bassa | Contare letture fallite durante `calibrate_me()` | Il denominatore resta cinque |
| Nessun log | Configurazione logger e livello abilitato | Le macro `log` non installano un backend |
| `default()` non soddisfa un bound Rust | Distinguere metodo associato e trait | Nessuna `impl Default` per i due byte |
| Impossibile importare `mux_governor` | Verificare `lib.rs` | File non dichiarato e privo di implementazione |

### Sequenza di verifica su banco

1. Identificare modello dell'ADC e revisione della scheda; verificare schema elettrico e riferimento realmente usato.
2. Configurare il controller I²C e, se presente, selezionare un solo ramo mux.
3. Controllare con il logger o un logic analyzer indirizzo e byte di setup effettivi.
4. Per MAX11617 nel percorso di default, osservare `0x17` e una richiesta di 24 byte a ogni lettura.
5. Applicare a un ingresso una tensione nota e confrontare prima il raw con il riferimento reale, poi i volt e infine la temperatura stimata.
6. Ripetere su tutti i canali e su più punti del campo previsto; annotare errori, dispersione e condizioni.
7. Verificare gli errori I²C e il comportamento del chiamante sui dati non aggiornati, senza trattare i vecchi campioni come nuovi.

Questa è una procedura proposta da eseguire sul banco del team. La guida non dichiara già eseguiti questi passaggi. La scelta di tensioni, cablaggio e strumentazione va fatta sullo schema della scheda effettiva.

### Verifiche software prima dell'hardware

Si possono controllare senza ADC i byte `0x82`, `0xD2`, `0x17`, `0x61`, le costanti di variante e i passaggi numerici della formula. Un bus simulato consente inoltre di osservare la sequenza di scrittura/lettura e l'errore restituito. Una simulazione non dimostra tempi del controller, rumore analogico o qualità della taratura.

## 11 · Autoverifica

### Domande con soluzione

| Domanda | Risposta e ragionamento |
| --- | --- |
| Cosa contiene `output[3]` dopo una lettura riuscita del percorso default MAX11617? | La temperatura stimata del quarto risultato, interpretato come AIN3; non il raw ADC |
| Perché due MAX11617 non si distinguono col solo `Variant`? | Entrambi usano `ADDR=0x35`; serve una separazione di bus o ramo |
| Che cosa produce `SetupByte::default().to_byte()`? | `0x82`: REG=1, SEL=000, CLK=0, BIP=0, RST=1 |
| `reset=true` resetta il chip? | No: scrive RST=1, cioè nessuna azione di reset della configuration |
| Che cosa produce `ConfigByte::default().to_byte()`? | `0x17`: scansione da zero ad AIN11, single-ended |
| Che cosa cambia passando `0x61` a `new()`? | Nulla nella configuration di lettura attuale: il parametro è ignorato |
| Come decodifichi `[0xFA, 0xBC]`? | `(0xA << 8) | 0xBC = 0xABC = 2748` |
| Quanto vale raw 2048 nella formula attuale? | 1,65 V, poi circa 42,85 °C |
| Perché il massimo raw non diventa esattamente 3,3 V? | La formula divide 4095 per 4096 |
| È sufficiente usare `InternalRefOn` per avere temperature corrette? | No: il driver non adegua Vref, attese o conversione software |
| Che succede con una slice da 11 elementi su MAX11617? | Se l'I²C riesce, può andare in panic al dodicesimo risultato |
| Dopo `Err`, i valori in output sono nuovi? | No: la funzione non li aggiorna in quel percorso |
| `calibrate_me()` aggiorna i coefficienti? | No: media misure diagnostiche e registra il solo canale 0 |
| La presenza di `embedded-hal-async` rende il driver asincrono? | No: il bound e i metodi usano l'I²C sincrono |

### Esercizi consigliati

1. Componi a mano una configuration `SingleChannel`, `Ain5`, `SingleEnded`: il risultato deve essere `0x6B`. Confrontalo con il laboratorio HTML.
2. Parti da `[0xF8, 0x00]`: ricava raw 2048, poi 1,65 V e la temperatura del polinomio. Spiega perché il nibble `0xF` non cambia il raw.
3. Disegna il percorso di un `Err` in `new()` e in `read_all_sensors()`: identifica quale errore arriva al chiamante.
4. Proponi una firma per una lettura raw con buffer validato. Distingui la nuova API da quelle realmente presenti.
5. Disegna una sequenza per leggere 24 sensori dietro il mux, conservando `(ramo, canale)` e validità dei campioni.

### Glossario

| Termine | Significato nel contesto |
| --- | --- |
| ADC | Convertitore analogico-digitale |
| Raw | Codice numerico ricostruito dai bit del risultato |
| VDD | Alimentazione del chip; nel setup può essere selezionata come riferimento |
| Vref | Riferimento usato per la scala della conversione |
| AIN | Ingresso analogico numerato del chip |
| Single-ended | Lettura di un ingresso rispetto alla massa |
| Differenziale | Lettura della differenza fra due ingressi |
| Unipolare / bipolare | Convenzione di intervallo e segno della conversione |
| LSB | Passo di un codice nella scala numerica |
| Nibble | Gruppo di quattro bit |
| ACK / NACK | Riscontro positivo / negativo nella transazione I²C |
| Repeated START | Nuova condizione START senza uno STOP intermedio |
| Clock stretching | Il dispositivo prolunga lo stato basso di SCL |
| HAL | Astrazione software della periferica hardware |
| Trait | Contratto Rust che un tipo implementa |
| Generic | Parametro di tipo risolto per il tipo concreto usato |
| Ownership | Regole Rust che determinano chi possiede un valore |
| PhantomData | Marcatore che associa un parametro di tipo senza conservarne un valore |
| Facade / governor | Livello che coordinerebbe più ADC e nasconderebbe la selezione dei rami |
| Taratura | Determinazione del rapporto fra ingresso noto e misura; qui i coefficienti sono già nel codice |

### Indice rapido dell'API

| Percorso | Tipi o metodi da cercare |
| --- | --- |
| `max1161x::max_driver` | `MAX116xx`, `new`, `read_all_sensors`, `calibrate_me` |
| `max1161x::max_messages::setup_byte` | `SetupByte`, `RefSelect`, `Clock`, `Mode`, `new`, `default`, `to_byte` |
| `max1161x::max_messages::config_byte` | `ConfigByte`, `ScanConfig`, `ChannelSelect`, `InputMode`, `new`, `default`, `to_byte` |
| `max1161x::max_variants` | `Variant`, `ADDR`, `CHANNELS`, `MAX11612`, `MAX11613`, `MAX11614`, `MAX11615`, `MAX11616`, `MAX11617` |

`voltage_to_temperature` compare nella spiegazione perché è importante al funzionamento, ma è privato. Non fa parte dell'API pubblica chiamabile.

## 12 · Manutenzione

### File consegnati

| File | Uso |
| --- | --- |
| [guida-max1161x.html](guida-max1161x.html) | Documento autonomo con ricerca, indice e laboratori |
| [guida-max1161x.md](guida-max1161x.md) | Testo sorgente completo, leggibile e modificabile |
| [README.md](README.md) | Accesso rapido e istruzioni di rigenerazione |
| `genera_guida.py` | Generatore locale con sola libreria standard Python |
| `stile.css`, `interazioni.js`, `laboratori.html` | Sorgenti dell'interfaccia incorporati nell'HTML finale |
| `verifica_documentazione.py` | Verifica strutturale, link, sorgenti e simulazione del driver |
| `verifica_driver.rs`, `verifica_interazioni.cjs` | Harness Rust e DOM simulato usati dalle verifiche |
| `verifica-documentazione.json` | Esito delle verifiche riproducibili; consultare i limiti riportati |

### Rigenerare l'HTML

Dalla directory `docs/tsac/` di Serena III, con Python 3 e senza installare dipendenze Python:

```powershell
python genera_guida.py
python verifica_documentazione.py
```

Il Markdown è la fonte del testo; CSS, JavaScript e markup dei laboratori sono incorporati nel file finale. Non occorrono fetch o server per usare l'HTML. Se si sposta soltanto l'HTML, la guida e i laboratori restano funzionanti; i link ai file Markdown richiedono naturalmente anche quei file.

Questi comandi funzionano nella repository della documentazione senza le sorgenti della libreria: controllano documento e JavaScript. Per eseguire anche la verifica dei simboli e il test Rust, indica un checkout separato di MAX1161x alla revisione analizzata:

```powershell
python verifica_documentazione.py --source-root "D:/percorso/max1161x"
```

Il verificatore esegue i controlli Rust, Cargo e JavaScript quando trova rispettivamente `rustc`, `cargo` e `node` nel PATH; quelli Rust e Cargo richiedono anche il checkout indicato. Gli eventuali controlli saltati sono espliciti nel report. Non cerca sorgenti in percorsi personali predefiniti e non scarica dipendenze.

Il generatore supporta i costrutti Markdown usati in questa guida: titoli, paragrafi, tabelle, liste semplici, link, enfasi, citazioni e blocchi di codice. Non è un convertitore Markdown universale. Ogni capitolo ha un anchor breve stabile, per esempio `#05-driver`; i titoli delle sottosezioni ricevono un ID univoco.

### Cosa provano le verifiche

La verifica strutturale controlla gli anchor, i collegamenti locali, i capitoli, le dipendenze esterne dell'interfaccia e le impronte delle sorgenti analizzate. Un harness Rust importa i file reali di setup, configuration, varianti e driver e usa un bus finto per esercitare byte, sequenza I²C, decodifica, gestione degli errori e vincoli del buffer. I piccoli sostituti dei trait HAL e dei log sono confinati al test: non compilano né validano l'intero grafo ESP-IDF.

Il browser integrato della sessione ha rifiutato gli URL `file://` per policy: non è stata completata una verifica visiva nel browser. Il controllo JavaScript verifica sintassi e interazioni principali in un DOM simulato; la resa grafica e gli appunti, la stampa e il comportamento assistivo del browser reale restano da controllare aprendo il file localmente.

`cargo metadata --no-deps --offline` è stato usato per confermare package e target dichiarati. La presenza del target `examples/test.rs` non ne dimostra la compilabilità. Le verifiche della documentazione non equivalgono a una compilazione completa del firmware, a una prova di conformità elettrica o a una validazione della regressione termica.

### Fonti essenziali

| Fonte | Cosa sostiene |
| --- | --- |
| [Repository, revisione analizzata](https://github.com/uniuderacing/max1161x/tree/ac91bd8ca657ee3962acefc0e5e57291e7d0ba19) | Tutte le firme, costanti e anomalie descritte come attuali |
| [Datasheet MAX11612–MAX11617](https://www.analog.com/media/en/technical-documentation/data-sheets/MAX11612-MAX11617.pdf) | Integrazioni hardware su alimentazione, riferimenti e registri |
| [Datasheet TCA9543A](https://www.ti.com/lit/ds/symlink/tca9543a.pdf) | Comportamento del mux previsto dal progetto |
| [embedded-hal 1.0.0, I2c](https://docs.rs/embedded-hal/1.0.0/embedded_hal/i2c/trait.I2c.html) | Contratto della transazione delegata all'HAL |

Se cambiano il driver o i byte, aggiornare insieme spiegazione, esempi, laboratori e verifiche; poi rigenerare l'HTML. Conservare un riferimento al commit evita di attribuire questa analisi a revisioni diverse.
