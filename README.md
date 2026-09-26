# Designer Portfolio

Grafik dizayner uchun portfolio sayt va to'liq boshqariladigan admin panel.

**Stek:** Next.js 16 (App Router) · TypeScript · PostgreSQL + Drizzle · Tailwind CSS 4 · Motion · Lenis · sharp · Cloudflare R2

## Ishga tushirish

```bash
npm install
cp .env.example .env          # qiymatlarni to'ldiring (AUTH_SECRET, DATABASE_URL…)
npm run db:migrate            # jadvallarni yaratadi
npm run db:seed               # admin, standart sozlamalar, About sahifasi
npm run dev                   # http://localhost:3000  ·  admin: /admin
```

Production: `npm run build && npm start`.

Telefon ko'rinishini tekshirish (dev server ishlab turganda): `npm run audit:mobile` — har bir sahifa telefon o'lchamida ochiladi, gorizontal scroll bor-yo'qligi tekshiriladi va `audit/` papkasiga skrinshot yoziladi.

## Asosiy imkoniyatlar

| Sayt | Admin panel (`/admin`) |
|---|---|
| Hero: vizitka (rasm + ma'lumot ustunlari) yoki minimal sarlavha | Hero: ko'rinish, rasm, ism, kasbi, ustunlar, fon ranglari |
| Tanlangan loyihalar (N ta) + "Hammasini ko'rish" | Loyihalar: blok muharriri, muqova, tartib (drag), tanlangan/chop etilgan |
| Loyiha sahifasi: bloklar, lightbox, "Keyingi loyiha" | Hamkorlar: logo, havola, marquee tezligi / soni / yo'nalishi |
| Hamkorlar marquee (sof CSS) + barcha hamkorlar sahifasi | About: dumaloq profil rasmi + erkin bloklar |
| Bog'lanish formasi → admin inbox + email + Telegram | "Ko'proq" menyusi uchun sahifalar |
| UZ / RU / EN (avtomatik tarjima), dark / light | Ijtimoiy tarmoqlar, Xabarlar, Sozlamalar |
| Tepaga chiqish, silliq scroll, "View" kursori | **Dizayn:** ranglar, shriftlar, radius, presetlar, kontrast tekshiruvi |

**Kontent bloklari:** Matn · Sarlavha · Rasm · Galereya · Video (≤10 s) · YouTube · Oldin/Keyin · Ranglar palitrasi · Ma'lumot jadvali · Iqtibos · Ajratgich

## Rasm sifati va tezlik

Har bir yuklangan rasm bir marta qayta ishlanadi (`src/lib/media/process-image.ts`):

- EXIF bo'yicha to'g'ri aylantiriladi, **sRGB'ga o'tkaziladi** (CMYK / Adobe RGB ranglari buzilmaydi);
- 640 → 3840 px oralig'ida **AVIF + WebP** variantlar yasaladi. AVIF 4:4:4 formatda saqlanadi, shuning uchun mayda matn va logotiplar tiniq chiqadi;
- blur-placeholder va asosiy rang saqlanadi. Sahifada rasm o'rni oldindan band qilinadi, shuning uchun sahifa "sakramaydi" (CLS ≈ 0);
- asl fayl ham saqlanib qoladi. "Lossless" rejimida variantlar siqilmasdan yasaladi.

Ommaviy sahifalar statik yaratiladi va CDN'dan beriladi. Admin biror narsani saqlasa, kesh avtomatik yangilanadi (`revalidateSite`).

## Tuzilma

```
src/
  app/(site)/[locale]/   ommaviy sahifalar (uz / ru / en)
  app/admin/             admin panel (login + (panel))
  app/api/admin/upload   media yuklash
  components/site        sayt komponentlari
  components/admin       admin UI, blok muharriri, uploaderlar
  components/blocks      bloklarni saytda chizish
  lib/                   domen mantiqi: auth, media, storage, settings, theme, i18n, translate
  db/                    Drizzle sxemasi, seed
drizzle/                 SQL migratsiyalar
```

## Fayl yuklash qanday ishlaydi

Fayl server orqali o'tmaydi — Vercel so'rov hajmini 4.5 MB bilan cheklaydi, dizayner eksportlari esa undan katta:

1. `POST /api/admin/upload` — brauzer fayl haqida aytadi, server joy ajratadi va imzolangan "chipta" beradi;
2. brauzer faylni **to'g'ridan-to'g'ri bucket'ga** `PUT` qiladi (lokal rejimda `/api/admin/upload/direct` ga);
3. `POST /api/admin/upload/complete` — server faylni bucket'dan o'qib, barcha o'lcham va formatlarni yasaydi.

Chegara: rasm va video 40 MB. Bitta rasmni qayta ishlash 60 soniyaga sig'ishi kerak (Vercel chegarasi) — 6000×4000 eksport bitta CPU da ~6 s.

## Production (Vercel + Neon)

Hozirgi o'rnatish: **Neon** Postgres (baza) + **Neon Object Storage** (bucket `media`, us-east-2), Vercel funksiyalari bazaga yaqin `cle1` mintaqasida (`vercel.json`).

**Bucket talablari** (har qanday S3-mos saqlagich — Neon, R2, AWS):
- anonim o'qish ochiq (Neon'da *public_read*) — tashrif buyuruvchilar rasmlarni to'g'ridan-to'g'ri bucket'dan oladi;
- CORS: `PUT`, sarlavhalar `Content-Type` va `Cache-Control`. Origin `*` — xavfsizlik imzolangan URL'da, CORS faqat brauzerga javobni o'qishga ruxsat beradi, shuning uchun yangi domen ulansa ham o'zgartirish shart emas.

**Vercel → Environment Variables:**

| O'zgaruvchi | Qiymat |
|---|---|
| `DATABASE_URL` | Neon **pooled** manzili (`-pooler` bilan) |
| `AUTH_SECRET` | alohida tasodifiy qator (`.env.example` dagi buyruq) |
| `SITE_URL` | saytning to'liq manzili |
| `STORAGE_DRIVER` | `s3` |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Neon → Object storage |
| `SMTP_*` | ixtiyoriy — bog'lanish xabarlari emailga borishi uchun |

**Lokal ma'lumotlarni ko'chirish** (bir martalik, bajarilgan):
```bash
DATABASE_URL="<NEON, pooler'siz>" npm run db:migrate
pg_dump --data-only --no-owner --schema=public "<LOKAL>" | psql "<NEON, pooler'siz>"
npm run media:push -- .env.production.local      # ./storage → bucket
```

Production sozlamalarini lokalda sinash: `.env.production.local` ga yuqoridagi qiymatlarni yozing, keyin `npm run build && npm start`.

## Boshqa sozlamalar

- **Email:** `SMTP_*` qiymatlari (Gmail uchun App Password). Qabul qiluvchi email admin → Sozlamalar sahifasida kiritiladi.
- **Tarjima:** kalitsiz ham ishlaydi. Ko'p tarjima qilinsa, `GOOGLE_TRANSLATE_API_KEY` qo'shing.
- Birinchi kirgandan keyin admin parolini **Sozlamalar → Parolni almashtirish** bo'limida o'zgartiring.
