# Ambulans Egitim Takip Sistemi (PWA)

Acil durum personeli icin YouTube egitim videolarinin izlenme durumunu
takip eden, %90 tamamlama esigiyle calisan ve PWA olarak telefona
yuklenebilen egitim takip sistemi.

## Mimari

```
ambulans-egitim/
├── backend/   -> Express + TypeScript + Prisma + PostgreSQL (REST API)
└── frontend/  -> React + TypeScript + Vite + Tailwind + PWA
```

## Kurulum

### 0. On Kosul
- Node.js 18+
- PostgreSQL (lokal kurulu ya da Docker ile)

PostgreSQL'i Docker ile hizlica calistirmak icin:
```bash
docker run --name ambulans-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ambulans_egitim -p 5432:5432 -d postgres:16
```

### 1. Backend Kurulumu

```bash
cd backend
npm install
cp .env.example .env
# .env icindeki DATABASE_URL, JWT_SECRET vb. degerleri kontrol et/duzenle

npx prisma migrate dev --name init   # veritabani tablolarini olusturur
npm run seed                          # ilk admin hesabini ve placeholder videolari ekler
npm run dev                           # http://localhost:4000
```

Seed sonrasi varsayilan admin girisi (degistirmek icin .env'i duzenleyin):
- E-posta: `admin@example.com`
- Sifre: `Admin123!`

### 2. Frontend Kurulumu

```bash
cd frontend
npm install
npm run dev    # http://localhost:5173
```

Vite dev sunucusu `/api` isteklerini otomatik olarak backend'e (4000 portu)
yonlendirir (bkz. `vite.config.ts` proxy ayari).

### 3. Kullanim Akisi

1. `/register` sayfasindan standart bir personel hesabi olusturun.
2. Admin (`admin@example.com`) ile giris yapip `/admin` panelinden:
   - Yeni egitim videosu ekleyin (gercek YouTube video ID'si girerek
     - placeholder olarak `dQw4w9WgXcQ` kullanildi, gercek egitim
       videolarinizin ID'leriyle degistirin).
   - Olusturdugunuz personel hesabina bu videoyu atayin
     (`POST /api/admin/assignments` - su an icin Postman/curl ile,
     admin UI'ya video-atama formu eklemek bir sonraki adim olabilir).
3. Personel hesabiyla giris yapip ana sayfada atanan videoyu izleyin.
   Video oynatilirken her ~7 saniyede saniye bilgisi kaydedilir;
   sayfadan cikip geri girdiginizde kaldiginiz yerden devam eder.
4. Video suresinin %90'ini izlediginizde otomatik "Tamamlandi" olur
   (bu hesaplama GUVENLIK nedeniyle backend'de yapilir, bkz. `backend/src/routes/progress.ts`).
5. Admin panelindeki rapor tablosunda tum personelin izleme durumunu
   gorebilirsiniz.

### 4. PWA Olarak Telefona Yukleme

`npm run build` ile production build alindiginda `vite-plugin-pwa`
otomatik olarak `manifest.json` ve service worker dosyalarini uretir.
Mobil tarayicida siteyi actiktan sonra "Ana ekrana ekle" secenegi
otomatik cikar (Android Chrome) ya da Safari'de Paylas > Ana Ekrana Ekle
ile eklenebilir (iOS).

Gelistirme ortaminda da PWA test edilebilir cunku `devOptions.enabled: true`
ayarlanmistir (`vite.config.ts`).

## Onemli Tasarim Kararlari

- **%90 tamamlama hesaplamasi backend'de yapilir.** Frontend sadece
  `currentTime` ve `duration` degerlerini gonderir; `isCompleted` ve
  `watchedPercentage` degerlerini sunucu hesaplar. Bu, istemci tarafi
  manipulasyonla sahte "tamamlandi" isaretlemesini onler.
- **Tamamlanma geri alinmaz**: Kullanici videoyu geri sarsa bile,
  bir kere %90 esigini gectiyse `isCompleted` true kalir.
- **Periyodik kayit + olay bazli kayit**: Video oynarken her 7 saniyede
  bir kayit yapilir; ayrica video durduruldugunda, bittiginde ve sekme
  kapatilirken/arka plana alinirken (`visibilitychange`) ek kayit atilir.
- **YouTube video stream'i service worker tarafindan cache'lenmez** -
  sadece uygulama kabugu (HTML/CSS/JS) offline calisabilir hale getirilir.

## Sonraki Adimlar (Onerilen)

- Admin panelinde video ekleme/atama icin tam UI formu (su an API hazir,
  frontend formu eklenebilir).
- Video atama ekraninda checkbox'lu coklu kullanici secimi.
- E-posta dogrulama / sifre sifirlama akisi.
- Push notification (PWA) ile "yeni egitim atandi" bildirimi.
