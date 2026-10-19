// Hesaplamalar: veriyi alır, panelin gösterdiği sayıları üretir.
// Hiçbir şey çizmez; bu yüzden tarayıcıda da Node'da da çalışır.

/** CSV'den gelen metin hücrelerini sayıya çevirir. */
export function maclariHazirla(satirlar) {
  return satirlar.map((s) => ({
    takim: s.team,
    rakip: s.opp,
    tarih: s.date,
    galibiyet: Number(s.w),
    sayi: Number(s.pts),
    rakipSayi: Number(s.opts),
    uclukIsabet: Number(s.fg3),
    uclukDeneme: Number(s.fg3a),
    rakipUclukIsabet: Number(s.ofg3),
    rakipUclukDeneme: Number(s.ofg3a),
  }));
}

/** Lig ortalaması: maç başına isabetli ve denenen üçlük. */
export function ligOrtalamasi(maclar) {
  const n = maclar.length;
  return {
    isabet: maclar.reduce((t, m) => t + m.uclukIsabet, 0) / n,
    deneme: maclar.reduce((t, m) => t + m.uclukDeneme, 0) / n,
    macSayisi: n,
  };
}

/** Bir eşik için: en az k üçlük atılan maçların sayısı, G-M ve galibiyet oranı. */
export function esikIstatistigi(maclar, k) {
  const secilen = maclar.filter((m) => m.uclukIsabet >= k);
  const galibiyet = secilen.filter((m) => m.galibiyet === 1).length;
  return {
    esik: k,
    mac: secilen.length,
    galibiyet,
    maglubiyet: secilen.length - galibiyet,
    oran: secilen.length ? galibiyet / secilen.length : null,
    pay: secilen.length / maclar.length,
  };
}

/** Eşik eğrisi: k = enAz..enCok için esikIstatistigi. */
export function esikEgrisi(maclar, enAz = 8, enCok = 26) {
  const sonuc = [];
  for (let k = enAz; k <= enCok; k++) sonuc.push(esikIstatistigi(maclar, k));
  return sonuc;
}

/** Tam olarak her üçlük sayısı için maç ve galibiyet oranı. */
export function tamSayiDagilimi(maclar) {
  const harita = new Map();
  for (const m of maclar) {
    const e = harita.get(m.uclukIsabet) || { uclukIsabet: m.uclukIsabet, mac: 0, galibiyet: 0 };
    e.mac += 1;
    e.galibiyet += m.galibiyet;
    harita.set(m.uclukIsabet, e);
  }
  return [...harita.values()]
    .sort((a, b) => a.uclukIsabet - b.uclukIsabet)
    .map((e) => ({ ...e, oran: e.galibiyet / e.mac }));
}

/**
 * Rakibe göre üçlük. Eşit üçlüklü maçlar bilerek dışarıda bırakılır:
 * her maç iki satır olduğu için o grupta oran tanım gereği hep %50 çıkar.
 */
export function rakibeGore(maclar) {
  const gruplar = [
    { durum: 'Rakipten 5+ fazla', kosul: (f) => f >= 5 },
    { durum: 'Rakipten fazla', kosul: (f) => f > 0 },
    { durum: 'Rakipten az', kosul: (f) => f < 0 },
  ];
  return gruplar.map(({ durum, kosul }) => {
    const secilen = maclar.filter((m) => kosul(m.uclukIsabet - m.rakipUclukIsabet));
    const galibiyet = secilen.filter((m) => m.galibiyet === 1).length;
    return { durum, mac: secilen.length, galibiyet, oran: galibiyet / secilen.length };
  });
}

/** Eşit üçlük atılan gerçek maç sayısı (her maç veride iki satır). */
export function esitMacSayisi(maclar) {
  return maclar.filter((m) => m.uclukIsabet === m.rakipUclukIsabet).length / 2;
}

/** Takım takım: en az k üçlük attıkları maçlar. */
export function takimlaraGore(maclar, k) {
  const harita = new Map();
  for (const m of maclar) {
    if (m.uclukIsabet < k) continue;
    const e = harita.get(m.takim) || { takim: m.takim, mac: 0, galibiyet: 0 };
    e.mac += 1;
    e.galibiyet += m.galibiyet;
    harita.set(m.takim, e);
  }
  return [...harita.values()]
    .map((e) => ({ ...e, oran: e.galibiyet / e.mac }))
    .sort((a, b) => b.mac - a.mac || b.oran - a.oran);
}

/** Örneklem: eşiğe ulaşan maçlar, en çok üçlükten aza. */
export function orneklem(maclar, k) {
  return maclar
    .filter((m) => m.uclukIsabet >= k)
    .sort((a, b) => b.uclukIsabet - a.uclukIsabet || a.tarih.localeCompare(b.tarih));
}
