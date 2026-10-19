// Sayıları Türkçe biçimde yazar: 1.230 · %81,0 · +7,3

const tamSayiBicimi = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 });

export const tamSayi = (n) => tamSayiBicimi.format(n);

export const yuzde = (oran) =>
  oran == null || Number.isNaN(oran) ? '—' : '%' + (oran * 100).toFixed(1).replace('.', ',');

export const ondalik = (v) => v.toFixed(1).replace('.', ',');

export const puanFarki = (v) =>
  (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v).toFixed(1).replace('.', ',');
