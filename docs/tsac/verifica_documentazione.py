"""Controlli locali, riproducibili, senza rete. Non compila il package ESP-IDF."""
from __future__ import annotations
import argparse
from collections import Counter
from datetime import datetime
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

from genera_guida import CHAPTERS, ROOT, build


class InspectHTML(HTMLParser):
    def __init__(self):
        super().__init__(); self.ids = []; self.links = []; self.external_resources = []; self.in_index = False; self.index = ''; self.sections = 0; self.stack = []
    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if 'id' in data: self.ids.append(data['id'])
        if tag == 'a' and 'href' in data: self.links.append(data['href'])
        if tag in ('script', 'img', 'iframe', 'link') and ('src' in data or 'href' in data): self.external_resources.append(data.get('src', data.get('href')))
        if tag == 'script' and data.get('id') == 'search-index': self.in_index = True
        if tag == 'section' and data.get('class') == 'chapter': self.sections += 1
    def handle_endtag(self, tag):
        if tag == 'script': self.in_index = False
    def handle_data(self, data):
        if self.in_index: self.index += data


def run(command, cwd=None):
    result = subprocess.run(command, cwd=cwd, capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=90)
    if result.returncode:
        raise RuntimeError(f'{command[0]}: esito {result.returncode}\n{result.stdout}\n{result.stderr}')
    return result


def main():
    arguments = argparse.ArgumentParser(description=__doc__)
    arguments.add_argument('--source-root', type=Path, help='Checkout della libreria MAX1161x, separato dalla documentazione')
    args = arguments.parse_args()
    library_root = args.source_root.resolve() if args.source_root else None
    source_root = library_root / 'src' if library_root else None
    source_files = []
    if library_root:
        required = ['Cargo.toml', 'Cargo.lock', 'README.md', 'examples/test.rs', 'src/lib.rs', 'src/max_driver.rs', 'src/max_variants.rs', 'src/max_messages/setup_byte.rs', 'src/max_messages/config_byte.rs']
        missing = [relative for relative in required if not (library_root / relative).is_file()]
        if missing:
            arguments.error('--source-root non contiene il checkout MAX1161x atteso; file mancanti: ' + ', '.join(missing))
        source_files = sorted(source_root.rglob('*.rs')) + [library_root / relative for relative in ('Cargo.toml', 'Cargo.lock', 'README.md', 'examples/test.rs')]
    output = build(); markup = output.read_text(encoding='utf-8'); md = (ROOT / 'guida-max1161x.md').read_text(encoding='utf-8')
    parser = InspectHTML(); parser.feed(markup)
    assert parser.sections == len(CHAPTERS)
    assert not [key for key, count in Counter(parser.ids).items() if count > 1], 'ID duplicati'
    ids = set(parser.ids)
    for link in parser.links:
        if link.startswith('#'): assert link[1:] in ids, f'Anchor assente: {link}'
        elif not re.match(r'^https?://', link): assert (ROOT / link.split('#')[0]).is_file(), f'File assente: {link}'
    assert not parser.external_resources, f'Risorse esterne: {parser.external_resources}'
    assert not re.search(r'@import|url\s*\(\s*[\'"]?https?://', markup), 'CSS esterno'
    assert '<!-- INSERT:' not in markup and '<template' not in markup
    assert not re.search(r'<h3[^>]*>.*?<h3', markup), 'Titoli annidati'
    index = json.loads(parser.index)
    for item in index: assert item['id'] in ids and item['text'], f'Voce ricerca non valida: {item}'
    for term in ('read_all_sensors', 'calibrate_me', 'reset', '0x17', 'Vref', 'mux_governor', 'PhantomData', 'SingleChannel'):
        assert any(term.lower() in (item['title'] + item['text']).lower() for item in index), f'Simbolo non ricercabile: {term}'
    # Every literal public API and every enum variant occurs in the prose.
    symbols = set()
    for path in source_root.rglob('*.rs') if source_root else ():
        source = path.read_text(encoding='utf-8')
        symbols.update(re.findall(r'pub (?:struct|trait|enum|fn|mod)\s+(\w+)', source))
        symbols.update(re.findall(r'^\s+(\w+)\s*=\s*0b[01]+', source, re.M))
    for symbol in symbols: assert symbol in md, f'Simbolo pubblico non documentato: {symbol}'
    checks = {'html_structure': 'passed', 'chapters': parser.sections, 'unique_ids': len(ids), 'links_checked': len(parser.links), 'search_entries': len(index), 'public_symbols_documented': len(symbols) if source_root else {'status': 'skipped', 'reason': 'Checkout MAX1161x non fornito; usare --source-root'}, 'external_ui_resources': 0}
    rustc = shutil.which('rustc')
    if rustc and source_root:
        harness = (ROOT / 'verifica_driver.rs').read_text(encoding='utf-8')
        for key, relative in {'SETUP': 'max_messages/setup_byte.rs', 'CONFIG': 'max_messages/config_byte.rs', 'VARIANTS': 'max_variants.rs', 'DRIVER': 'max_driver.rs'}.items():
            harness = harness.replace('@' + key + '@', (source_root / relative).as_posix())
        snippets = re.findall(r'```rust\n(.*?)\n```', md, re.S)
        complete = [s for s in snippets if 'pub fn acquisisci_temperature' in s or 'pub fn leggi_ain0_raw' in s]
        assert len(complete) == 2
        harness = harness.replace('@SNIPPETS@', '\n'.join(f'mod esempio_{i} {{\n{snippet}\n}}' for i, snippet in enumerate(complete)))
        with tempfile.TemporaryDirectory(prefix='max1161x-doc-check-') as temp:
            temp_path = Path(temp); test_path = temp_path / 'harness.rs'; test_path.write_text(harness, encoding='utf-8')
            exe = temp_path / 'harness.exe'
            run([rustc, '--edition=2021', '--test', str(test_path), '-o', str(exe)])
            test_result = run([str(exe), '--test-threads=1'])
            match = re.search(r'test result: ok\. (\d+) passed', test_result.stdout)
            assert match, test_result.stdout
            checks['rust_driver_harness'] = {'status': 'passed', 'tests': int(match[1]), 'complete_markdown_examples_compiled': len(complete), 'method': 'Sorgenti reali importati, HAL e logger sostituiti localmente. Nessun build ESP-IDF.'}
    else:
        checks['rust_driver_harness'] = {'status': 'skipped', 'reason': 'Checkout MAX1161x non fornito; usare --source-root' if not source_root else 'rustc non presente nel PATH'}
    node = shutil.which('node')
    if node:
        run([node, '--check', str(ROOT / 'interazioni.js')]); checks['javascript_syntax'] = 'passed'
        js_test = ROOT / 'verifica_interazioni.cjs'
        if js_test.exists():
            result = run([node, str(js_test)], cwd=ROOT); checks['javascript_interactions'] = json.loads(result.stdout)
    else:
        checks['javascript_syntax'] = 'skipped: node non presente'
    cargo = shutil.which('cargo')
    if cargo and library_root:
        metadata = run([cargo, 'metadata', '--no-deps', '--offline', '--format-version', '1'], cwd=library_root)
        package = json.loads(metadata.stdout)['packages'][0]
        checks['cargo_metadata'] = {'status': 'passed', 'name': package['name'], 'version': package['version'], 'targets': [t['name'] for t in package['targets']]}
    else:
        checks['cargo_metadata'] = {'status': 'skipped', 'reason': 'Checkout MAX1161x non fornito; usare --source-root' if not library_root else 'cargo non presente nel PATH'}
    report = {'generated_at': datetime.now().astimezone().isoformat(timespec='seconds'), 'documented_source_revision': 'ac91bd8ca657ee3962acefc0e5e57291e7d0ba19', 'source_checkout_provided': library_root is not None, 'checks': checks, 'limitations': ['Nessuna compilazione completa ESP-IDF o dell’esempio originale.', 'Nessuna prova hardware, misura di tempi o validazione della taratura.', 'Browser integrato: URL file:// rifiutato per policy. Verifica visiva non completata.', 'Test JavaScript su DOM simulato: non verifica CSS, appunti, stampa o accessibilità reale.'], 'source_sha256': {str(p.relative_to(library_root)).replace('\\', '/'): hashlib.sha256(p.read_bytes()).hexdigest() for p in source_files}, 'output_sha256': hashlib.sha256(output.read_bytes()).hexdigest()}
    (ROOT / 'verifica-documentazione.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(checks, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
