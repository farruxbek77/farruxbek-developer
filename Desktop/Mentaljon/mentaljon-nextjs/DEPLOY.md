# Vercel ga Deploy Qilish

## 1. Vercel Account

1. https://vercel.com ga kiring
2. GitHub bilan login qiling

## 2. Deploy Qilish

### Usul 1: Vercel CLI (Tezkor)

```cmd
cd mentaljon-nextjs
npm install -g vercel
vercel login
vercel
```

Savollar:
- Set up and deploy? → Y
- Which scope? → Sizning account
- Link to existing project? → N
- Project name? → kontakt12 (yoki boshqa nom)
- Directory? → ./
- Override settings? → N

### Usul 2: GitHub orqali

1. GitHub da yangi repository yarating
2. Kodni push qiling:
```cmd
cd mentaljon-nextjs
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/kontakt12.git
git push -u origin main
```

3. Vercel dashboard ga kiring
4. "Import Project" → GitHub repository ni tanlang
5. Deploy bosing

## 3. Custom Domain

Vercel dashboard da:
1. Project Settings → Domains
2. "kontakt12.vercel.app" avtomatik beriladi
3. Yoki custom domain qo'shing

## 4. Ma'lumotlar

LocalStorage ishlatiladi - ma'lumotlar brauzerda saqlanadi.
200 ta kontakt avtomatik yaratiladi.

## 5. Test Qilish

Deploy bo'lgach:
- https://kontakt12.vercel.app (yoki sizning domain)
- Telefondan ochib ko'ring
- Guruh yarating va xabar yuboring
