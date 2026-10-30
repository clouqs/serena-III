# Brain New — piano di sviluppo

## Obiettivo

Costruire una versione di Brain più chiara da capire, modificare e verificare, seguendo la crescita della vettura. Il nuovo firmware dovrà coordinare ingressi, comunicazioni, stati e uscite mantenendo un comportamento esplicito in condizioni normali e quando qualcosa non è disponibile.

## Punto di partenza

Nel checkout esaminato il target `brain_new` è presente, ma i suoi file principali sono vuoti. `brain_sync` contiene invece un comportamento esistente da studiare e usare come riferimento, non da copiare alla cieca. La guida in `docs/firmware/02-brain.md` descrive il percorso attuale e segnala i punti che richiedono conferma.

Prima di implementare, registrare i riferimenti reali del veicolo: branch e commit del firmware, versione delle librerie CAN, revisione della scheda Brain, pinout e segnali disponibili. Il repository sorgente rimane quello del team; questo repository raccoglie documentazione, piano e decisioni.

## I tre principi di responsabilità

### 1. Acquisire e validare gli ingressi

Un’area raccoglie sensori, pulsanti, segnali shutdown e messaggi CAN. Per ogni dato conserva valore, validità e freschezza. Controlla range, plausibilità tra sensori ridondanti, errori di lettura e scadenza dei messaggi. Un dato non valido non deve sembrare un dato valido solo perché contiene un numero.

### 2. Decidere lo stato del veicolo

Una macchina a stati esplicita decide se la vettura è in LV, TS, R2D, calibrazione o in uno stato di guasto, e quali condizioni permettono ogni transizione. Le decisioni dovrebbero essere separabili da GPIO, CAN e driver: dato lo stato corrente e un insieme di ingressi validati, devono risultare chiari il prossimo stato e le azioni richieste.

### 3. Produrre gli effetti verso il veicolo

Un’area invia i comandi all’inverter, aziona relè e indicatori e pubblica lo stato. Gli effetti devono essere tracciabili rispetto alle decisioni della macchina a stati. Va definito esplicitamente cosa succede entrando e uscendo da R2D e quando un messaggio, un sensore o un’attività di controllo si interrompe.

```text
sensori / pulsanti / CAN / shutdown
                 │
                 ▼
        acquisizione e validazione
                 │ ingressi validati
                 ▼
          macchina a stati
                 │ stato + azioni
                 ▼
        uscite e messaggi CAN
                 │
        inverter / relè / dashboard
```

## Architettura proposta

- **Un punto di ingresso per gli input:** normalizza i dati e indica se sono validi e aggiornati.
- **Una macchina a stati centrale:** applica transizioni definite e produce azioni, senza comandare direttamente i pin.
- **Un punto di uscita per le azioni critiche:** serializza i comandi verso inverter e relè e può imporre un comportamento sicuro se il controllo non avanza.
- **Interfacce esplicite tra moduli:** eventi e dati con significato definito, invece di accessi condivisi non documentati.
- **Separazione tra logica e hardware:** la logica di transizione deve poter essere esaminata senza avviare ESP32, driver o bus CAN.
- **Diagnostica utile:** loggare cambi stato, motivi di rifiuto transizione, scadenza dati e fault, senza bloccare il percorso di controllo.

È una direzione iniziale, non un vincolo su thread, code o librerie. La scelta di esecuzione va fatta dopo aver misurato i tempi richiesti e verificato le primitive disponibili nell’ESP-IDF/Rust usato dal progetto.

## Tappe

### 0 — Allineare il contesto vettura

- Identificare revisione hardware e pinout Brain.
- Confermare branch e commit attualmente usati e la versione `serena-messages` bloccata.
- Raccogliere diagramma shutdown, architettura CAN e requisiti della competizione corrente.
- Stabilire cosa deve fare Brain e cosa è responsabilità di TSACU, inverter e altra ECU.

**Risultato:** una scheda di contesto con fonti e punti aperti.

### 1 — Descrivere il comportamento attuale

- Disegnare stati, eventi, condizioni e uscite di `brain_sync`.
- Seguire il percorso APPS → controlli → mappa → limiti → comando inverter.
- Descrivere precharge, ingresso e uscita da R2D, calibrazione e shutdown.
- Elencare messaggi CAN con producer, consumer, scadenza e azione se assente.
- Separare comportamento osservato, ipotesi e comportamento da chiarire col team.

**Risultato:** specifica comportamentale leggibile e una lista di discrepanze o domande.

### 2 — Definire interfacce e comportamento sicuro

- Definire tipi per input validato, stato, evento, azione e fault.
- Scrivere la tabella di transizione: stato + evento/condizione → nuovo stato + azioni.
- Definire timeout e comportamento per dati stantii, incoerenti o mancanti.
- Definire l’uscita da R2D, incluso il comando inviato all’inverter e la gestione del relè.
- Concordare con il team la relazione tra freno, regen e freno idraulico prima di implementarla.

**Risultato:** interfacce e tabella approvate da entrambi prima della migrazione hardware.

### 3 — Implementare il nucleo logico

- Implementare transizioni e controlli che non dipendono da driver o pin.
- Trattare stati impossibili e input non validi come esiti espliciti.
- Aggiungere diagnostica con motivi leggibili.

**Risultato:** il comportamento principale è revisionabile senza collegare la scheda.

### 4 — Collegare ingressi e uscite a piccoli passi

- Collegare prima i segnali di stato e gli input non attuanti.
- Integrare i callback e i messaggi CAN con controllo di freschezza e validità.
- Integrare i comandi all’inverter e gli output GPIO dopo aver concordato stati e fallback.
- Evitare modifiche simultanee non necessarie a protocollo, pinout e macchina a stati.

**Risultato:** ogni confine hardware ha un proprietario chiaro, errori espliciti e diagnostica.

### 5 — Verificare e migrare

- Confrontare le decisioni del nuovo nucleo con una serie di scenari descritti, inclusi input guasti.
- Iniziare con build e controlli offline, poi banco con ruote sollevate e supervisione del team.
- Se possibile, raccogliere gli input reali e confrontare i comandi del nuovo sistema senza comandare attuatori.
- Procedere alla prova dinamica solo dopo revisione delle protezioni hardware, del comportamento di arresto e dei criteri di prova.
- Mantenere `brain_sync` selezionabile fino a quando il nuovo comportamento è confrontato e la migrazione è deliberata.

**Risultato:** criteri di passaggio documentati e piano di ritorno alla versione precedente.

### 6 — Aggiungere funzioni veicolo

Solo dopo avere stabilizzato il percorso base, sviluppare una funzione per volta: mappe, gestione regen, telemetria, diagnostica, aggiornamento configurazione o nuove interazioni con altre centraline. Ogni funzione deve avere requisiti, limiti, comportamento in fault e prove proprie.

## Lavorare in due

Una possibile divisione iniziale è:

- **Filone ingressi e comunicazioni:** APPS, freno, pulsanti, CAN, freschezza e plausibilità.
- **Filone stati e uscite:** transizioni, R2D, inverter, relè, dashboard e gestione dei fault.

I filoni permettono di avanzare in parallelo, ma entrambi devono saper spiegare il percorso completo e partecipare alle review. Alternare i filoni tra le tappe; per le modifiche che possono abilitare la trazione o cambiare frenata e shutdown, fare sempre una review incrociata e concordare il comportamento prima del codice.

Per ogni tappa, scegliere insieme un risultato piccolo e verificabile. Prima di iniziare, concordare interfacce e dati che i due filoni si scambiano; integrare spesso per individuare presto i disallineamenti.

## Prima settimana di lavoro proposta

1. Verificare che la revisione del codice analizzata nella guida corrisponda a quella usata dal team.
2. Leggere insieme i capitoli Brain e messaggi CAN.
3. Disegnare su una pagina gli stati attuali e il percorso dal pedale al comando inverter.
4. Segnare le domande hardware/software, assegnando a ogni domanda una persona che raccolga la risposta e una fonte.
5. Scrivere la tabella di transizione desiderata per il primo rilascio di `brain_new`.
6. Solo allora aprire la prima Issue di implementazione.

## Definition of done per una funzione

- Requisito e comportamento atteso sono scritti.
- Input, output, timeout e casi di errore sono esplicitati.
- La modifica è stata revisionata da entrambi quando tocca una funzione critica.
- Sono registrate le verifiche eseguite e il loro livello: analisi, build, simulazione, banco o vettura.
- Documentazione e versioni dei messaggi sono aggiornate se necessario.
- È chiaro come disattivare la funzione o tornare alla revisione nota.

## Domande aperte da risolvere col team

- Quale revisione di firmware è installata sulla vettura attuale?
- Quale mappa e quale comportamento R2D sono richiesti per la prossima stagione?
- Quali segnali freno sono disponibili a Brain e quale sensore viene considerato affidabile?
- Chi possiede il comando finale dei relè e quali protezioni sono hardware indipendenti?
- Quali limiti di corrente, tensione, temperatura e velocità comunica l’inverter/TSACU per la regen?
- Quale strategia di thread, priorità e watchdog è supportata e già validata sulla scheda?
- Quali regole Formula Student e chiarimenti locali si applicano alla vettura e alla competizione scelta?

## Riferimenti

- [Guida firmware](../firmware/README.md)
- [Capitolo Brain](../firmware/02-brain.md)
- [Capitolo sviluppo](../firmware/04-sviluppo.md)
- [Punti da verificare](../firmware/05-verifiche.md)
- [Flusso di collaborazione](../../CONTRIBUTING.md)
