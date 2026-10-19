// data/ham/*.csv (Basketball-Reference takım maç kayıtları) → data/maclar.csv
//
// Çalıştırma:  node scripts/veriyi-olustur.js
//
// Yaptıkları:
// 1. 30 takımın maç kayıtlarını okur.
// 2. Her maçı iki takımın kaydında karşılaştırır (skor, üçlükler, sonuç).
// 3. Kaynaktan yeniden okunarak doğrulanmış düzeltmeleri uygular.
// 4. Her maçta tam bir galibin olduğunu kontrol eder.
// 5. Temiz veriyi data/maclar.csv olarak yazar.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const kok = join(dirname(fileURLToPath(import.meta.url)), '..');
const hamKlasor = join(kok, 'data', 'ham');

// İki takımın kaydında çelişen isabetli üçlük değerleri; Basketball-Reference'tan
// maç maç yeniden okunarak doğrulandı (15 Ekim 2026).
const DUZELTMELER = {
  'BRK|2026-03-20': 14, 'NYK|2026-03-20': 8,
  'CHI|2026-01-13': 12, 'HOU|2026-01-13': 7,
  'SAS|2026-03-05': 13, 'DET|2026-03-05': 12,
  'LAL|2026-02-26': 11, 'PHO|2026-02-26': 22,
};

function csvOku(dosya) {
  const [baslik, ...satirlar] = readFileSync(dosya, 'utf8').trim().split(/\r?\n/);
  const sutunlar = baslik.split(',');
  return satirlar.map((s) => Object.fromEntries(s.split(',').map((h, i) => [sutunlar[i], h])));
}

// 1. Oku
const kayit = new Map(); // "TAKIM|TARIH|RAKIP" → satır
const dosyalar = readdirSync(hamKlasor).filter((d) => d.endsWith('.csv')).sort();
for (const dosya of dosyalar) {
  const takim = dosya.slice(0, 3);
  for (const s of csvOku(join(hamKlasor, dosya))) {
    const rakip = s.Opp.replace('@', '').trim();
    kayit.set(`${takim}|${s.Date}|${rakip}`, { takim, rakip, tarih: s.Date, ...s });
  }
}
console.log(`${dosyalar.length} takım, ${kayit.size} takım-maçı okundu.`);

// 2. Çapraz kontrol
let uyumlu = 0;
const celiskiler = [];
for (const [anahtar, r] of kayit) {
  const karsi = kayit.get(`${r.rakip}|${r.tarih}|${r.takim}`);
  if (!karsi) throw new Error(`Eşi bulunamayan maç: ${anahtar}`);
  if (r.takim > r.rakip) continue; // her maçı bir kez kontrol et
  const ayni = r.Tm === karsi.OppPts && r.OppPts === karsi.Tm &&
    r['3P'] === karsi.Opp3P && r.Opp3P === karsi['3P'] && r['W/L'] !== karsi['W/L'];
  if (ayni) uyumlu++;
  else celiskiler.push(anahtar);
}
console.log(`Çapraz kontrol: ${uyumlu} maç uyumlu, ${celiskiler.length} maçta isabetli üçlük çelişkisi.`);
for (const c of celiskiler) {
  const [t, tarih] = c.split('|');
  if (!(`${t}|${tarih}` in DUZELTMELER)) throw new Error(`Doğrulanmamış çelişki: ${c}`);
}

// 3. Temiz satırlar
const ucluk = (takim, tarih, ham) => DUZELTMELER[`${takim}|${tarih}`] ?? Number(ham);
const temiz = [];
for (const r of kayit.values()) {
  const karsi = kayit.get(`${r.rakip}|${r.tarih}|${r.takim}`);
  temiz.push({
    team: r.takim,
    opp: r.rakip,
    date: r.tarih,
    w: r['W/L'] === 'W' ? 1 : 0,
    pts: Number(r.Tm),
    opts: Number(r.OppPts),
    fg3: ucluk(r.takim, r.tarih, r['3P']),
    fg3a: Number(r['3PA']),
    ofg3: ucluk(r.rakip, r.tarih, karsi['3P']),
    ofg3a: Number(karsi['3PA']),
  });
}
temiz.sort((a, b) => a.date.localeCompare(b.date) || a.team.localeCompare(b.team));

// 4. Her maçta bir galip
const maclar = new Map();
for (const s of temiz) {
  const k = `${s.date}|${[s.team, s.opp].sort().join('-')}`;
  maclar.set(k, (maclar.get(k) || 0) + s.w);
}
if (temiz.length !== 2460) throw new Error(`2460 satır bekleniyordu, ${temiz.length} bulundu.`);
for (const [k, g] of maclar) if (g !== 1) throw new Error(`Galip sayısı hatalı: ${k}`);
console.log(`${maclar.size} maçın her birinde tek galip var.`);

// 5. Yaz
const sutunlar = Object.keys(temiz[0]);
const metin = [sutunlar.join(','), ...temiz.map((s) => sutunlar.map((c) => s[c]).join(','))].join('\n') + '\n';
writeFileSync(join(kok, 'data', 'maclar.csv'), metin);
console.log('data/maclar.csv yazıldı.');
