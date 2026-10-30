# 3. Messaggi: dalle definizioni YAML al CAN

## 3.1 Il modello a tre livelli

`messages` è il motore generico. Definisce identificatori, frame, trait, valori scalati, conversioni e macro. `serena-messages` è il vocabolario concreto del veicolo: descrive messaggi e campi in YAML. `firmware` crea e legge gli oggetti Rust generati da quel vocabolario.

```text
serena-messages/definitions/*.yaml
               │ macro messages::message_structs!(Message, "definitions")
               ▼
Tipi Rust: BrainStatusMessage, PrechargeStatusMessage, enum dei campi...
               │ new() / with_*() / getter / conversioni
               ▼
messages::Frame  →  frame CAN ESP-IDF  →  bus
               ▲
Bus → frame CAN → messages::Frame → conversione / dispatcher → callback
```

La macro è invocata in `serena-messages/src/definitions.rs`. Il `build.rs` segnala a Cargo di rieseguire la build quando cambia `definitions`; non contiene da solo il generatore dei messaggi.

**Fonti:** [macro](https://github.com/uniuderacing/messages/blob/56f028257b1cfbb9f44f50d629b039f797d1a110/messages_macro/src/lib.rs), [invocazione Serena](https://github.com/uniuderacing/serena-messages/blob/f7cbf162f1720c0c1dbaccd9f68a19ffbccf36bb/src/definitions.rs).

## 3.2 Che cosa genera la macro

Per ogni definizione produce una struct a bitfield, i tipi enum dei campi enumerati, metodi di costruzione/accesso e implementazioni dei trait. Genera inoltre un enum globale `Message` che contiene le diverse famiglie di messaggi e conversioni da/verso frame.

Esempio corrispondente al vocabolario del firmware:

```rust
let status = serena_messages::BrainStatusMessage::new()
    .with_state(serena_messages::BrainStatusMessageState::Lv);

let message: serena_messages::Message = status.into();
let frame: messages::Frame = message.into();
```

Questo frammento illustra le API e le conversioni presenti; non è stato compilato come esempio autonomo. In Brain il frame viene poi affidato al wrapper CAN o al runtime, secondo la variante.

La validazione della macro usa lo schema/database. Non serve rigenerare `messages_database` per ogni modifica alle definizioni del veicolo: lo script `regenerate_database.sh` riguarda le modifiche allo schema.

## 3.3 Identificatori: come leggere una cattura CAN

Per i messaggi standard che usano la convenzione message/node:

```text
11 bit arbitration ID = [ message ID: 6 bit ][ node ID: 5 bit ]
raw_id = (message_id << 5) | node_id
```

Esempio: `Brain Status` ha message ID `0x26` e node `0b00010`. L’ID completo è `(0x26 << 5) | 2 = 0x4C2`. Non cercare quindi `0x26` direttamente come arbitration ID nello sniffer.

I node ID costituiscono una convenzione per classi di destinatari, non sono semplicemente il mittente. Le definizioni documentano per esempio `0b0XX1X` per Brain, `0bX0X1X` per steering e `0bXX01X` per il retrotreno. La maschera attuale nel filtro `Boards::Brain` è però `0b10010` con filtro `0b00010`: non coincide con tutti i bit fissi dichiarati dalla notazione del commento. Per sapere cosa passa, controlla la maschera implementata.

Il sync usa `Boards::Generic`, cioè allow-all; l’old usa `Boards::Brain`. Un messaggio definito nel vocabolario non è automaticamente letto da tutti i task: devono passare il filtro e deve esistere un listener o una callback.

Gli ID extended hanno 29 bit; la libreria supporta message e node anche in quella forma. Alcune definizioni usano un ID raw, senza scomposizione. Per questi casi non applicare la formula standard a 11 bit.

Le note del repository sui valori di broadcast dell’inverter non sono uniformi fra commenti. Non dedurre da quelle note un nuovo ID di comando: usa la definizione e il protocollo della versione effettiva dell’inverter.

**Fonti:** [StandardId e ExtendedId](https://github.com/uniuderacing/messages/blob/56f028257b1cfbb9f44f50d629b039f797d1a110/src/lib.rs), [convenzione node](https://github.com/uniuderacing/serena-messages/blob/f7cbf162f1720c0c1dbaccd9f68a19ffbccf36bb/definitions/README.md), [filtri implementati](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/utilities/hal/can/filter.rs).

## 3.4 I messaggi da conoscere per Brain

Questa tabella riguarda la revisione **Serena 1.0.0 bloccata dal firmware**. “RX/TX” è riferito a Brain sync; i nomi delle struct sono quelli generati in Rust.

| Messaggio | Verso | Uso nel codice |
| --- | --- | --- |
| `PrechargeStatusMessage` | RX | AIR−, AIR+, V_bus; ingresso TS e limite potenza |
| `InverterGeneralData1Message` | RX | ERPM per velocità e controllo |
| `InverterGeneralData2Message` | RX | Corrente DC per riconoscere regen alla luce stop |
| `TsacCutoffCurrentMessage` | RX | Limite aggiuntivo di corrente di accelerazione |
| `MotorMapMessage` | RX/TX | Richiesta Next; pubblicazione della mappa in LV |
| `LvStatus1Message` | RX | Richiesta suono sottotensione sotto la soglia numerica 11000 |
| `BrainStatusMessage` | TX | LV, TS, R2D, Calibration; nessuna variante CAN Precharge in questa enum |
| `RawAppsVoltagesMessage` | TX | Due letture raw dei sensori |
| `RawBrakePressureVoltagesMessage` | TX | Lettura raw e posizione Front |
| `ThrottlePercentageMessage` | TX | Percentuale raw e mapped durante R2D |
| `ShutdownSensingMessage` | TX | Stato aperto/chiuso con dispositivo Tsms |
| `InverterDriveEnableMessage` | TX | Enable periodico in R2D |
| `SetInverterAcCurrentMessage` | TX | Richiesta di corrente in accelerazione |
| `SetInverterBrakeCurrentMessage` | TX | Richiesta di corrente di frenata |
| `SetInverterSpeedMessage` | TX | Setpoint ERPM della mappa velocità |
| Quattro messaggi `SetInverterMaximum*` | TX | Limiti AC/DC in accelerazione e frenata |
| `WarningMessage`, `ErrorMessage` | TX | Fuori range, plausibilità, dati scaduti |

Per gli ID completi, le dimensioni e tutti i campi consulta il [catalogo generato](catalogo-can.md). È estratto dalle definizioni, quindi comprende anche messaggi che Brain sync non produce o non consuma.

Riferimento rapido per una cattura sul bus, sempre per Serena 1.0.0:

| Messaggio | ID CAN standard completo | Payload |
| --- | --- | --- |
| Brain Status | `0x4C2` | 1 byte |
| Motor Map | `0x4E7` | 1 byte |
| Precharge status | `0x2EF` | 5 byte |
| Inverter general data 1 | `0x407` | 8 byte |
| Inverter general data 2 | `0x427` | 4 byte |
| TSAC cutoff current | `0x60F` | 2 byte |
| Raw APPS voltages | `0x384` | 8 byte |
| Raw brake pressure voltages | `0x3C4` | 5 byte |
| Throttle percentage | `0x3E4` | 6 byte |
| Shutdown sensing | `0x3EF` | 1 byte |
| Set inverter AC current | `0x027` | 2 byte |
| Set inverter brake current | `0x047` | 2 byte |
| Set inverter speed | `0x067` | 4 byte |
| Inverter drive enable | `0x187` | 1 byte |

Per esempio, `Control diagnostics` è definito in YAML, ma ciò non dimostra che Brain sync implementi traction control. Analogamente `Throttle percentage` contiene anche `Current mapped`, mentre il task letto imposta soltanto `raw` e `mapped`: non interpretare il terzo campo come una misura aggiornata da quel loop.

## 3.5 Scaling, segno e unità

CAN trasporta byte. Un campo può rappresentare un numero fisico con un fattore di scala intero. `MultipliedValue<T, M>` conserva il valore moltiplicato per `M`.

Con `multiplier: 100`, la percentuale 12,34 è codificata come intero 1234. La conversione da valore fisico usa `try_into()` e moltiplica; la conversione inversa verso `f32` divide. Il metodo `get_value()` restituisce invece l’intero memorizzato, **non il valore fisico già diviso**.

```rust
let physical: f32 = 12.34;
let encoded: messages::MultipliedValue<u16, 100> = physical.try_into().unwrap();
// encoded.get_value() è l'intero scalato; qui la conversione float tronca.
let decoded: f32 = encoded.try_into().unwrap();
```

Nell’implementazione float→intero viene usato un cast, senza arrotondamento esplicito. Precisione del floating point e troncamento possono quindi influire sull’ultima cifra. Controlla inoltre overflow, signedness, unità e endianness del campo. Un setter che accetta un valore scalato non elimina automaticamente il rischio di conversione.

Lo schema di Messages usa `big` come endianness predefinita; un campo può specificare esplicitamente `little`. Il catalogo riporta anche questa informazione.

Le label YAML non garantiscono che il produttore passi dati nell’unità giusta. Le definizioni raw APPS, per esempio, riportano `mV` con multiplier 1000; la catena di acquisizione sync deve essere verificata separatamente. Conservare lo stesso tipo di messaggio fra versioni non prova la stessa semantica fisica.

**Fonte:** [MultipliedValue](https://github.com/uniuderacing/messages/blob/56f028257b1cfbb9f44f50d629b039f797d1a110/src/multiplied_value.rs).

## 3.6 Ricezione e callback nel sync

Il thread CAN controlla una volta per iterazione ciascuna delle due code TX, poi tenta una ricezione. Il wrapper converte il messaggio in un frame e usa il driver ESP-IDF.

In ricezione, `Can::receive_unwrapped()` preleva un frame, rilascia il lock del driver e lo passa al dispatcher Tacom. Il rilascio prima del dispatch evita di mantenere quel mutex durante callback che potrebbero usare nuovamente il driver. Il dispatcher può gestire callback applicative e OTA; il wrapper tenta infine la conversione nel tipo richiesto.

La callback inverter aggiorna il corrispondente `SafeTimedData`; quella precharge e quella cutoff fanno lo stesso. La callback della mappa legge il parametro e, con Next, aggiorna il valore al successivo della sequenza. È quindi importante che nessun altro thread mantenga quel mutex indefinitamente.

`send_lossy()` può perdere frame se la coda del driver è piena. L’accodamento interno e la trasmissione sul bus sono passaggi distinti: una `send()` riuscita sul canale del task non è un acknowledgement dell’inverter.

**Fonti:** [task CAN](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/bin/brain_sync/tasks/can.rs), [wrapper](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/utilities/hal/can/wrapper.rs), [I/O e perdite](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/utilities/hal/can/io.rs).

## 3.7 Frame CAN e serializzazione per telemetria

`messages::Frame` contiene ID, fino a 8 byte, DLC e timestamp opzionale. Il timestamp è metadato del wrapper, non un campo aggiunto automaticamente al payload CAN.

`as_can_frame()` costruisce il frame per il driver. `serialize()` crea invece un flusso binario con header, payload, timestamp opzionale a 6 byte e delimitatore `\r`. Il delimitatore viene raddoppiato quando compare nei dati. `deserialize_one()` e `deserialize_many()` ricostruiscono i frame dal flusso.

Il README di Messages menziona postcard/base64, ma l’implementazione di `Frame` letta usa questo formato binario. Per un decoder di telemetria bisogna seguire il codice di serializzazione della revisione usata dal produttore.

**Fonte:** [Frame](https://github.com/uniuderacing/messages/blob/56f028257b1cfbb9f44f50d629b039f797d1a110/src/frame.rs).

## 3.8 Modificare o aggiungere un messaggio

1. Individua la revisione Serena effettivamente usata da tutti i produttori e consumatori coinvolti.
2. Cerca una definizione esistente che copra il dato; evita duplicazioni di ID o significato.
3. Definisci nel file YAML appropriato nome, ID, campi, unità, scaling e rappresentazione; rispetta il limite di 8 byte e le convenzioni standard/extended/raw.
4. Aggiorna produttore e consumatori. La presenza del tipo generato non attiva una callback né un invio periodico.
5. Verifica encoding/decoding con valori noti, segni negativi, estremi e dimensione del payload.
6. Aggiorna consapevolmente la dipendenza e il lockfile del firmware. Allinea anche telemetria e strumenti che decodificano i dati.

Cambiare ordine, dimensione, enum o scaling può cambiare il protocollo sul bus anche lasciando invariato il nome Rust. Nel master Serena 2.0.0 risultano modifiche sostanziali a `inverter.yaml`, `tsac_unit.yaml` e `cooling.yaml`; non va sostituito alla 1.0.0 senza verificare la migrazione.

## 3.9 Le feature delle librerie

`messages` abilita normalmente `server` e `dynamic`: la prima include il supporto per punti Telegraf; la seconda permette accesso dinamico e metadata. `serena-messages` propaga queste feature. Nel firmware entrambe le dipendenze sono dichiarate con `default-features = false`, riducendo le funzioni non necessarie alla centralina.

La crate `messages` è `no_std` con `alloc`; Serena usa `no_std` quando `dynamic` è disabilitata. Questo non rende l’intero firmware `no_std`: l’applicazione usa ESP-IDF e libreria standard Rust.

**Fonti:** [manifest Messages](https://github.com/uniuderacing/messages/blob/56f028257b1cfbb9f44f50d629b039f797d1a110/Cargo.toml), [manifest Serena bloccato](https://github.com/uniuderacing/serena-messages/blob/f7cbf162f1720c0c1dbaccd9f68a19ffbccf36bb/Cargo.toml), [manifest firmware](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/Cargo.toml).
