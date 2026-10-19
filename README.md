# NBA 2025-26 · Üçlük ve galibiyet

Bir takım bir maçta çok üçlük atarsa maçı kazanır mı? Bu proje, NBA 2025-26 normal sezonunun 1.230 maçını kullanarak isabetli üçlük sayısı ile galibiyet arasındaki ilişkiyi inceliyor ve sonuçları etkileşimli bir panelde gösteriyor.

**Canlı panel:** https://osmangazi7hub.github.io/nba-uclugu-paneli/

Paneldeki kaydırıcılarla eşiği değiştirebilir (ör. "en az 18 üçlük"), iki eşiği karşılaştırabilir, grafiklerde bir noktaya dokunarak eşik seçebilirsin. Seçtiğin eşik adres çubuğuna da yazılır; o anki görünümü linkle paylaşabilirsin (ör. `?esik=18&kiyas=15`).

## Ana bulgular

| | Maç | Galibiyet oranı |
|---|---:|---:|
| Lig ortalaması | maç başına 13,3 isabetli üçlük (37,0 deneme) | |
| En az 18 üçlük | 342 | %73,7 |
| En az 20 üçlük | 158 | %81,0 |
| Rakipten fazla üçlük | 1.151 | %64,9 |
| Rakipten 5+ fazla üçlük | 515 | %73,4 |

- Eşik yükseldikçe galibiyet oranı düzenli olarak artıyor. Ancak 22 ve üstünde maç sayısı çok azaldığı için oranlar oynaklaşıyor.
- Üçlük sayısının kendisi kadar rakiple aradaki fark da belirleyici.
- İki takımın eşit üçlük attığı 79 maç rakip karşılaştırmasında gösterilmiyor. Veride her maç iki satır (her takımın gözünden bir satır) olduğu için o grupta oran tanım gereği hep %50 çıkar; bu bir bulgu değildir.
- Bu oranlar bir ilişkiyi gösterir, nedensellik iddiası taşımaz.

## Klasör yapısı

```
index.html                 Panel sayfası
css/style.css              Görünüm (açık/koyu tema)
js/app.js                  Veriyi yükler, kontrolleri bağlar, her şeyi çizer
js/analiz.js               Hesaplamalar (çizimden bağımsız, Node'da da çalışır)
js/grafikler.js            d3 ile çizilen iki grafik
js/bicim.js                Türkçe sayı biçimleri (1.230 · %81,0)
js/vendor/d3.min.js        d3 v7.9.0 (grafik kütüphanesi)
data/maclar.csv            Temiz veri: 2.460 satır, her maç iki takımın gözünden
data/ham/*.csv             30 takımın ham maç kayıtları
scripts/veriyi-olustur.js  Ham veriden temiz veriyi üretir ve doğrular
scripts/test.js            Paneldeki ana sayıları kontrol eder
```

`data/maclar.csv` sütunları: `team`, `opp` (rakip), `date`, `w` (1 = galibiyet), `pts`, `opts` (rakip sayısı), `fg3` / `fg3a` (isabetli / denenen üçlük), `ofg3` / `ofg3a` (rakibin isabetli / denenen üçlüğü).

## Bilgisayarda çalıştırma

Sayfa veriyi `fetch` ile yüklediği için `index.html` dosyasına çift tıklamak yetmez; küçük bir yerel sunucu gerekir. Proje klasöründe şunlardan birini çalıştır:

```bash
npx serve .            # Node.js yüklüyse
python3 -m http.server # Python yüklüyse
```

Sonra tarayıcıda gösterilen adresi aç (ör. http://localhost:3000 veya http://localhost:8000).

## Veriyi yeniden oluşturma ve testler

Node.js 18 veya üstü gerekir; başka bir paket kurmaya gerek yok.

```bash
npm run veri   # data/ham → data/maclar.csv
npm test       # ana sayıların doğruluğunu kontrol eder
```

## Veri kaynağı ve yöntem

- **Kaynak:** [Basketball-Reference](https://www.basketball-reference.com/) takım maç kayıtları (2025-26 normal sezonu, 30 takım). Veriler 15 Ekim 2026'da toplandı.
- **Doğrulama:** Her maç, iki takımın kendi kaydında karşılaştırıldı (skor, isabetli üçlükler, sonuç). İsabetli üçlükte çelişen 4 maç kaynaktan maç maç yeniden okunup düzeltildi; düzeltmeler `scripts/veriyi-olustur.js` içinde listeleniyor. Her maçta tam bir galip olduğu da kontrol edildi.
- **Kapsam:** Sadece normal sezon; playoff maçları dahil değil.

## Lisans

Kod MIT lisansıyla paylaşılır (bkz. `LICENSE`). Veriler Basketball-Reference'a aittir; kaynak gösterilerek kullanılmıştır. d3, ISC lisansı ile dağıtılır.
