// Test delle interazioni nel solo DOM simulato. Non è un test del rendering.
'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = __dirname;
const html = fs.readFileSync(path.join(root, 'guida-max1161x.html'), 'utf8');
class Element {
  constructor(tag = 'div', id = '') { this.tagName = tag; this.id = id; this.children = []; this.listeners = {}; this.dataset = {}; this.style = {}; this.attrs = {}; this.value = ''; this.validity = {valid: true}; this._text = ''; this.open = false; this.classList = {toggle() {}, remove() {}, contains() {return false;}}; }
  set textContent(value) { this._text = String(value); this.children = []; }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  append(...children) { this.children.push(...children); children.forEach(child => { if (typeof child === 'object') child.parentElement = this; }); }
  replaceChildren(...children) { this.children = []; this._text = ''; this.append(...children); }
  setAttribute(key, value) { this.attrs[key] = String(value); }
  getAttribute(key) { return this.attrs[key]; }
  removeAttribute(key) { delete this.attrs[key]; }
  addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); }
  fire(type, event = {}) { event.target ||= this; event.preventDefault ||= () => {}; for (const listener of this.listeners[type] || []) listener(event); }
  focus() { document.activeElement = this; }
  select() {}
  showModal() { this.open = true; }
  close() { this.open = false; this.fire('close'); }
  normalize() {}
  scrollIntoView() {}
  getBoundingClientRect() { return {top: 500}; }
  matches(selector) { return selector.split(',').includes(this.tagName); }
  closest(selector) { return this.matches(selector) ? this : null; }
  querySelectorAll(selector) { return this.children.flatMap(child => child instanceof Element ? [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)] : []); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
}
const elements = new Map();
for (const match of html.matchAll(/<([a-z0-9]+)\b[^>]*\bid="([^"]+)"[^>]*>/g)) elements.set(match[2], new Element(match[1], match[2]));
const el = id => { const value = elements.get(id); assert(value, `ID HTML mancante: ${id}`); return value; };
for (const match of html.matchAll(/<select\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)) {
  const options = [...match[2].matchAll(/<option\b([^>]*)>/g)];
  const selected = options.find(option => /\bselected\b/.test(option[1])) || options[0];
  el(match[1]).value = /value="([^"]*)"/.exec(selected[1])[1];
}
for (const match of html.matchAll(/<input\b[^>]*id="([^"]+)"[^>]*>/g)) el(match[1]).value = /value="([^"]*)"/.exec(match[0])?.[1] || '';
el('search-index').textContent = /<script id="search-index" type="application\/json">([\s\S]*?)<\/script>/.exec(html)[1];
const chapters = [...html.matchAll(/<section class="chapter" id="([^"]+)" data-title="([^"]+)"/g)].map(match => { const item = el(match[1]); item.dataset.title = match[2]; return item; });
const openButton = new Element('button');
const docListeners = {};
const document = {
  documentElement: new Element('html'), body: new Element('body'), activeElement: openButton,
  getElementById: el, createElement: tag => new Element(tag), createTextNode: text => { const value = new Element('#text'); value.textContent = text; return value; },
  querySelectorAll(selector) {
    if (selector === '[data-open-search]') return [openButton];
    if (selector === '.chapter') return chapters;
    if (selector === '#lab-byte select') return ['ref', 'clk', 'bip', 'rst', 'scan', 'channel', 'sgl'].map(el);
    return [];
  },
  addEventListener(type, listener) { (docListeners[type] ||= []).push(listener); },
  createTreeWalker() { return {nextNode: () => false}; }
};
document.documentElement.scrollHeight = 50000;
const memory = new Map();
const context = {document, console, NodeFilter: {SHOW_TEXT: 4}, window: {matchMedia: () => ({matches: false}), addEventListener() {}, scrollTo() {}, print() {}}, localStorage: {getItem: key => memory.get(key), setItem: (key, value) => memory.set(key, value)}, navigator: {}, innerHeight: 900, scrollY: 0, setTimeout: () => 1, requestAnimationFrame: callback => callback()};
vm.runInNewContext(fs.readFileSync(path.join(root, 'interazioni.js'), 'utf8'), context, {filename: 'interazioni.js'});
let assertions = 0;
function equal(actual, expected) { assert.equal(actual, expected); assertions++; }
function search(value, scope = 'all') { el('search-query').value = value; el('search-scope').value = scope; el('search-query').fire('input'); return el('search-results').querySelectorAll('a'); }
equal(document.documentElement.dataset.ready, 'true');
equal(el('setup-value').textContent, '0x82 · 130');
equal(el('config-value').textContent, '0x17 · 23');
equal(el('driver-temp').textContent, '42,85 °C');
equal(el('driver-volts').textContent, '1,650000 V');
equal(el('compare-volts').textContent, '1,024000 V');
el('ref').value = '5'; el('ref').fire('change'); equal(el('setup-value').textContent, '0xD2 · 210');
el('rst').value = '0'; el('rst').fire('change'); equal(el('setup-value').textContent, '0xD0 · 208');
el('scan').value = '3'; el('channel').value = '0'; el('channel').fire('change'); equal(el('config-value').textContent, '0x61 · 97');
el('channel').value = '5'; el('channel').fire('change'); equal(el('config-value').textContent, '0x6B · 107');
el('byte-reset').fire('click'); equal(el('setup-value').textContent, '0x82 · 130'); equal(el('config-value').textContent, '0x17 · 23');
el('raw-number').value = '0'; el('raw-number').fire('input'); equal(el('driver-temp').textContent, '-2,53 °C'); equal(el('raw-range').value, 0);
assert(el('range-note').textContent.includes('Fuori')); assertions++;
el('raw-range').value = '4095'; el('raw-range').fire('input'); equal(el('driver-temp').textContent, '85,58 °C'); equal(el('raw-number').value, 4095);
el('raw-number').value = '1024'; el('raw-number').fire('input'); equal(el('driver-temp').textContent, '23,51 °C');
openButton.fire('click'); equal(el('search-dialog').open, true); equal(document.activeElement, el('search-query'));
const rawSearch = search('read_all_sensors'); assert(rawSearch.length > 0); assertions++;
assert(rawSearch[0].getAttribute('href') || rawSearch[0].href); assertions++;
assert(rawSearch[0].textContent.includes('MAX116xx::read_all_sensors')); assertions++;
assert(rawSearch.some(result => result.querySelectorAll('mark').length)); assertions++;
equal(search('READ_ALL_SENSORS').length, rawSearch.length);
assert(search('configurazione ignorato').length > 0); assertions++;
equal(search('polarità').length, search('polarita').length);
const scopeResults = search('reset', 'config'); assert(scopeResults.length > 0); assertions++;
assert(scopeResults.every(result => /03 · Setup|04 · Configuration/.test(result.textContent))); assertions++;
equal(search('simbolo_inesistente_9zzz').length, 0);
equal(search('<img src=x onerror=alert(1)>').length, 0);
search(''); assert(el('search-results').querySelectorAll('button').length > 0); assertions++;
el('search-close').fire('click'); equal(el('search-dialog').open, false);
el('theme').fire('click'); equal(document.documentElement.dataset.theme, 'dark'); equal(memory.get('max1161x-theme'), 'dark');
console.log(JSON.stringify({status: 'passed', assertions, scope: 'DOM simulato: inizializzazione, ricerca e filtri, byte, conversioni, tema; nessuna resa grafica o API di sistema.'}));
