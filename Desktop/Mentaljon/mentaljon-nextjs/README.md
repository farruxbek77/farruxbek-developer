# 📱 Mentaljon - Next.js

Zamonaviy kontaktlar boshqaruvi va guruhli xabar yuborish tizimi.

## 🚀 Yangi Xususiyatlar

- ✅ Kontaktlarni guruhga birlashtirish
- ✅ Guruhga xabar yuborish
- ✅ Guruhlarni boshqarish
- ✅ 200 ta kontakt
- ✅ Light/Dark theme
- ✅ Mobile responsive

## 📦 O'rnatish

```cmd
cd mentaljon-nextjs
npm install
npm run dev
```

Ilova http://localhost:3000 da ochiladi.

## 🎯 Qanday ishlaydi

1. Kontaktlarni tanlang (checkbox)
2. "Guruh yaratish" tugmasini bosing
3. Guruh nomini kiriting
4. Guruh yaratiladi va tanlangan kontaktlar shu guruhga qo'shiladi
5. Guruhga xabar yuborish uchun guruhni kengaytiring (▶ tugma)
6. Xabar yozing va "Guruhga yuborish" ni bosing

## 🗄️ Database

PostgreSQL kerak. `mentaljon` database yaratilgan bo'lishi kerak.

Parolni `.env.local` faylida o'zgartiring:
```
DATABASE_URL=postgresql://postgres:SIZNING_PAROL@localhost:5432/mentaljon
```

## 📱 Vercel Deploy

```cmd
vercel
```

Environment variable qo'shing:
- `DATABASE_URL` - PostgreSQL connection string (Vercel Postgres yoki boshqa)
