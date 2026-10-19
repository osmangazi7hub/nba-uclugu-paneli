// Panelin gösterdiği ana sayıları kontrol eder.
// Çalıştırma:  node scripts/test.js
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import {
  maclariHazirla, ligOrtalamasi, esikIstatistigi, rakibeGore, esitMacSayisi, takimlaraGore,
} from '../js/analiz.js';

const kok = join(dirname(fileURLToPath(import.meta.url)), '..');
const [baslik, ...satirlar] = readFileSync(join(kok, 'data', 'maclar.csv'), 'utf8').trim().split('\n');
const sutunlar = baslik.split(',');
const maclar = maclariHazirla(satirlar.map((s) => Object.fromEntries(s.split(',').map((h, i) => [sutunlar[i], h]))));

const yuvarla = (x) => Math.round(x * 1000) / 10; // oran → bir ondalıklı yüzde

const testler = [
  ['2.460 takım-maçı var', () => assert.equal(maclar.length, 2460)],
  ['Lig ortalaması 13,3 üçlük', () => assert.equal(Math.round(ligOrtalamasi(maclar).isabet * 10) / 10, 13.3)],
  ['20+ üçlük: 158 maç, %81,0', () => {
    const r = esikIstatistigi(maclar, 20);
    assert.equal(r.mac, 158);
    assert.equal(r.galibiyet, 128);
    assert.equal(yuvarla(r.oran), 81.0);
  }],
  ['18+ üçlük: 342 maç, %73,7', () => {
    const r = esikIstatistigi(maclar, 18);
    assert.equal(r.mac, 342);
    assert.equal(yuvarla(r.oran), 73.7);
  }],
  ['Rakipten fazla %64,9, 5+ fazla %73,4, az %35,1', () => {
    const [bes, fazla, az] = rakibeGore(maclar);
    assert.equal(yuvarla(bes.oran), 73.4);
    assert.equal(yuvarla(fazla.oran), 64.9);
    assert.equal(yuvarla(az.oran), 35.1);
    assert.equal(fazla.mac, az.mac, 'fazla ve az grupları birbirinin ayna görüntüsü olmalı');
  }],
  ['Eşit üçlüklü 79 maç var', () => assert.equal(esitMacSayisi(maclar), 79)],
  ['Boston 20+ üçlüklü 16 maçın hepsini kazandı', () => {
    const bos = takimlaraGore(maclar, 20).find((t) => t.takim === 'BOS');
    assert.equal(bos.mac, 16);
    assert.equal(bos.galibiyet, 16);
  }],
];

let hata = 0;
for (const [ad, fn] of testler) {
  try {
    fn();
    console.log('✓', ad);
  } catch (e) {
    hata++;
    console.log('✗', ad, '—', e.message);
  }
}
console.log(hata ? `\n${hata} test başarısız.` : `\nTüm ${testler.length} test geçti.`);
process.exit(hata ? 1 : 0);
