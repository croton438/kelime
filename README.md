# Kelime Oyunu

Next.js ve Convex tabanlı Türkçe kelime yarışması. Tek Oyunculu mod tarayıcıda doğrudan oynanabilir; lobiler **2–5 oyuncu** destekler. Oyuncu adı tarayıcıda korunur, tamamlanan oyunlar lider tablosuna kaydedilir.

## Özellikler

- 4–10 harf aralığında 530 doğal soru
- 15 saniyelik cevap modu ve birden fazla tahmin
- Türkçe locale ve Unicode normalizasyonu
- Levenshtein tabanlı “1/2 harf yanlış” geri bildirimi
- Harf açma ve her harfte 100 puan düşürme
- İsim bazlı kalıcı lider tablosu
- 2–5 kişilik, herkesin aynı anda yarıştığı tek online format
- `/admin/questions` soru yönetimi ekranı
- Yetkili, sunucu tarafı TDK sorgusu

## Yerel kurulum

1. Node.js 20+ kurun.
2. `npm install` çalıştırın.
3. `.env.example` dosyasını `.env.local` olarak kopyalayın.
4. `npx convex dev` ile Convex projesini bağlayın.
5. Ayrı terminalde `npm run dev` çalıştırın.

Convex kurulmadan Tek Oyunculu mod ve cihazdaki lider tablosu çalışır. Gerçek zamanlı cihazlar arası lobi ve global liderlik için Convex projesi bağlanmalıdır.

## Multiplayer yayınlama

Gerekenler: ücretsiz bir Convex hesabı, Vercel hesabı ve tercihen GitHub reposu.

1. Proje klasöründe `npx convex dev` çalıştırın ve Convex hesabınızla giriş yapın.
2. Komutun oluşturduğu `NEXT_PUBLIC_CONVEX_URL` ve `CONVEX_DEPLOYMENT` değerlerini `.env.local` içinde tutun.
3. Convex Dashboard içindeki Environment Variables bölümüne güçlü bir `ADMIN_PASSWORD` ekleyin.
4. Projeyi GitHub'a gönderip Vercel'de **New Project** ile içe aktarın.
5. Convex Dashboard'da production deployment için bir deploy key üretin.
6. Vercel Environment Variables alanına `CONVEX_DEPLOY_KEY` adıyla bu anahtarı yalnızca Production ortamı için ekleyin.
7. Vercel Build Command değerini `npx convex deploy --cmd 'npm run build'` yapın.
8. Deploy alın. Convex backend ve Next.js arayüzü birlikte yayınlanır.
9. Vercel'in verdiği `https://...vercel.app` adresini iki farklı telefon/tarayıcıdan açarak gerçek oda kodu akışını kontrol edin.

Convex; veritabanı, mutation/action fonksiyonları ve WebSocket tabanlı canlı güncellemeleri barındırır. Vercel yalnızca Next.js arayüzünü yayınlar. Ayrı VPS, Docker veya PostgreSQL gerekmez. Özel alan adı isteğe bağlıdır.

Online odada hazır verme ve mod seçimi yoktur. İkinci oyuncu girdikten sonra yönetici yarışmayı doğrudan başlatır. Herkes aynı 14 soruyu eş zamanlı çözer. Canlı oyuncu panelinde yalnızca ad, sıra, soru numarası, puan, süre ve bağlantı durumu paylaşılmalıdır. Cevap, kabul edilen cevaplar ve açılan kişisel harfler rakiplere gönderilmemelidir.

Her online oda belirsiz karakterleri kullanmayan rastgele bir 6 karakterli kod üretir. Davet bağlantısı `https://site-adresi/?oda=ABC123` biçimindedir. Bağlantıyı açan kişinin katılım ekranında oda kodu otomatik doldurulur.

Online maçlarda oda kodundan ortak ve deterministik bir `questionSeed` oluşturulur. Bu değer oyun kaydında saklanır; bütün oyuncular aynı 14 soruyu, aynı varyantlarla ve aynı sırada alır. Seçim sırasında cevaplar tekilleştirildiğinden aynı kelime bir maçta iki kez gelmez.

## Kontroller

```bash
npm test
npm run typecheck
npm run build
```

Ana sayfa: `http://localhost:3000`  
Yönetici soruları: `http://localhost:3000/admin/questions`

## Lobi kapasitesi

Tek doğruluk kaynağı `MAX_PLAYERS = 5` kuralıdır. İstemci 5 koltuk gösterir, ancak kapasite güvenliği `convex/lobbies.ts` içindeki `join` mutation'ında uygulanır. Altıncı katılım backend tarafından reddedilir. Oyun 2, 3, 4 veya 5 bağlı oyuncu ile ve herkes hazırsa başlatılabilir.

## Vercel

Convex production deployment oluşturun, `NEXT_PUBLIC_CONVEX_URL` değerini Vercel ortam değişkenlerine ekleyin ve repoyu Vercel'e bağlayın. Convex backend'i `npx convex deploy` ile yayınlayın.
