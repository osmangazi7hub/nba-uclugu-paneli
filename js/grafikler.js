// Grafikler: d3 (global `d3`, js/vendor/d3.min.js) ile çizilir.
import { yuzde, tamSayi, ondalik } from './bicim.js';

const renk = (ad) => getComputedStyle(document.documentElement).getPropertyValue(ad).trim();

function ipucu(kutu) {
  let el = kutu.querySelector('.ipucu');
  if (!el) {
    el = document.createElement('div');
    el.className = 'ipucu';
    kutu.appendChild(el);
  }
  return {
    goster(olay, baslik, satir) {
      el.replaceChildren();
      const b = document.createElement('div');
      b.className = 'ipucu-baslik';
      b.textContent = baslik;
      const s = document.createElement('div');
      s.textContent = satir;
      el.append(b, s);
      el.style.display = 'block';
      const r = kutu.getBoundingClientRect();
      let x = olay.clientX - r.left + 12;
      const y = olay.clientY - r.top - 10;
      if (x + el.offsetWidth > r.width) x = olay.clientX - r.left - el.offsetWidth - 12;
      el.style.left = Math.max(0, x) + 'px';
      el.style.top = Math.max(0, y) + 'px';
    },
    gizle() { el.style.display = 'none'; },
  };
}

function ekseniSadelestir(g) {
  g.attr('font-size', null).attr('font-family', null).attr('class', 'eksen');
  g.select('.domain').remove();
}

function yeniSvg(kutu, G, Y) {
  kutu.querySelectorAll('svg').forEach((s) => s.remove());
  return d3.select(kutu).insert('svg', ':first-child')
    .attr('width', '100%').attr('height', Y).attr('viewBox', `0 0 ${G} ${Y}`);
}

/** Lig ortalaması için kesikli dikey çizgi ve etiket. */
function ortalamaCizgisi(svg, x, Y, k, G, ortalama) {
  const g = svg.append('g');
  g.append('line').attr('x1', x).attr('x2', x).attr('y1', k.ust).attr('y2', Y - k.alt)
    .attr('stroke', renk('--metin-soluk')).attr('stroke-dasharray', '3 3').attr('stroke-width', 1.5);
  const t = g.append('text').attr('x', x + 5).attr('y', k.ust + 10)
    .attr('fill', renk('--metin-soluk')).style('font-size', '.75rem')
    .text('Lig ort. ' + ondalik(ortalama));
  if (x + 5 + t.node().getComputedTextLength() > G) t.attr('text-anchor', 'end').attr('x', x - 5);
}

/** "En az k üçlük" eğrisi. Noktaya dokunmak eşiği değiştirir. */
export function esikGrafigi(kutu, egri, { esik, kiyas, ortalama, esikSec }) {
  const satirlar = egri.filter((r) => r.mac >= 5);
  const G = Math.max(280, kutu.clientWidth);
  const Y = 260;
  const k = { ust: 14, sag: 14, alt: 30, sol: 44 };
  const x = d3.scaleLinear([8, 26], [k.sol, G - k.sag]);
  const y = d3.scaleLinear([0.4, 1], [Y - k.alt, k.ust]);
  const svg = yeniSvg(kutu, G, Y);
  const vurgu = renk('--vurgu');
  const vurgu2 = renk('--vurgu-2');

  svg.append('g').selectAll('line').data([0.5, 0.6, 0.7, 0.8, 0.9, 1]).join('line')
    .attr('x1', k.sol).attr('x2', G - k.sag).attr('y1', y).attr('y2', y).attr('stroke', renk('--izgara'));
  svg.append('g').attr('transform', `translate(${k.sol},0)`)
    .call(d3.axisLeft(y).tickValues([0.5, 0.6, 0.7, 0.8, 0.9, 1]).tickFormat((v) => '%' + Math.round(v * 100)).tickSize(0).tickPadding(8))
    .call(ekseniSadelestir);
  svg.append('g').attr('transform', `translate(0,${Y - k.alt})`)
    .call(d3.axisBottom(x).ticks(G < 420 ? 5 : 10).tickFormat((v) => v + '+').tickSize(4))
    .call(ekseniSadelestir);

  ortalamaCizgisi(svg, x(ortalama), Y, k, G, ortalama);

  svg.append('path').datum(satirlar)
    .attr('fill', 'none').attr('stroke', vurgu).attr('stroke-width', 2)
    .attr('stroke-linejoin', 'round').attr('stroke-linecap', 'round')
    .attr('d', d3.line((d) => x(d.esik), (d) => y(d.oran)));

  const ip = ipucu(kutu);
  svg.append('g').selectAll('circle').data(satirlar).join('circle')
    .attr('cx', (d) => x(d.esik)).attr('cy', (d) => y(d.oran))
    .attr('r', (d) => (d.esik === esik || d.esik === kiyas ? 6 : 3.5))
    .attr('fill', (d) => (d.esik === esik ? vurgu : d.esik === kiyas ? vurgu2 : renk('--kart')))
    .attr('stroke', (d) => (d.esik === kiyas && d.esik !== esik ? vurgu2 : vurgu)).attr('stroke-width', 2)
    .style('cursor', 'pointer')
    .on('mousemove', (o, d) => ip.goster(o, `${d.esik} ve üzeri üçlük`, `${yuzde(d.oran)} · ${tamSayi(d.mac)} maç (${d.galibiyet}G–${d.maglubiyet}M)`))
    .on('mouseleave', () => ip.gizle())
    .on('click', (o, d) => esikSec(d.esik));

  for (const [deger, r, ust] of [[esik, vurgu, true], [kiyas, vurgu2, false]]) {
    const d = satirlar.find((s) => s.esik === deger);
    if (!d || (!ust && esik === kiyas)) continue;
    const t = svg.append('text').attr('x', x(deger)).attr('y', y(d.oran) + (ust ? -12 : 20))
      .attr('text-anchor', 'middle').attr('fill', r).style('font-size', '.75rem').style('font-weight', 600)
      .text(yuzde(d.oran));
    const uzunluk = t.node().getComputedTextLength();
    if (x(deger) + uzunluk / 2 > G) t.attr('text-anchor', 'end').attr('x', G);
    else if (x(deger) - uzunluk / 2 < k.sol) t.attr('text-anchor', 'start').attr('x', k.sol);
  }
}

/** Tam olarak n üçlük atılan maçlarda galibiyet oranı (çubuk grafik). */
export function tamSayiGrafigi(kutu, dagilim, { esik, ortalama }) {
  const G = Math.max(280, kutu.clientWidth);
  const Y = 260;
  const k = { ust: 14, sag: 8, alt: 30, sol: 44 };
  const x = d3.scaleBand(dagilim.map((r) => r.uclukIsabet), [k.sol, G - k.sag]).padding(0.18);
  const y = d3.scaleLinear([0, 1], [Y - k.alt, k.ust]);
  const svg = yeniSvg(kutu, G, Y);
  const vurgu = renk('--vurgu');

  svg.append('g').selectAll('line').data([0.25, 0.5, 0.75, 1]).join('line')
    .attr('x1', k.sol).attr('x2', G - k.sag).attr('y1', y).attr('y2', y).attr('stroke', renk('--izgara'));
  svg.append('g').attr('transform', `translate(${k.sol},0)`)
    .call(d3.axisLeft(y).tickValues([0, 0.25, 0.5, 0.75, 1]).tickFormat((v) => '%' + Math.round(v * 100)).tickSize(0).tickPadding(8))
    .call(ekseniSadelestir);
  const aralik = G < 420 ? 5 : 2;
  svg.append('g').attr('transform', `translate(0,${Y - k.alt})`)
    .call(d3.axisBottom(x).tickValues(dagilim.map((r) => r.uclukIsabet).filter((v) => v % aralik === 0)).tickSize(0).tickPadding(6))
    .call(ekseniSadelestir);

  const ip = ipucu(kutu);
  svg.append('g').selectAll('rect').data(dagilim).join('rect')
    .attr('x', (d) => x(d.uclukIsabet)).attr('width', x.bandwidth())
    .attr('y', (d) => y(d.oran)).attr('height', (d) => Math.max(1, y(0) - y(d.oran))).attr('rx', 3)
    .attr('fill', (d) => (d.uclukIsabet >= esik ? vurgu : renk('--soluk-cubuk')))
    .attr('opacity', (d) => (d.mac < 10 ? 0.45 : 1))
    .on('mousemove', (o, d) => ip.goster(o, `Tam ${d.uclukIsabet} üçlük`, `${yuzde(d.oran)} · ${tamSayi(d.mac)} maç (${d.galibiyet}G–${d.mac - d.galibiyet}M)`))
    .on('mouseleave', () => ip.gizle());

  svg.append('line').attr('x1', k.sol).attr('x2', G - k.sag).attr('y1', y(0.5)).attr('y2', y(0.5))
    .attr('stroke', renk('--referans')).attr('stroke-dasharray', '4 4');

  const taban = Math.floor(ortalama);
  if (x(taban) != null) {
    ortalamaCizgisi(svg, x(taban) + x.bandwidth() / 2 + (ortalama - taban) * x.step(), Y, k, G, ortalama);
  }
  if (x(esik) != null) {
    const xe = x(esik) - (x.step() * x.padding()) / 2;
    svg.append('line').attr('x1', xe).attr('x2', xe).attr('y1', k.ust).attr('y2', Y - k.alt)
      .attr('stroke', vurgu).attr('stroke-width', 1.5);
  }
}
