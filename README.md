# Serena III — Firmware

Documentazione e piano di sviluppo del firmware della vettura Serena III. Il repository è il punto di partenza condiviso per le persone che si occupano di firmware: spiega il sistema attuale, raccoglie le decisioni e rende visibili i prossimi passi.

> **Stato:** documentazione iniziale. La guida descrive una revisione precisa del codice; prima di usare i dettagli come specifica del veicolo, confrontarla con il branch e il commit effettivamente in uso.

## Da dove iniziare

1. Apri la [guida completa in HTML](docs/firmware/guida-firmware.html), oppure leggi i capitoli Markdown in `docs/firmware/`.
2. Per capire Brain, parti da [Brain: avvio, task, stati e controllo motore](docs/firmware/02-brain.md).
3. Per il nuovo Brain, leggi il [piano di sviluppo](docs/brain-new/PIANO.md). Nel checkout analizzato, i file di `brain_new` sono ancora vuoti; `brain_sync` è il riferimento di comportamento esistente.
4. Per contribuire in due, usa il [flusso di lavoro](CONTRIBUTING.md) e registra le decisioni in `docs/brain-new/decisioni/`.
5. Per lavorare sulle schede con Codex, consulta la [guida Altium e MCP](docs/hardware/altium-codex.md).
6. Per il settore TSAC, parti dalla [documentazione MAX1161x](docs/tsac/README.md): guida HTML con ricerca, testo Markdown ed esempi della libreria ADC.

## Struttura

- `docs/firmware/` — guida del firmware, Brain, messaggi CAN, sviluppo e punti da verificare.
- `docs/brain-new/` — architettura proposta, tappe di sviluppo e decisioni progettuali.
- `docs/hardware/` — configurazione degli strumenti per le schede elettroniche.
- `docs/tsac/` — documentazione del settore TSAC; per ora include la libreria MAX1161x, con guida, esempi e strumenti di verifica.

## Codice sorgente

Il firmware e le librerie dei messaggi restano nelle repository del team:

- [Firmware UNIUD E-Racing](https://github.com/uniuderacing/firmware)
- [Messages](https://github.com/uniuderacing/messages)
- [Serena messages](https://github.com/uniuderacing/serena-messages)
- [MAX1161x](https://github.com/uniuderacing/max1161x)

Questa repository documenta e pianifica il lavoro; non sostituisce quelle repository.

## Lingua

La documentazione iniziale è in italiano. Nomi di tipi, moduli e segnali restano nella forma usata dal codice.
