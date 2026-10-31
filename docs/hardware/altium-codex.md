# Altium e Codex

Configurazione preparata il 1 novembre 2026.

Questa guida registra la configurazione locale preparata sul PC di Bulli. Su un altro PC, adattare i percorsi e installare il server MCP prima di usarli. Altium 365 è il workspace cloud; per il collegamento descritto serve Altium Designer installato sul PC.

## Stato

- MCP globale `altium` registrato in `C:\Users\bulli\.codex\config.toml`.
- eda-agent 0.8.1 installato in un ambiente Python dedicato.
- Sorgente: https://github.com/salitronic/eda-agent
- Revisione sorgente: 29d666f1166c2320e17349903c12a7ad1856ebed.
- Handshake MCP e lettura elenco strumenti verificati.
- Script DelphiScript copiati in `C:\Users\bulli\EDA Agent\scripts`.
- Altium Designer non rilevato sul PC durante la configurazione.
- Installazione Designer e prova con sessione reale ancora da completare.

## Completare l'installazione

1. Accedere a https://www.altium.com/products/downloads con l'account che ha la licenza attiva e scaricare Altium Designer.
2. Installare Designer, attivare la licenza e collegare il workspace Altium 365.
3. In Designer: DXP / Preferences > Scripting System > Global Projects > Install from file. Scegliere `C:\Users\bulli\EDA Agent\scripts\Altium_API.PrjScr`.
4. File > Run Script > Altium_API > Dispatcher.pas > StartMCPServer > Run.
5. Riavviare Codex per caricare il nuovo MCP. Aprire una copia della scheda in Designer e chiedere: «Usa l'MCP altium: verifica la connessione e descrivi il progetto aperto senza modificarlo».

Il server espone `tool_catalog` e `tool_invoke`: il primo scopre le funzioni, il secondo le esegue. Questa modalità evita di caricare centinaia di schemi strumenti all'avvio. Il backend è Altium; la dashboard e i controlli aggiornamenti automatici sono disabilitati.

L'integrazione è di terze parti ed è sperimentale. Fare le prime prove su una copia del progetto.

## Verifica locale

In PowerShell:

```powershell
& 'C:\Users\bulli\.codex\integrations\eda-agent-venv\Scripts\python.exe' -m eda_agent health
codex mcp get altium
```

Backup della configurazione precedente: `C:\Users\bulli\.codex\integrations\config.before-altium.toml`.
Per rimuovere solo la registrazione MCP: `codex mcp remove altium`.
