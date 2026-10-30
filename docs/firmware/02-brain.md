# 2. Brain: dall’accensione al comando motore

In questo capitolo il comportamento descritto è quello di **`brain_sync`**, salvo i paragrafi esplicitamente dedicati a `brain_old`. I tempi sono intervalli nominali del codice: conversioni ADC, scheduling, code e operazioni bloccanti possono aumentarli.

## 2.1 Che cosa deve coordinare

Brain tiene insieme quattro percorsi: richieste del pilota, stato del circuito di shutdown, stato dell’accumulatore e controllo dell’inverter. Il pedale non viene trasmesso direttamente come “coppia”: prima viene acquisito, normalizzato e verificato; poi una mappa lo converte in una richiesta di corrente o velocità, e ulteriori limiti modificano il comando.

```text
APPS1 / APPS2 → ADC → filtri → percentuali calibrate → plausibilità
                                                         │
                                                    last_apps
                                                         │
                    stato R2D → mappa → limiti → messaggio inverter

Pulsanti + freno → dashboard → eventi → macchina a stati
Shutdown GPIO → task shutdown → stato condiviso ────────────┘
CAN precharge / inverter / TSAC → callback → dati con scadenza
```

## 2.2 L’avvio, nell’ordine del main

1. `init::<BRAIN>()` applica le patch ESP-IDF, inizializza il logger, richiede la riconfigurazione del watchdog a 10 secondi senza panic e costruisce i messaggi di reset reason. Il main conserva il risultato in `_reset_reasons`, senza inviarlo esplicitamente.
2. Acquisisce le periferiche e apre la NVS nel namespace `TacomParams`.
3. Crea parametri di calibrazione, mappa, limiti e stato periodico; costruisce `SharedResources`.
4. Inizializza I²C, ADS1115, GPIO, strip LED e audio I²S. Il relè activation logic viene impostato LOW all’avvio per aprire lo shutdown dal proprio punto di controllo.
5. Avvia CAN a **500 kbit/s**, con filtro `Boards::Generic` e code driver RX/TX da 4096 elementi.
6. Crea cinque canali sincroni, ciascuno di capacità 50: due code verso CAN, eventi dashboard, stati verso dashboard, richieste audio.
7. Registra callback per messaggi di mappa, inverter, precharge, cutoff TSAC e stato LV.
8. Avvia i sei thread permanenti. Il main ne controlla la terminazione ogni 100 ms e genera un panic se uno termina.

Il controllo `is_finished()` individua thread terminati, **non thread bloccati**. Non dimostra da solo una supervisione temporale completa dei task.

**Fonti:** [main](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/bin/brain_sync/main.rs), [init](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/utilities/ecu/init.rs).

## 2.3 Chi esegue che cosa

| Thread | Ingressi | Uscite e responsabilità |
| --- | --- | --- |
| Dashboard | Pulsanti TS, R2D, calibrazione; stato freno; canale degli stati | Eventi alla state machine, LED pulsanti e strip |
| Apps | ADS1115, range di calibrazione, corrente inverter | `last_apps`, stato freno, luce stop, messaggi raw e fault |
| Can | Due code di messaggi interni e bus | Invio sul bus; ricezione e dispatch delle callback |
| Shutdown | GPIO8 con debounce | Stato shutdown condiviso e messaggio `ShutdownSensing` |
| Speaker | Canale richieste audio | Riproduzione R2D e allarme sottotensione LV |
| StateMachine | Eventi dashboard, dati precharge e shutdown | Transizioni, relè activation logic, stati dashboard e thread dello stato corrente |

La state machine mantiene inoltre **un thread figlio per lo stato attivo**: LV, TS, R2D o calibrazione. Quando cambia stato, imposta un segnale di stop, attende il `join()` del figlio e crea quello nuovo.

`Arc` permette a più thread di possedere riferimenti allo stesso oggetto. `Mutex` impedisce accessi simultanei incompatibili. Le variabili atomiche sono usate per flag semplici. I canali trasportano eventi o messaggi e hanno capacità finita: una `send()` può attendere se la coda è piena.

**Fonti:** [task](https://github.com/uniuderacing/firmware/tree/8da023f3056b65683d110e69112bec1dfb4446ae/src/bin/brain_sync/tasks), [risorse condivise](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/bin/brain_sync/shared_resources.rs).

## 2.4 La macchina a stati effettiva

| Stato | Significato operativo | Strip dashboard |
| --- | --- | --- |
| LV | Attesa; il coordinatore mantiene LOW l’activation relay | Verde |
| Precharge | Indicazione inviata alla dashboard durante il tentativo di attivazione | Bianco |
| TS | Trazione attivata secondo le condizioni di ingresso; nessun loop di comando R2D | Rosso |
| R2D | Loop di comando inverter attivo | Blu |
| Cal | Raccolta degli estremi dei due sensori acceleratore | Giallo |

**Precharge è un caso particolare:** esiste nell’enum, ma il flusso corrente lo usa come stato visualizzato dalla dashboard. Il coordinatore resta nel ramo LV mentre attende le condizioni. I rami che eseguirebbero davvero `State::Precharge` contengono `todo!()`.

| Da | Evento / condizione | A | Effetto principale |
| --- | --- | --- | --- |
| Boot | Avvio | LV | Relè inizializzato LOW |
| LV | Evento TS | TS oppure LV | Mostra precharge, attiva relè, attende 400 ms, controlla shutdown e poi AIR per un massimo nominale di 3 s |
| LV | Evento Cal | Cal | Avvia raccolta estremi |
| Cal | Evento Cal | LV | Ferma raccolta e aggiorna parametri |
| TS | Evento TS | LV | Il ramo LV riporta il relè LOW |
| TS | Evento R2D | R2D | Richiede suono e avvia il loop inverter |
| TS | Nessun evento e shutdown aperto | LV | Apre relè |
| R2D | Evento TS | TS | Ferma il loop R2D; non apre esplicitamente il relè in questo ramo |
| R2D | Altro evento ricevuto | LV | Comportamento del ramo `_` corrente |
| R2D | Nessun evento e shutdown aperto | LV | Apre relè |

La condizione di ingresso TS richiede un `PrechargeStatus` ancora valido, shutdown chiuso, AIR− chiuso e AIR+ chiuso. Non confronta direttamente `V_bus` e `V_bat`: usa i bit riportati dalla TSACU. L’assenza/scadenza del messaggio viene però gestita con `unwrap()` e può generare panic, anziché un semplice esito negativo.

Gli eventi dashboard arrivano dopo una pressione di **3 secondi**. Per generare R2D il codice richiede contemporaneamente il flag di freno premuto. La state machine si fida dell’evento e non ricontrolla lì la freschezza del freno. In TS e R2D il ramo shutdown viene valutato con `else if`, dopo il tentativo di ricevere un evento: se arriva un evento, il controllo shutdown di quell’iterazione viene saltato.

Non è presente in questi rami un invio esplicito di `DriveEnable(false)` o di comando zero quando si esce da R2D. Il comportamento risultante dell’inverter richiede la conoscenza della sua configurazione e dei timeout; non si può dedurre dal solo arresto del thread.

**Fonti:** [coordinatore e check TS](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/bin/brain_sync/tasks/state_machine/mod.rs), [dashboard](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/bin/brain_sync/tasks/dashboard.rs).

## 2.5 Pedale acceleratore: tutti i passaggi

Il task Apps prova a leggere APPS1 e APPS2 circa ogni **20 ms**, sullo stesso ADS1115. Procede solo se entrambe le letture sono riuscite.

1. Applica a ciascun sensore il filtro IIR `y = y + 0,9 × (x − y)`. Il nuovo campione pesa quindi 0,9. Il filtro parte da zero.
2. Legge gli estremi di calibrazione e calcola `p = 100 × (x − min) / (max − min)`.
3. Accetta la percentuale entro una tolleranza di 10 punti oltre gli estremi, poi la limita a 0–100. Se è fuori range, invia un warning e sostituisce la percentuale di quel sensore con 0.
4. Applica una deadzone di 2,5%: `p_eff = clamp(100 × (p − 2,5) / 97,5, 0, 100)`.
5. Accetta le due percentuali se la differenza assoluta è **strettamente inferiore a 15 punti**. In caso positivo usa la media; in caso contrario invia `AppsPlausibility` e usa 0%.
6. Aggiorna `last_apps`, valido per **100 ms**. Le letture raw vengono pubblicate nominalmente ogni 200 ms quando le acquisizioni riescono.

Esempio solo matematico: dopo calibrazione due letture danno 40% e 42%. Dopo la deadzone diventano circa 38,46% e 40,51%; la media è circa 39,49%. Questo è l’ingresso della mappa, non la richiesta finale di corrente.

APPS2 ha andamento invertito: il suo estremo corrispondente a pedale rilasciato può essere numericamente maggiore dell’estremo a pedale premuto. La formula accetta un denominatore negativo. Il caso `min == max` non viene invece rifiutato esplicitamente dalla funzione di conversione.

**Unità da verificare:** in `brain_sync`, `adc.read()` viene convertito direttamente in `f32`; non si vede la chiamata alla funzione condivisa di conversione in millivolt. Nomi come `apps_1_millis` e label `mV` non provano quindi l’unità reale della misura. Il confronto con la calibrazione può restare coerente se entrambi usano conteggi ADC, ma la telemetria etichettata come tensione può risultare errata.

Se l’ADC smette di fornire letture, `last_apps` non viene aggiornato. Il loop R2D, dopo 100 ms, usa 0% e genera `SensorsTimeout`. Nelle mappe con rigenerazione, 0% può richiedere frenata rigenerativa: **non equivale sempre a comando inverter nullo**.

La soglia di 15 punti è quella del codice. Il README storico cita 10%; questo documento non risolve la discordanza come conformità regolamentare.

**Fonti:** [Apps](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/bin/brain_sync/tasks/apps.rs), [conversioni](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/utilities/ops/convert.rs), [filtro](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/utilities/ops/filter.rs), [costanti Brain](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/constants/brain.rs).

## 2.6 Freno e luce stop

Il task legge il sensore anteriore nominalmente ogni **50 ms**. Sottrae l’offset sperimentale `2520` alla lettura, applica l’IIR e chiama `into_pressure()`, che calcola `max(0, value / 1,8 × 160)`. La compatibilità fra unità ADC e formula di pressione va verificata sul sensore e sul driver; non basta chiamare il valore “bar”.

Il freno risulta premuto sopra la soglia numerica `30`, etichettata come bar nelle costanti. A ogni lettura riuscita viene aggiornato il timestamp del freno, anche se il suo stato non cambia. Se la lettura fallisce, flag e timestamp restano quelli precedenti.

La luce stop viene accesa quando il freno risulta premuto **oppure** la corrente DC dell’inverter è negativa. Il codice usa `dc_current().get_value()`, cioè il valore scalato; per verificare soltanto il segno la scala positiva non cambia il risultato. Se il messaggio inverter è scaduto, usa corrente zero. La luce viene aggiornata nel ramo di lettura freno riuscita: un errore ADC può lasciarne invariato lo stato.

Il messaggio raw del freno anteriore viene inviato nominalmente ogni 200 ms. `brain_sync` non ha il listener di pressione freno posteriore presente in `brain_old`.

## 2.7 Il loop R2D e le mappe

Entrando in R2D, il thread carica la mappa e invia quattro messaggi di limite: corrente AC in accelerazione e frenata, corrente DC in accelerazione e frenata. Il comando viene ricalcolato circa ogni **20 ms**; `DriveEnable(true)` viene inviato circa ogni **250 ms**. Nel sync il primo enable non viene inviato immediatamente all’ingresso, ma dopo il primo intervallo.

| Mappa | Tipo di controllo | AC acc / freno | DC acc / freno |
| --- | --- | --- | --- |
| Acceleration | Corrente, curva iniziale progressiva; niente regen | 360 / 0 | 140 / 0 |
| Skidpad | Corrente, andamento accelerazione lineare; niente regen | 200 / 0 | 60 / 0 |
| Autocross | Corrente, coasting e regen dipendente dalla velocità | 300 / −60 | 120 / −30 |
| Endurance | Stessa struttura di curva di Autocross, limiti diversi | 300 / −70 | 120 / −35 |
| TorqueTest | Corrente, curva di prova con regen | 300 / −40 | 120 / −20 |
| VelocityTest | Setpoint ERPM quadratico | 250 / −60 | 80 / −30 |

I valori sono quelli nominali in A del codice, non raccomandazioni di taratura. Le definizioni inverter distinguono anche `A_pk` e corrente DC; il coefficiente motore è commentato in `Nm/A_RMS`. La coerenza fra queste convenzioni deve essere verificata prima di interpretare il limite di potenza fisicamente.

La mappa di corrente separa accelerazione, coasting e frenata rigenerativa. Una lookup table e gli esponenti delle curve determinano l’intensità in funzione di posizione e velocità. La richiesta relativa viene poi trasformata in corrente assoluta usando il limite AC della mappa. Il ramo VelocityTest usa invece `60000 × (pedale / 100)²` come ERPM di riferimento.

Il percorso di limitazione in R2D è:

1. APPS → posizione della mappa; se il dato è scaduto, posizione 0%.
2. `InverterGeneralData1` → velocità del veicolo. In assenza di dato valido, per la mappa usa 0 km/h.
3. La mappa genera un comando assoluto di corrente o un comando di velocità.
4. Se disponibile, il cutoff TSAC limita la corrente di accelerazione; se scade, questo limite aggiuntivo viene omesso.
5. Un secondo limite usa `P = min(93000 W, limite_DC × V_bus)` e `I_lim = P / (0,62 × 0,95 × max(ω, 0,1))`.
6. Converte il comando nel messaggio inverter appropriato e lo accoda al thread CAN.

Per il limite di potenza, `V_bus` assente viene sostituito con 400 V; ERPM assente con 630. La velocità angolare deriva da `(ERPM / 10) × 0,10471976`. Questi fallback sono diversi dal fallback di velocità della mappa.

**Le due limitazioni usano `map_abs_acc()`: agiscono soltanto sul comando assoluto di accelerazione.** Non applicano quella stessa formula ai comandi di frenata o al ramo velocità. La presenza della costante `CURRENT_LIMIT = 150` non significa che venga applicata qui: il loop letto non la usa in questa formula.

Il flag di plausibilità acceleratore/freno viene calcolato con soglie 25% e 5%, ma in `brain_sync` non modifica il comando. In `brain_old` è applicato solo compilando con la feature `plausibility_italy`.

**Fonti:** [R2D](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/bin/brain_sync/tasks/state_machine/r2d.rs), [mappe e conversione comandi](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/utilities/ecu/map.rs), [curve one-pedal](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/utilities/ecu/one_pedal.rs).

## 2.8 Scadenza dei dati

`SafeTimedData<T, MS>` contiene un valore opzionale e il momento dell’ultimo aggiornamento. `get()` restituisce il valore solo se esiste ed è più recente di `MS`; altrimenti restituisce `None`. Con `MS = 0` non scade. È il chiamante a decidere cosa fare quando il dato manca.

| Dato in brain_sync | Scadenza | Reazione rilevante |
| --- | --- | --- |
| Ultima lettura APPS | 100 ms | R2D usa 0% e warning |
| Inverter general data 1 | 200 ms | Velocità mappa 0; fallback ERPM separato per limite di potenza |
| Inverter general data 2 | 200 ms | Per luce stop, corrente sostitutiva zero |
| Precharge status | 200 ms | Check ingresso TS può fare panic; limite potenza usa fallback V_bus |
| TSAC cutoff current | 10000 ms | Il limite cutoff aggiuntivo non viene applicato |
| Freno | Timestamp separato | Dashboard sync legge il flag senza verificarne l’età |
| Shutdown | Flag atomico | Aggiornato dal task GPIO; inizialmente vale true nelle risorse |

La presenza di un contenitore temporizzato non garantisce che tutti i dati scaduti portino a disabilitazione: le reazioni sono diverse e vanno lette singolarmente.

**Fonti:** [SafeTimedData](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/utilities/sync/safe_timed_data.rs), [SharedResources](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/bin/brain_sync/shared_resources.rs).

## 2.9 Calibrazione e parametri

In LV, l’evento Cal avvia la raccolta. Il thread di calibrazione legge `last_apps` ogni 10 ms nominali, ma il task produttore acquisisce circa ogni 20 ms. Aggiorna minimo e massimo di APPS1; per APPS2 usa gli estremi invertiti. Alla successiva richiesta Cal torna in LV e aggiorna i quattro parametri.

Non legge direttamente l’ADC e non salva continuamente gli estremi durante la raccolta. Se entra senza una lettura valida, inizializza gli estremi con zero: questo può inquinare il risultato. Non si vede una validazione finale dell’ampiezza minima del range.

| ID parametro | Nome | Default nel costruttore sync |
| --- | --- | --- |
| 0 | Periodic status | true |
| 1 | APPS1 min | 0 |
| 2 | APPS1 max | 1000 |
| 3 | APPS2 min | 1000 |
| 4 | APPS2 max | 0 |
| 5 | Motor map | TorqueTest, default di `OnePedalMap` |
| 6 | Max AC current | 250 A |
| 7 | Max DC current | 100 A |
| 8 | Max AC brake current | −40 A |
| 9 | Max DC brake current | −30 A |

Sono costruiti con storage non volatile. I default del costruttore possono essere sostituiti dai dati memorizzati e dai limiti della mappa: non coincidono necessariamente con i valori operativi.

Nel `brain_sync/main.rs` non sono visibili chiamate `attach_parameter()` al wrapper CAN. Quindi la creazione di un parametro non basta a dimostrarne l’esposizione via Tacom. Anche `_periodic_status` non governa i timer dei loop sync. `brain_old`, invece, registra esplicitamente i parametri con `.with_parameter(...)` e usa il parametro di stato periodico.

La callback `MotorMapMessage::Next` cicla tra le sei mappe. Nel sync il thread R2D mantiene il mutex di `motor_map` acquisito durante l’intero loop: una callback che cerca lo stesso mutex può bloccare il thread CAN. Questa interazione è approfondita nel capitolo verifiche.

**L’enum del parametro e l’enum del messaggio hanno ordini diversi:** nel parametro `OnePedalMap`, 2 significa Endurance e 3 Autocross; nel campo di `MotorMapMessage`, 2 significa Autocross e 3 Endurance. Acceleration=0, Skidpad=1, TorqueTest=4 e VelocityTest=5 coincidono. Usa le conversioni per nome previste dal codice: non trasferire direttamente il discriminante numerico da un enum all’altro.

**Fonti:** [calibrazione](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/bin/brain_sync/tasks/state_machine/calibration.rs), [parametri](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/bin/brain_sync/parameters.rs), [main e callback](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/bin/brain_sync/main.rs).

## 2.10 Hardware visibile nel main sync

| Segnale | Connessione configurata |
| --- | --- |
| CAN TX / RX | GPIO14 / GPIO13 |
| I²C SDA / SCL | GPIO17 / GPIO16, 100 kHz |
| ADS1115 | Indirizzo GND, fondo scala ±4,096 V |
| Pressione freno / eFuse / APPS1 / APPS2 | ADS A0 / A1 / A2 / A3; eFuse non usata qui dal task Apps |
| Activation logic relay | GPIO3, LOW all’avvio |
| Sensing shutdown | GPIO8 |
| Pulsanti TS / R2D / Cal | GPIO47 / GPIO35 / GPIO48, attivi LOW |
| LED pulsanti TS / R2D / Cal | GPIO41 / GPIO40 / GPIO39, attivi HIGH |
| Strip dashboard | GPIO42, 7 LED |
| Luce stop | GPIO18 |
| LED generici | GPIO4 / GPIO5 |
| Audio I²S BCLK / data / MCLK / LRCLK | GPIO10 / GPIO12 / GPIO9 / GPIO11 |

L’audio è mono, 44100 Hz e 16 bit. La riproduzione viene troncata a 2500 ms dalla costante RTD. Sotto la soglia numerica LV `11000`, la callback richiede un allarme audio; non deduplicando l’evento può richiederlo ripetutamente. La tabella è la configurazione software di questa versione, da confrontare con la revisione hardware della scheda.

## 2.11 Tempi da tenere a portata di mano

| Operazione sync | Intervallo nominale |
| --- | --- |
| Letture APPS | >20 ms |
| Lettura freno | >50 ms |
| Invio raw APPS / freno | >200 ms |
| Comando inverter in R2D | >20 ms |
| Drive enable in R2D | >250 ms |
| Throttle percentage | ≥50 ms |
| Stato Brain in LV | >400 ms |
| Stato Brain in TS / R2D / Cal | >300 ms |
| Shutdown polling e invio | Sleep 100 ms più elaborazione |
| Dashboard polling | Sleep 10 ms più elaborazione |
| Controllo thread nel main | Sleep 100 ms |
| Debounce configurato | 30 ms |

Le costanti locali dei task sync prevalgono sui valori simili in `constants/brain.rs`. Per esempio lì compare un periodo APPS di 10 ms, ma il task sync usa il proprio 20 ms.

## 2.12 Che cosa cambia in brain_old

| Aspetto | brain_old | brain_sync |
| --- | --- | --- |
| Esecuzione | Task asincroni registrati in `vcu-rt` | Thread espliciti e un thread per lo stato attivo |
| CAN | Runtime, filtro `Boards::Brain` | Wrapper locale, filtro `Boards::Generic` che accetta tutto |
| Parametri | Registrati nel builder VCU | Costruiti, ma non registrati nel dispatcher nel main letto |
| Shutdown | Task su eventi GPIO e latch nel monitor | Polling; relè gestito dal coordinatore |
| Ingresso TS | Reazione alle notifiche precharge | Attesa sincrona nel ramo evento TS |
| Uscita R2D da pulsanti | R2D → TS; TS → LV aprendo relè | TS → TS; altri eventi → LV |
| APPS / raw | Timer condivisi 10 ms / 50 ms | Costanti locali 20 ms / 200 ms |
| Drive enable iniziale | Inviato all’ingresso R2D | Dopo il primo intervallo di 250 ms |
| Pressione posteriore | Listener presente | Risorsa/listener non attivi |
| Acceleratore + freno | Azzeramento sotto feature `plausibility_italy` | Flag calcolato ma non applicato |

Per studiare `brain_old`, parti da `main.rs`, poi `tasks/state_machine/mod.rs` e `task.rs`, quindi `lv.rs`, `ts.rs`, `r2d.rs`. Le implementazioni usano `futures::select!` per reagire a timer, eventi dashboard e notifiche. Le transizioni sono espresse attraverso tipi di stato e conversioni. Il README sotto `brain_old` descrive questa architettura, non il threading del sync.

**Fonti:** [Brain old](https://github.com/uniuderacing/firmware/tree/8da023f3056b65683d110e69112bec1dfb4446ae/src/bin/brain_old), [R2D old](https://github.com/uniuderacing/firmware/blob/8da023f3056b65683d110e69112bec1dfb4446ae/src/bin/brain_old/tasks/state_machine/r2d.rs).
