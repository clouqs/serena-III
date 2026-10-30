# 5. Punti da verificare prima di assumere il comportamento

Le osservazioni seguenti derivano da lettura statica. Separano il fatto visibile nel codice dalla conseguenza che richiede una prova. Non sono state applicate correzioni al firmware durante questo lavoro.

## 5.1 Blocchi e transizioni in brain_sync

### Lock della mappa mantenuto durante R2D

**Osservato:** `r2d_loop()` acquisisce `sr.motor_map.lock()` prima del ciclo e mantiene il guard fino all’uscita dalla funzione. La callback `MotorMapMessage` tenta di acquisire lo stesso mutex, anche prima di verificare se il messaggio sia Next.

**Conseguenza dedotta:** ricevendo quel messaggio durante R2D, il thread CAN può restare in attesa del mutex. La trasmissione e le altre callback passano dallo stesso thread e possono fermarsi. Se le code bounded si riempiono, anche il thread R2D può bloccarsi in una `send()`, mantenendo il lock. Il `join()` usato nella transizione può allora non terminare. Il main rileva la terminazione dei thread, non questa attesa.

**Da verificare:** restringere il lock alle letture/aggiornamenti del parametro e provare la ricezione della mappa durante R2D con carico sulle code. La verifica dovrebbe misurare avanzamento del thread CAN e tempi d’uscita dallo stato.

**Fonti:** [R2D](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/bin/brain_sync/tasks/state_machine/r2d.rs), [callback](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/bin/brain_sync/main.rs).

### Precharge assente o scaduta

**Osservato:** `check_ts_conditions()` chiama `get().map(...).unwrap()`. Il dato scade dopo 200 ms ed è inizialmente vuoto. Il ciclo nominalmente attende fino a 3 secondi senza uno sleep interno.

**Conseguenza dedotta:** senza un messaggio valido può verificarsi un panic; il timeout di tre secondi non garantisce un ritorno pulito in LV. Il coordinatore resta inoltre occupato nel controllo, senza processare altri eventi dashboard in quel periodo.

**Da verificare:** casi “nessun messaggio”, “messaggio arrivato una volta e poi perso”, “AIR parzialmente chiusi” e “shutdown aperto durante l’attesa”.

**Fonte:** [state machine](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/bin/brain_sync/tasks/state_machine/mod.rs).

### Uscita da R2D e stato fisico inverter

**Osservato:** l’uscita ferma il thread; non si vede in quel percorso un messaggio esplicito di zero corrente o drive disable. L’evento TS da R2D porta a TS; questo differisce dall’old, dove il pulsante TS apre il relè e porta a LV. Anche il controllo shutdown sync è subordinato al ramo senza eventi.

**Da verificare:** aspettative del pilota sui pulsanti, timeout e configurazione dell’inverter, comando finale effettivo sul bus e tempo di apertura del relè. Non assumere che la sola assenza dei messaggi produca una specifica azione senza conoscere l’inverter.

### Priorità e code

**Osservato:** il thread shutdown invia su una coda condivisa e può bloccare se piena. Gli invii al driver sono lossy; i `try_send()` degli stati ignorano il caso Full. Il task shutdown sync legge ogni circa 100 ms, mentre l’old usa eventi GPIO.

**Da verificare:** che l’osservazione dello shutdown e la gestione del relè restino tempestive sotto congestione CAN, callback lente e code sature. Questi tempi non si ricavano dai soli `sleep(1 ms)` dei loop.

## 5.2 Misure e logiche del pedale

| Osservazione verificata nel codice | Perché conta | Verifica concreta |
| --- | --- | --- |
| La soglia di delta APPS è 15, il README storico cita 10% | Documento e implementazione descrivono criteri diversi | Confermare il requisito adottato dal team e testare la soglia esatta, incluso delta = 15 |
| `plausibility_err` viene calcolato nel sync ma non applicato | Il nome del flag non prova che il comando sia ridotto | Caso freno attivo e pedale >25%, poi rilascio sotto 5% |
| L’errore di un singolo APPS fuori range viene sostituito con 0 prima della media | Con l’altro sensore sotto soglia delta, può restare una percentuale media non nulla | Un sensore fuori range e l’altro a una percentuale bassa |
| `min == max` non è rifiutato esplicitamente | Può produrre valori non finiti nella normalizzazione | Calibrazione assente/degenerata e controllo `is_finite()` |
| Letture ADC sync non convertite esplicitamente in mV | Label e dati numerici possono essere disallineati | Tensione nota applicata, confronto conteggi ADC/mV/valore CAN |
| Formula freno e offset 2520 senza catena di unità esplicita | Il flag freno può dipendere da una scala errata | Pressioni note e misura indipendente della tensione |
| Flag freno conservato se le letture falliscono | Dashboard non ne controlla la freschezza | Arrestare acquisizione freno prima di chiedere R2D |
| Calibrazione parte da zero se `last_apps` non è valido | Estremi salvati possono includere un valore mai misurato | Ingresso Cal a freddo e con ADC assente |
| APPS scaduto → posizione 0%, che può significare regen | L’effetto non è necessariamente corrente nulla | Timeout in ciascuna delle sei mappe |

**Fonti:** [Apps sync](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/bin/brain_sync/tasks/apps.rs), [conversione](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/utilities/ops/convert.rs), [calibrazione](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/bin/brain_sync/tasks/state_machine/calibration.rs).

## 5.3 Configurazione e documentazione

| Punto | Evidenza | Implicazione |
| --- | --- | --- |
| Nuovo Brain incompleto | `brain_new/main.rs` e task principali vuoti | Non assumere che la build di tutti i binari riesca |
| Nome storico del binario | Workflow Compile copia `release/brain`, metadata elenca le tre varianti | Comandi e packaging storico vanno riallineati |
| Workspace README | Cita vcu-rt come membro locale; manifest lo usa da Git | Seguire manifest/lockfile per dipendenze reali |
| Serena differente | Lockfile 1.0.0 contro master 2.0.0 | Allineare protocollo e consumatori prima di aggiornare |
| Parametri sync | Nessun `attach_parameter()` nel main | Confermare esposizione remota; non basta la NVS |
| Stato periodico sync | Campo `_periodic_status`, timer locali dei loop | Cambiare parametro non dimostra cambio del periodo |
| Filtro Brain | Commenti e maschera non perfettamente coerenti | Usare bitmask effettiva per analizzare una ricezione |
| Allarme LV | Callback richiede audio a ogni messaggio sotto soglia | Provare frequenza e sovrapposizione delle riproduzioni |

**Fonti:** [workflow Compile](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/.github/workflows/compile.yml), [lockfile](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/Cargo.lock), [main sync](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/bin/brain_sync/main.rs), [SharedResources](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/bin/brain_sync/shared_resources.rs).

## 5.4 Cosa è stato controllato per questa documentazione

- Scaricati i branch predefiniti delle tre repository richieste e registrati i commit.
- Letti manifest, lockfile, configurazioni e sorgenti dei percorsi Brain old/sync/new.
- Esaminati i chiamanti di vcu-rt; i suoi dettagli interni non sono stati oggetto di audit.
- Letta anche la revisione Serena 1.0.0 bloccata dal firmware, confrontandola con il master 2.0.0.
- Verificati i nomi dei target con `cargo +stable metadata --no-deps`.
- Generato il catalogo dalle definizioni YAML della revisione bloccata, con ID, campi e dimensioni.
- Controllati collegamenti locali della documentazione, struttura HTML e coerenza dei riferimenti a file GitHub tramite le copie locali.

Non sono stati eseguiti build embedded complete, test elettrici, misure di latenza, simulazioni dell’inverter, flash o prove sul veicolo. Non è stato verificato l’esito di specifiche esecuzioni CI né quale versione sia installata in macchina.

## 5.5 Informazioni che completerebbero la guida

La guida può essere aggiornata con il branch/commit usato sul veicolo, la revisione della scheda Brain, la versione e configurazione dell’inverter e il contenuto accessibile delle pagine GitBook. Queste informazioni permetterebbero di trasformare i percorsi alternativi descritti in una procedura operativa precisa per la vettura del team.
