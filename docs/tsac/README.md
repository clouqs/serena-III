# TSAC — Documentazione MAX1161x

**2 novembre 2026 · Italiano · Libreria 0.1.0 · Commit `ac91bd8ca657ee3962acefc0e5e57291e7d0ba19`**

Documentazione del settore TSAC nella repository Serena III, integrata il **3 novembre 2026** in `docs/tsac/`. Per ora questa cartella copre la libreria ADC MAX1161x; non è una descrizione completa del firmware TSAC. [Torna all'indice della repository](../../README.md).

Apri **[guida-max1161x.html](guida-max1161x.html)** nel browser oppure leggi **[guida-max1161x.md](guida-max1161x.md)**. I due formati contengono lo stesso percorso di studio: scopo, architettura, API, registri, lettura I²C, conversioni, esempi, multiplexer, anomalie, diagnostica e autoverifica.

L'HTML è autonomo e funziona offline. Include ricerca per parole e simboli, filtro per argomento, risultati con estratti ed evidenziazione, navigazione da tastiera, indice delle sottosezioni, tema chiaro/scuro, copia del codice, stampa e laboratori per comporre i registri e seguire la conversione. `Ctrl+K` o `/` apre la ricerca, `Esc` la chiude. `Ctrl+F` cerca nel documento completo.

La guida descrive il codice attuale. Segnala esplicitamente configurazione ignorata dal costruttore, conversione a Vref fissa, multiplexer ancora assente e limiti della diagnostica. La documentazione nell'archivio RAR fornito è stata usata come riferimento editoriale, non come specifica di questa libreria. I sorgenti originali non sono stati modificati.

Per rigenerare e verificare la documentazione, dalla directory `docs/tsac/`:

```powershell
python genera_guida.py
python verifica_documentazione.py
```

Il generatore usa soltanto la libreria standard Python. Senza un checkout della libreria, il verificatore controlla struttura, link, indice di ricerca e JavaScript (con Node.js nel PATH). Per controllare anche simboli pubblici, comportamento Rust e metadati Cargo, passa esplicitamente la directory della repository MAX1161x:

```powershell
python verifica_documentazione.py --source-root "D:/percorso/max1161x"
```

Il percorso deve contenere `Cargo.toml`, `Cargo.lock`, `README.md`, `src/` ed `examples/test.rs`. Per riprodurre l'analisi usa la revisione `ac91bd8ca657ee3962acefc0e5e57291e7d0ba19`. `rustc`, `cargo` e `node` vengono usati quando presenti nel PATH; controlli o sorgenti non disponibili sono indicati come saltati. Il test del driver è isolato e non scarica dipendenze. Gli esiti sono salvati in [verifica-documentazione.json](verifica-documentazione.json). Non viene compilato l'intero package ESP-IDF e non vengono eseguite prove hardware.

I file `stile.css`, `interazioni.js` e `laboratori.html` sono sorgenti dell'interfaccia. Il file HTML finale li incorpora: per consultarlo basta copiare `guida-max1161x.html`. Per conservare anche testo editabile e strumenti di rigenerazione, mantieni l'intera directory.

Le sorgenti della libreria restano nella [repository MAX1161x](https://github.com/uniuderacing/max1161x/tree/ac91bd8ca657ee3962acefc0e5e57291e7d0ba19); questa cartella conserva la documentazione e tutti i file necessari a rigenerarla.
