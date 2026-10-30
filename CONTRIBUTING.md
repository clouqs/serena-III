# Lavorare in due

Lo scopo è mantenere il lavoro leggibile, integrabile e verificabile mentre hardware e firmware evolvono insieme.

## Flusso per ogni modifica

1. Aprire una Issue con problema, comportamento atteso e come si riconosce il completamento.
2. Tenere una modifica focalizzata. Per il codice, lavorare nella repository firmware; per la documentazione e le decisioni condivise, lavorare qui.
3. Aprire una Pull Request descrivendo cosa cambia, quali moduli coinvolge, quali verifiche sono state fatte e cosa resta da verificare su banco o vettura.
4. Fare review in coppia prima del merge. Per logica che può abilitare la trazione, cambiare stato R2D, applicare frenata rigenerativa o azionare uscite di sicurezza, la review dell’altra persona è obbligatoria come pratica del team.
5. Dopo il merge, aggiornare il piano e la documentazione se il comportamento o un’interfaccia sono cambiati.

## Divisione del lavoro

Ci si può alternare tra due filoni:

- **Ingressi e comunicazioni:** sensori, plausibilità, messaggi CAN, timeout e diagnostica.
- **Stati e uscite:** macchina a stati, relè, comandi inverter, dashboard e comportamento degradato.

La divisione aiuta a procedere in parallelo; non crea proprietari esclusivi. Entrambi dovrebbero saper seguire il percorso completo dal sensore al comando e partecipare alle review delle modifiche critiche. Ruotare i filoni a ogni milestone riduce la dipendenza da una sola persona.

## Cosa includere in una Pull Request

- Contesto e obiettivo in poche righe.
- Ingressi, uscite e stati interessati.
- Comportamento in caso di dato assente, scaduto, fuori range o incoerente.
- Verifiche eseguite e risultato; distinguere simulazione, banco e vettura.
- Riferimenti a Issue, schemi elettrici, revisione hardware e decisioni pertinenti.
- Se si aggiorna un protocollo, compatibilità tra firmware e `serena-messages`.

## Regole di collaborazione

- Non programmare la scheda con `cargo run` senza aver controllato target, porta e scheda selezionata: il runner del progetto esegue il flash.
- Non modificare i messaggi CAN o le calibrazioni senza documentare impatto e compatibilità.
- Non descrivere una prova simulata come prova su hardware.
- Se un dettaglio non è ancora confermato, segnalarlo come domanda o ipotesi, non come fatto.

## Modello per una decisione tecnica

Per le decisioni che influenzano architettura, sicurezza o protocollo, creare un file in `docs/brain-new/decisioni/` usando `docs/brain-new/decisioni/TEMPLATE.md`.
