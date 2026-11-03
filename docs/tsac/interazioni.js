(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const all = (selector, root = document) => [...root.querySelectorAll(selector)];
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const termsOf = value => normalize(value).match(/[a-z0-9_]+/g) || [];
  const hex = value => '0x' + value.toString(16).toUpperCase().padStart(2, '0');
  const fmt = (value, digits = 2) => value.toLocaleString('it-IT', {minimumFractionDigits: digits, maximumFractionDigits: digits});
  const polynomial = v => 1.79615598298204 * v ** 3 - 9.37248626037254 * v ** 2 + 38.0779254777707 * v - 2.53332540256446;

  // Preferences remain optional on file:// or in privacy-restricted browsers.
  const theme = $('theme');
  const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  let saved;
  try { saved = localStorage.getItem('max1161x-theme'); } catch (_) { /* optional storage */ }
  function setTheme(value) {
    document.documentElement.dataset.theme = value;
    theme.textContent = value === 'dark' ? 'Chiaro' : 'Scuro';
    theme.setAttribute('aria-label', 'Attiva tema ' + (value === 'dark' ? 'chiaro' : 'scuro'));
  }
  setTheme(saved === 'dark' || saved === 'light' ? saved : preferred);
  theme.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try { localStorage.setItem('max1161x-theme', next); } catch (_) { /* optional storage */ }
  });
  $('print').addEventListener('click', () => window.print());
  $('back-top').addEventListener('click', () => window.scrollTo({top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'}));
  $('menu').addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    $('menu').setAttribute('aria-expanded', String(open));
  });
  function closeMenu() {
    document.body.classList.remove('menu-open');
    $('menu').setAttribute('aria-expanded', 'false');
  }
  all('nav a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('click', event => {
    if (document.body.classList.contains('menu-open') && !event.target.closest('.sidebar') && !event.target.closest('#menu')) closeMenu();
  });

  // Copy buttons retain a file:// fallback when the Clipboard API is unavailable.
  all('.copy').forEach(button => button.addEventListener('click', async () => {
    const value = button.closest('.code-wrap').querySelector('code').textContent;
    let copied = false;
    try { await navigator.clipboard.writeText(value); copied = true; } catch (_) {
      const input = document.createElement('textarea');
      input.value = value; input.style.position = 'fixed'; input.style.opacity = '0';
      document.body.append(input); input.select();
      try { copied = document.execCommand('copy'); } catch (_) { /* manual selection remains available */ }
      input.remove();
    }
    button.textContent = copied ? 'Copiato' : 'Seleziona e copia';
    if (!copied) {
      const range = document.createRange();
      range.selectNodeContents(button.closest('.code-wrap').querySelector('code'));
      window.getSelection().removeAllRanges(); window.getSelection().addRange(range);
    }
    setTimeout(() => { button.textContent = 'Copia'; }, 1800);
  }));

  // Search content is generated with the HTML: no fetch, backend, or index download.
  const search = $('search-dialog'), query = $('search-query'), scope = $('search-scope'), results = $('search-results');
  const index = JSON.parse($('search-index').textContent);
  index.forEach(item => { item.normal = normalize(item.title + ' ' + item.chapter + ' ' + item.text); item.normalTitle = normalize(item.title); });
  let lastFocus;
  function highlightText(container, text, terms) {
    const norm = normalize(text);
    const ranges = [];
    terms.forEach(term => {
      let start = norm.indexOf(term);
      while (start !== -1) { ranges.push([start, start + term.length]); start = norm.indexOf(term, start + term.length); }
    });
    ranges.sort((a, b) => a[0] - b[0]);
    const merged = [];
    ranges.forEach(range => {
      const prev = merged[merged.length - 1];
      if (prev && range[0] <= prev[1]) prev[1] = Math.max(prev[1], range[1]); else merged.push([...range]);
    });
    let cursor = 0;
    merged.forEach(([start, end]) => {
      container.append(document.createTextNode(text.slice(cursor, start)));
      const mark = document.createElement('mark'); mark.textContent = text.slice(start, end); container.append(mark); cursor = end;
    });
    container.append(document.createTextNode(text.slice(cursor)));
  }
  function clearPageHighlights() {
    all('main mark[data-search]').forEach(mark => mark.replaceWith(document.createTextNode(mark.textContent)));
    $('content').normalize();
  }
  function highlightSection(id, terms) {
    clearPageHighlights();
    const heading = $(id);
    if (!heading || !terms.length) return;
    const targets = [];
    if (heading.matches('section')) targets.push(...all('p,td,li', heading));
    else {
      let next = heading.nextElementSibling;
      targets.push(heading);
      while (next && !next.matches('h2,h3')) { targets.push(next); next = next.nextElementSibling; }
    }
    let count = 0;
    for (const target of targets) {
      const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      for (const node of nodes) {
        if (count >= 30 || node.parentElement.closest('button,select,input,.lab,a.heading-link,mark')) continue;
        if (!terms.some(term => normalize(node.textContent).includes(term))) continue;
        const fragment = document.createElement('span');
        highlightText(fragment, node.textContent, terms);
        all('mark', fragment).forEach(mark => mark.dataset.search = 'true');
        node.replaceWith(...fragment.childNodes); count++;
      }
    }
  }
  function renderSearch() {
    const terms = [...new Set(termsOf(query.value))].slice(0, 12);
    results.replaceChildren();
    if (!terms.length) {
      const help = document.createElement('p'); help.className = 'no-results';
      help.textContent = 'Cerca un concetto, un simbolo Rust o un byte. Tutte le parole devono comparire nella stessa sottosezione. Accenti e maiuscole non fanno differenza.';
      results.append(help);
      const popular = document.createElement('div'); popular.className = 'popular';
      ['read_all_sensors', 'reset', '0x17', 'Vref', 'multiplexer', 'calibrate_me'].forEach(value => {
        const button = document.createElement('button'); button.type = 'button'; button.textContent = value;
        button.addEventListener('click', () => { query.value = value; renderSearch(); query.focus(); }); popular.append(button);
      });
      results.append(popular); $('search-count').textContent = 'Ricerca disponibile offline'; return;
    }
    const matches = index.filter(item => (scope.value === 'all' || item.category === scope.value) && terms.every(term => item.normal.includes(term)))
      .map(item => ({item, score: terms.reduce((sum, term) => sum + (item.normalTitle.includes(term) ? 15 : 0) + (normalize(item.text).includes(term) ? 3 : 0), 0)}))
      .sort((a, b) => b.score - a.score || a.item.order - b.item.order);
    $('search-count').textContent = matches.length + (matches.length === 1 ? ' risultato' : ' risultati') + (matches.length > 40 ? ' · primi 40 visualizzati' : '');
    if (!matches.length) {
      const none = document.createElement('p'); none.className = 'no-results'; none.textContent = 'Nessun risultato. Prova meno parole, una parte del nome o il filtro “Tutti gli argomenti”.'; results.append(none); return;
    }
    matches.slice(0, 40).forEach(({item}) => {
      const a = document.createElement('a'); a.href = '#' + item.id;
      const category = document.createElement('span'); category.className = 'result-category'; category.textContent = item.chapter;
      const title = document.createElement('span'); title.className = 'result-title'; highlightText(title, item.title, terms);
      const snippet = document.createElement('span'); snippet.className = 'result-snippet';
      const positions = terms.map(term => normalize(item.text).indexOf(term)).filter(pos => pos >= 0);
      const first = positions.length ? Math.min(...positions) : 0;
      const start = Math.max(0, first - 65);
      const text = (start ? '… ' : '') + item.text.slice(start, start + 225) + (item.text.length > start + 225 ? ' …' : '');
      highlightText(snippet, text, terms);
      a.append(category, title, snippet);
      a.addEventListener('click', () => {
        search.close(); closeMenu(); highlightSection(item.id, terms);
        setTimeout(() => { const target = $(item.id); target.scrollIntoView({block: 'start'}); target.setAttribute('tabindex', '-1'); target.focus({preventScroll: true}); }, 0);
      });
      results.append(a);
    });
  }
  function openSearch() {
    lastFocus = document.activeElement;
    if (!search.open) search.showModal();
    renderSearch(); query.focus(); query.select();
  }
  all('[data-open-search]').forEach(button => button.addEventListener('click', openSearch));
  $('search-close').addEventListener('click', () => search.close());
  search.addEventListener('click', event => { if (event.target === search && (event.offsetX < 0 || event.offsetY < 0 || event.offsetX > search.clientWidth || event.offsetY > search.clientHeight)) search.close(); });
  search.addEventListener('close', () => { if (lastFocus) lastFocus.focus({preventScroll: true}); });
  query.addEventListener('input', renderSearch); scope.addEventListener('change', renderSearch);
  query.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' || event.key === 'Enter') { const first = results.querySelector('a'); if (first) { event.preventDefault(); first.focus(); } }
  });
  results.addEventListener('keydown', event => {
    const links = all('a', results), current = links.indexOf(document.activeElement);
    if (event.key === 'ArrowDown' && links.length) { event.preventDefault(); links[Math.min(current + 1, links.length - 1)].focus(); }
    if (event.key === 'ArrowUp') { event.preventDefault(); if (current <= 0) query.focus(); else links[current - 1].focus(); }
  });
  document.addEventListener('keydown', event => {
    const editable = event.target.closest('input,textarea,select,[contenteditable=true]');
    if ((event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey)) || (event.key === '/' && !editable)) { event.preventDefault(); openSearch(); }
    if (event.key === 'Escape') { closeMenu(); if (!search.open) clearPageHighlights(); }
  });

  const chapters = all('.chapter');
  let ticking = false;
  function updateReading() {
    ticking = false;
    const denominator = document.documentElement.scrollHeight - innerHeight;
    $('progress').style.width = (denominator > 0 ? Math.max(0, Math.min(100, scrollY / denominator * 100)) : 0) + '%';
    let active = chapters[0];
    for (const chapter of chapters) { if (chapter.getBoundingClientRect().top <= 150) active = chapter; else break; }
    all('.nav-group').forEach(group => {
      const link = group.querySelector('a'), isActive = link.getAttribute('href') === '#' + active.id;
      group.classList.toggle('active', isActive);
      if (isActive) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
    $('current-chapter').textContent = active.dataset.title;
    $('back-top').hidden = scrollY < 700;
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(updateReading); } }, {passive: true});
  window.addEventListener('resize', updateReading);
  updateReading();

  // Labs share the exact bit construction and coefficient values explained in the guide.
  const refs = {0: 'VddRef', 2: 'ExternalRef', 4: 'InternalRefOff', 5: 'InternalRefOn', 6: 'InternalRefOutputOff', 7: 'InternalRefOutputOn'};
  const scans = ['ScanFromZero', 'RepeatEight', 'ScanUpperHalf', 'SingleChannel'];
  function drawBits(id, value, names) {
    const root = $(id); root.replaceChildren();
    for (let bit = 7; bit >= 0; bit--) {
      const cell = document.createElement('span'); cell.className = 'bit'; cell.textContent = (value >> bit) & 1;
      const label = document.createElement('small'); label.textContent = names[7 - bit]; cell.append(label); root.append(cell);
    }
  }
  function updateBytes() {
    const ref = +$('ref').value, clk = +$('clk').value, bip = +$('bip').value, rst = +$('rst').value;
    const scan = +$('scan').value, channel = +$('channel').value, sgl = +$('sgl').value;
    const setup = 0x80 | (ref << 4) | (clk << 3) | (bip << 2) | (rst << 1);
    const config = (scan << 5) | (channel << 1) | sgl;
    $('setup-value').textContent = hex(setup) + ' · ' + setup;
    $('config-value').textContent = hex(config) + ' · ' + config;
    drawBits('setup-bits', setup, ['REG', 'SEL2', 'SEL1', 'SEL0', 'CLK', 'BIP', 'RST', 'X']);
    drawBits('config-bits', config, ['REG', 'SCAN1', 'SCAN0', 'CS3', 'CS2', 'CS1', 'CS0', 'SGL']);
    $('setup-code').textContent = `SetupByte::new(\n  RefSelect::${refs[ref]},\n  Clock::${clk ? 'External' : 'Internal'},\n  Mode::${bip ? 'Bipolar' : 'Unipolar'},\n  ${rst ? 'true' : 'false'},\n).to_byte() // ${hex(setup)}`;
    $('config-code').textContent = `ConfigByte::new(\n  ScanConfig::${scans[scan]},\n  ChannelSelect::Ain${channel},\n  InputMode::${sgl ? 'SingleEnded' : 'Differential'},\n).to_byte() // ${hex(config)}`;
    const notes = [];
    if (ref !== 0) notes.push('La formula del driver resta a 3,3 V anche con un riferimento diverso.');
    if (ref === 4 || ref === 6) notes.push('Il riferimento interno è selezionato ma spento.');
    if (ref === 5 || ref === 7) notes.push('Il driver non inserisce l’attesa di avvio del riferimento.');
    if (ref === 2 || ref === 6 || ref === 7) notes.push('Controllare l’uso del pin condiviso AIN/REF e il numero dei risultati.');
    if (bip || !sgl) notes.push('Il decoder attuale non gestisce il segno bipolare e la conversione applicativa non modella coppie differenziali.');
    if (!rst) notes.push('reset=false scrive RST=0: richiede il reset della configuration.');
    notes.push('Byte componibili ≠ modalità tutte supportate dall’API di lettura: read_all_sensors() invia sempre 0x17.');
    $('byte-warning').textContent = notes.join(' ');
  }
  all('#lab-byte select').forEach(select => select.addEventListener('change', updateBytes));
  $('byte-reset').addEventListener('click', () => {
    Object.entries({ref: 0, clk: 0, bip: 0, rst: 1, scan: 0, channel: 11, sgl: 1}).forEach(([id, value]) => { $(id).value = value; }); updateBytes();
  });
  function updateConversion(source) {
    if (source && source.id === 'raw-number' && (source.value === '' || !source.validity.valid)) return;
    const rawInput = source && source.id === 'raw-range' ? source : $('raw-number');
    const raw = Math.max(0, Math.min(4095, Math.round(+rawInput.value || 0)));
    $('raw-number').value = raw; $('raw-range').value = raw;
    const vref = +$('compare-vref').value;
    if (!$('compare-vref').validity.valid || vref < 1 || vref > 5.5) return;
    const volts = raw * 3.3 / 4096, compare = raw * vref / 4096, temperature = polynomial(volts);
    const high = 0xF0 | ((raw >> 8) & 0xF), low = raw & 0xFF;
    $('raw-code').textContent = `rx = [${hex(high)}, ${hex(low)}]\n(${hex(high)} & 0x0F) << 8 | ${hex(low)}\n= ${hex(raw)} = ${raw}\n\nv = ${raw} × 3.3 / 4096\nT = a·v³ + b·v² + c·v + d`;
    $('raw-display').textContent = raw;
    $('driver-volts').textContent = fmt(volts, 6) + ' V'; $('driver-temp').textContent = fmt(temperature) + ' °C';
    $('compare-volts').textContent = fmt(compare, 6) + ' V'; $('compare-temp').textContent = fmt(polynomial(compare)) + ' °C';
    $('range-note').textContent = temperature < 15 || temperature > 75 ? 'Fuori dal campo di taratura dichiarato (15…75 °C). Il driver restituisce comunque questo valore.' : 'Risultato nel campo di taratura dichiarato (15…75 °C). Questo non dimostra l’accuratezza della misura.';
  }
  ['raw-number', 'raw-range', 'compare-vref'].forEach(id => $(id).addEventListener('input', event => updateConversion(event.target)));
  updateBytes(); updateConversion();
  document.documentElement.dataset.ready = 'true';
})();
