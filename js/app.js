// Panelin ana dosyası: veriyi yükler, kontrolleri bağlar, her değişiklikte yeniden çizer.
import {
  maclariHazirla, ligOrtalamasi, esikIstatistigi, esikEgrisi, tamSayiDagilimi,
  rakibeGore, esitMacSayisi, takimlaraGore, orneklem,
} from './analiz.js';
import { tamSayi, yuzde, ondalik, puanFarki } from './bicim.js';
import { esikGrafigi, tamSayiGrafigi } from './grafikler.js';

const $ = (id) => document.getElementById(id);

// Seçili eşikler; adres çubuğunda da tutulur (ör. ?esik=18&kiyas=15), böylece link paylaşılabilir.
const adres = new URLSearchParams(location.search);
const sinirla = (v, varsayilan) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 8 && n <= 26 ? n : varsayilan;
};
const durum = {
  esik: sinirla(adres.get('esik'), 20),
  kiyas: sinirla(adres.get('kiyas'), 18),
};

let maclar = [];
let egri = [];
let dagilim = [];
let ortalama = null;

function durumuGuncelle(degisiklik) {
  Object.assign(durum, degisiklik);
  const p = new URLSearchParams({ esik: durum.esik, kiyas: durum.kiyas });
  history.replaceState(null, '', '?' + p.toString());
  ciz();
}

function tabloyuDoldur(tablo, satirlar, sutunlar) {
  const govde = tablo.querySelector('tbody');
  govde.replaceChildren();
  for (const s of satirlar) {
    const tr = document.createElement('tr');
    for (const sutun of sutunlar) {
      const td = document.createElement('td');
      if (sutun.sinif) td.className = sutun.sinif(s);
      td.textContent = sutun.metin(s);
      if (sutun.cubuk) {
        const c = document.createElement('span');
        c.className = 'cubuk';
        c.style.width = Math.round(sutun.cubuk(s) * 40) + 'px';
        td.appendChild(c);
      }
      tr.appendChild(td);
    }
    govde.appendChild(tr);
  }
}

function ozetYaz(A, B) {
  const oz = $('ozet');
  oz.replaceChildren();
  const kalin = (metin) => {
    const b = document.createElement('b');
    b.textContent = metin;
    return b;
  };
  oz.append(
    `2025-26 normal sezonunda bir maçta en az ${durum.esik} isabetli üçlük bulan takımlar `,
    kalin(tamSayi(A.mac)), ' maçın ', kalin(tamSayi(A.galibiyet)), ' tanesini kazandı — galibiyet oranı ',
    kalin(yuzde(A.oran)), `. Eşik ${durum.kiyas} olunca: `,
    kalin(tamSayi(B.mac)), ' maçta ', kalin(yuzde(B.oran)), '.',
  );
}

function ciz() {
  const { esik, kiyas } = durum;

  // Kontroller
  $('esik').value = esik;
  $('kiyas').value = kiyas;
  $('esik-deger').textContent = esik + '+';
  $('kiyas-deger').textContent = kiyas + '+';
  document.querySelectorAll('#hizli button').forEach((b) =>
    b.setAttribute('aria-pressed', String(Number(b.dataset.deger) === esik)));

  const A = esikIstatistigi(maclar, esik);
  const B = esikIstatistigi(maclar, kiyas);

  // Kutucuklar
  $('k1-etiket').textContent = `Galibiyet oranı · ${esik}+ üçlük`;
  $('k1').textContent = yuzde(A.oran);
  $('k1-alt').textContent = `${tamSayi(A.galibiyet)} G · ${tamSayi(A.maglubiyet)} M`;
  $('k2-etiket').textContent = `Karşılaştırma · ${kiyas}+ üçlük`;
  $('k2').textContent = yuzde(B.oran);
  $('k2-alt').textContent = `${tamSayi(B.mac)} maç`;
  $('k3').textContent = A.oran != null && B.oran != null ? puanFarki((A.oran - B.oran) * 100) : '—';
  $('k3-alt').textContent = `${esik}+ ile ${kiyas}+ arası`;
  $('k4').textContent = tamSayi(A.mac);
  $('k4-alt').textContent = `${tamSayi(maclar.length)} takım-maçının ${yuzde(A.pay)}'i`;
  $('k5').textContent = ondalik(ortalama.isabet);
  const fark = esik - ortalama.isabet;
  $('k5-alt').textContent = `${ondalik(ortalama.deneme)} denemede · ${esik}+ eşiği ortalamanın ${ondalik(Math.abs(fark))} ${fark >= 0 ? 'üstünde' : 'altında'}`;

  ozetYaz(A, B);

  // Grafikler
  esikGrafigi($('grafik-esik'), egri, {
    esik, kiyas, ortalama: ortalama.isabet,
    esikSec: (k) => durumuGuncelle({ esik: k }),
  });
  tamSayiGrafigi($('grafik-tam'), dagilim, { esik, ortalama: ortalama.isabet });

  // Tablolar
  tabloyuDoldur($('tablo-rakip'), rakibeGore(maclar), [
    { metin: (r) => r.durum },
    { metin: (r) => tamSayi(r.mac), sinif: () => 'sayi' },
    { metin: (r) => tamSayi(r.galibiyet), sinif: () => 'sayi' },
    { metin: (r) => yuzde(r.oran), sinif: () => 'sayi', cubuk: (r) => r.oran },
  ]);

  $('takim-baslik').textContent = `Takım takım · ${esik}+ üçlük`;
  tabloyuDoldur($('tablo-takim'), takimlaraGore(maclar, esik), [
    { metin: (r) => r.takim },
    { metin: (r) => tamSayi(r.mac), sinif: () => 'sayi' },
    { metin: (r) => tamSayi(r.galibiyet), sinif: () => 'sayi' },
    { metin: (r) => yuzde(r.oran), sinif: () => 'sayi', cubuk: (r) => r.oran },
  ]);

  const ornek = orneklem(maclar, esik);
  $('orneklem-baslik').textContent = `Örneklem: ${esik}+ üçlük atılan ${tamSayi(ornek.length)} maç`;
  tabloyuDoldur($('tablo-orneklem'), ornek, [
    { metin: (m) => m.tarih },
    { metin: (m) => m.takim },
    { metin: (m) => m.rakip },
    { metin: (m) => String(m.uclukIsabet), sinif: () => 'sayi' },
    { metin: (m) => String(m.rakipUclukIsabet), sinif: () => 'sayi' },
    { metin: (m) => `${m.sayi}-${m.rakipSayi}`, sinif: () => 'sayi' },
    { metin: (m) => (m.galibiyet ? 'G' : 'M'), sinif: (m) => (m.galibiyet ? 'galibiyet' : 'maglubiyet') },
  ]);
}

function kontrolleriBagla() {
  $('esik').addEventListener('input', (o) => durumuGuncelle({ esik: Number(o.target.value) }));
  $('kiyas').addEventListener('input', (o) => durumuGuncelle({ kiyas: Number(o.target.value) }));
  const hizli = $('hizli');
  for (const v of [15, 18, 20, 22]) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = v + '+';
    b.dataset.deger = v;
    b.addEventListener('click', () => durumuGuncelle({ esik: v }));
    hizli.appendChild(b);
  }

  // Ekran genişliği değişince (telefon döndürülünce) grafikleri yeniden çiz.
  let genislik = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth === genislik) return;
    genislik = window.innerWidth;
    ciz();
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ciz);
}

async function basla() {
  try {
    const satirlar = await d3.csv('data/maclar.csv');
    maclar = maclariHazirla(satirlar);
    egri = esikEgrisi(maclar);
    dagilim = tamSayiDagilimi(maclar);
    ortalama = ligOrtalamasi(maclar);
    console.info(`${maclar.length} takım-maçı yüklendi; eşit üçlüklü ${esitMacSayisi(maclar)} maç rakip tablosunda gösterilmiyor.`);
    kontrolleriBagla();
    ciz();
  } catch (hata) {
    const oz = $('ozet');
    oz.className = 'ozet hata';
    oz.textContent = 'Veriler yüklenemedi. Sayfayı bir web sunucusu üzerinden açtığından emin ol (README\'deki "Bilgisayarda çalıştırma" bölümüne bak).';
    console.error(hata);
  }
}

basla();
