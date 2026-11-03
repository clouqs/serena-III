"""Genera l'HTML autonomo dalla guida Markdown, senza dipendenze esterne."""
from __future__ import annotations

import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import unicodedata

ROOT = Path(__file__).resolve().parent
CHAPTERS = [
    ('00-come-usare-questa-guida', 'Introduzione', 'studio'),
    ('01-scopo', 'Scopo', 'studio'),
    ('02-architettura', 'Architettura', 'api'),
    ('03-setup', 'Setup', 'config'),
    ('04-configuration', 'Configuration', 'config'),
    ('05-driver', 'Driver e API', 'api'),
    ('06-conversioni', 'Conversioni', 'studio'),
    ('07-esempi', 'Esempi pratici', 'api'),
    ('08-multiplexer', 'Multiplexer', 'studio'),
    ('09-limiti', 'Limiti e anomalie', 'problemi'),
    ('10-diagnostica', 'Diagnostica', 'problemi'),
    ('11-autoverifica', 'Autoverifica', 'studio'),
    ('12-manutenzione', 'Fonti e manutenzione', 'studio'),
]


def slug(value: str) -> str:
    value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', value).strip('-')


def inline(value: str) -> str:
    """Render inline tokens after escaping text; never execute Markdown HTML."""
    placeholders: list[str] = []

    def store(markup: str) -> str:
        placeholders.append(markup)
        return f'\x01{len(placeholders) - 1}\x02'

    value = re.sub(r'`([^`]+)`', lambda m: store('<code>' + html.escape(m[1]) + '</code>'), value)

    def link(match: re.Match) -> str:
        label, url = match[1], match[2]
        if re.match(r'(?i)(?:javascript|data|vbscript):', url):
            raise ValueError(f'Protocollo link non consentito: {url}')
        return store(f'<a href="{html.escape(url, quote=True)}">{html.escape(label)}</a>')

    value = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', link, value)
    value = html.escape(value)
    value = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', value)
    while re.search(r'\x01(\d+)\x02', value):
        value = re.sub(r'\x01(\d+)\x02', lambda m: placeholders[int(m[1])], value)
    return value


def render(lines: list[str], chapter_id: str) -> tuple[str, list[dict]]:
    out: list[str] = []
    headings: list[dict] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
            continue
        if line.startswith('### '):
            title = line[4:]
            hid = chapter_id + '-' + slug(title)
            headings.append({'title': title, 'id': hid})
            out.append(f'<h3 id="{hid}">{inline(title)}<a class="heading-link" href="#{hid}" aria-label="Link a questa sottosezione">#</a></h3>')
            i += 1
        elif line.startswith('```'):
            language = line[3:].strip() or 'text'
            code: list[str] = []
            i += 1
            while i < len(lines) and not lines[i].startswith('```'):
                code.append(lines[i]); i += 1
            if i == len(lines):
                raise ValueError('Blocco codice non chiuso')
            out.append('<div class="code-wrap"><div class="code-label"><span>' + html.escape(language) + '</span><button class="copy" type="button" aria-label="Copia il blocco di codice">Copia</button></div><pre><code class="language-' + html.escape(language) + '">' + html.escape('\n'.join(code)) + '</code></pre></div>')
            i += 1
        elif line.startswith('|'):
            rows: list[list[str]] = []
            while i < len(lines) and lines[i].startswith('|'):
                # Protect literal bitwise OR inside inline code in table cells.
                protected = re.sub(r'`[^`]*`', lambda m: m[0].replace('|', '\x03'), lines[i])
                rows.append([x.strip().replace('\x03', '|') for x in protected.strip().strip('|').split('|')]); i += 1
            if len(rows) < 2 or not all(re.fullmatch(r':?-+:?', c.replace(' ', '')) for c in rows[1]):
                raise ValueError('Tabella senza separatore Markdown')
            size = len(rows[0])
            if any(len(row) != size for row in rows):
                raise ValueError(f'Tabella con numero di celle incoerente: {rows[0]}')
            out.append('<div class="table-scroll" role="region" tabindex="0" aria-label="Tabella, scorrimento orizzontale disponibile"><table><thead><tr>' + ''.join('<th scope="col">' + inline(c) + '</th>' for c in rows[0]) + '</tr></thead><tbody>')
            for row in rows[2:]:
                out.append('<tr>' + ''.join('<td>' + inline(c) + '</td>' for c in row) + '</tr>')
            out.append('</tbody></table></div>')
        elif line.startswith('> '):
            quote = []
            while i < len(lines) and lines[i].startswith('> '):
                quote.append(lines[i][2:]); i += 1
            out.append('<blockquote><p>' + inline(' '.join(quote)) + '</p></blockquote>')
        elif re.match(r'^\d+\. ', line) or line.startswith('- '):
            ordered = bool(re.match(r'^\d+\. ', line))
            pattern = r'^\d+\. ' if ordered else r'^- '
            tag = 'ol' if ordered else 'ul'
            out.append('<' + tag + '>')
            while i < len(lines) and re.match(pattern, lines[i]):
                out.append('<li>' + inline(re.sub(pattern, '', lines[i])) + '</li>'); i += 1
            out.append('</' + tag + '>')
        elif line in ('<!-- laboratorio-byte -->', '<!-- laboratorio-conversione -->'):
            key = 'byte' if 'byte' in line else 'conversione'
            out.append(f'<!-- INSERT:{key} -->'); i += 1
        else:
            paragraph = [line]
            i += 1
            while i < len(lines) and lines[i].strip() and not re.match(r'^(### |```|\||> |\d+\. |- |<!--)', lines[i]):
                paragraph.append(lines[i]); i += 1
            out.append('<p>' + inline(' '.join(paragraph)) + '</p>')
    return '\n'.join(out), headings


class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__(); self.parts = []
    def handle_data(self, data):
        self.parts.append(data)


def plain(markup: str) -> str:
    parser = TextExtractor(); parser.feed(markup)
    return re.sub(r'\s+', ' ', ' '.join(parser.parts)).strip()


def build() -> Path:
    markdown = (ROOT / 'guida-max1161x.md').read_text(encoding='utf-8')
    chunks = re.split(r'^## ', markdown, flags=re.M)
    if len(chunks) != len(CHAPTERS) + 1:
        raise ValueError('Capitoli inattesi nel Markdown')
    sections, nav, search_index = [], [], []
    labs = (ROOT / 'laboratori.html').read_text(encoding='utf-8')
    lab_map = dict(re.findall(r'<template id="tpl-([^"]+)">\s*([\s\S]*?)\s*</template>', labs))
    intro, _ = render(chunks[0].splitlines()[2:], 'intro')
    for pos, ((chapter_id, label, category), chunk) in enumerate(zip(CHAPTERS, chunks[1:])):
        title, _, body = chunk.partition('\n')
        content, headings = render(body.splitlines(), chapter_id)
        if pos == 0:
            content = '<div class="guide-intro">' + intro + '</div>\n' + content
        # Index semantic subsections before inserting interactive controls and copy labels.
        blocks = re.split(r'(<h3\b[^>]*>[\s\S]*?</h3>)', content)
        if plain(blocks[0]):
            search_index.append({'id': chapter_id, 'title': label, 'chapter': f'{pos:02} · {label}', 'category': category, 'text': plain(blocks[0]), 'order': len(search_index)})
        for index in range(1, len(blocks), 2):
            heading, rest = blocks[index], blocks[index + 1]
            hid = re.search(r'id="([^"]+)"', heading)[1]
            htitle = plain(re.sub(r'<a\b[^>]*>[\s\S]*?</a>', '', heading))
            rest = re.sub(r'<div class="code-label">[\s\S]*?</div>', '', rest)
            search_index.append({'id': hid, 'title': htitle, 'chapter': f'{pos:02} · {label}', 'category': category, 'text': plain(rest), 'order': len(search_index)})
        for key, lab in lab_map.items():
            content = content.replace(f'<!-- INSERT:{key} -->', lab)
        previous = f'<a href="#{CHAPTERS[pos - 1][0]}">← {CHAPTERS[pos - 1][1]}</a>' if pos else '<span>Inizia da qui</span>'
        following = f'<a href="#{CHAPTERS[pos + 1][0]}">{CHAPTERS[pos + 1][1]} →</a>' if pos + 1 < len(CHAPTERS) else '<a href="#inizio">Torna all’inizio ↑</a>'
        sections.append(f'<section class="chapter" id="{chapter_id}" data-title="{html.escape(label)}" aria-labelledby="{chapter_id}-titolo"><div class="chapter-label">Guida / {pos:02} / {html.escape(category)}</div><h2 id="{chapter_id}-titolo">{inline(title)}<a class="heading-link" href="#{chapter_id}" aria-label="Link al capitolo">#</a></h2>{content}<div class="chapter-footer">{previous}{following}</div></section>')
        subnav = ''.join(f'<a href="#{h["id"]}">{html.escape(h["title"])}</a>' for h in headings)
        nav.append(f'<div class="nav-group"><a href="#{chapter_id}"><span>{pos:02}</span>{html.escape(label)}</a><div class="subnav">{subnav}</div></div>')
    css = (ROOT / 'stile.css').read_text(encoding='utf-8')
    js = (ROOT / 'interazioni.js').read_text(encoding='utf-8')
    index_json = json.dumps(search_index, ensure_ascii=False).replace('<', '\\u003c')
    document = f'''<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="Guida in italiano alla libreria Rust max1161x: architettura, API, setup, configuration, I2C, conversioni, esempi e limiti verificati sui sorgenti."><meta name="color-scheme" content="light dark"><title>MAX1161x · Capire la libreria | UNIUD E-Racing</title><style>{css}</style></head>
<body><a class="skip" href="#content">Vai al contenuto</a>
<aside class="sidebar" id="sidebar" aria-label="Navigazione della guida"><div class="brand">UNIUD E-RACING / ENGINEERING</div><a class="wordmark" href="#inizio">MAX1161x</a><p class="sub">Dal segnale alla temperatura.<br>Guida alle sorgenti Rust.</p><button type="button" class="search-open" data-open-search><span>Cerca nella guida</span><kbd>Ctrl K</kbd></button><nav aria-label="Capitoli">{''.join(nav)}</nav><div class="sidebar-foot">v0.1.0 · 2 novembre 2026<br>Revisione <code>ac91bd8</code><br><a href="guida-max1161x.md">Leggi il Markdown ↗</a></div></aside>
<header class="topbar"><button id="menu" class="mobile-menu" aria-expanded="false" aria-controls="sidebar" type="button">Indice</button><span class="crumb">Librerie / MAX1161x / <span id="current-chapter">Introduzione</span></span><div class="tools"><button type="button" data-open-search aria-label="Apri la ricerca">Cerca</button><button id="theme" class="theme-label" type="button">Scuro</button><button id="print" type="button">Stampa / PDF</button><a href="guida-max1161x.md">Markdown ↗</a></div></header><div class="reading-progress" aria-hidden="true"><span id="progress"></span></div>
<main id="content"><header class="hero" id="inizio"><div class="eyebrow">Manuale di studio / Rust / I²C</div><h1>Capire MAX1161x.<br>Un byte alla volta.</h1><p>Scopo, funzioni e configurazioni della libreria. Segui i dati dal bus alla temperatura e riconosci le assunzioni che ne cambiano il significato.</p><div class="pills"><span>6 varianti</span><span>12 bit</span><span>I²C sincrono</span><span>Ricerca offline</span></div><div class="hero-links"><a href="#00-come-usare-questa-guida">Inizia il percorso →</a><a href="#05-driver">Vai alle API →</a><a href="#09-limiti">Leggi i limiti →</a></div></header>
<div class="overview"><a href="#03-setup"><strong>01 / Configura</strong><small>Registri, bit e valori di default</small></a><a href="#06-conversioni"><strong>02 / Segui i dati</strong><small>Due byte, un raw, una temperatura</small></a><a href="#07-esempi"><strong>03 / Integra</strong><small>Frammenti Rust e casi da riconoscere</small></a></div>
<noscript><p class="noscript">JavaScript è disabilitato. Il testo e i collegamenti restano disponibili; usa Ctrl+F per cercare. Ricerca dedicata e laboratori richiedono JavaScript.</p></noscript>
{''.join(sections)}<footer class="site-footer">Documento generato dal Markdown · Interfaccia senza risorse esterne · Analisi delle sorgenti, senza prove hardware.</footer></main>
<button class="back-top" id="back-top" type="button" hidden aria-label="Torna all'inizio">↑ Inizio</button>
<dialog id="search-dialog" aria-labelledby="search-title"><div class="search-head"><div class="search-title"><h2 id="search-title">Cerca nella guida</h2><button type="button" id="search-close" aria-label="Chiudi ricerca">Esc / Chiudi</button></div><div class="search-row"><label class="sr-only" for="search-query">Parole o simboli da cercare</label><input id="search-query" type="search" placeholder="Es. read_all_sensors, reset, Vref…" autocomplete="off" spellcheck="false"><label class="sr-only" for="search-scope">Filtra per argomento</label><select id="search-scope"><option value="all">Tutti gli argomenti</option><option value="api">API e codice</option><option value="config">Configurazioni</option><option value="problemi">Limiti e diagnostica</option><option value="studio">Concetti e studio</option></select></div><p class="search-hint">Più parole = ricerca combinata · ↓ risultati · Invio apri · Esc chiudi</p><p class="search-meta" id="search-count" role="status" aria-live="polite"></p></div><div class="search-results" id="search-results"></div></dialog>
<script id="search-index" type="application/json">{index_json}</script><script>{js}</script></body></html>'''
    output = ROOT / 'guida-max1161x.html'
    output.write_text(document, encoding='utf-8', newline='\n')
    print(f'Generati {output.name}: {len(sections)} capitoli, {len(search_index)} voci di ricerca, {output.stat().st_size:,} byte.')
    return output


if __name__ == '__main__':
    build()
