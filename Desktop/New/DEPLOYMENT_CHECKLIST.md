# 🚀 Railway Deployment Checklist

## ✅ Pre-Deployment (Completed)
- [x] Code changes committed and pushed to GitHub
- [x] Payment details added (Telegram Stars, Click, Payme)
- [x] All handlers properly configured
- [x] Environment variables prepared

## 📋 Deployment Steps

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub
3. Authorize Railway to access your GitHub repositories

### Step 2: Create New Project
1. Click "New Project" button
2. Select "Deploy from GitHub"
3. Select your repository: `farruxbek77/farruxbek-developer`
4. Authorize and connect

### Step 3: Add PostgreSQL Database
1. In Railway dashboard, click "Add Service"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically create and configure the database

### Step 4: Configure Environment Variables
In Railway dashboard, go to Variables and add:

```
BOT_TOKEN=8755256810:AAEg5XBAMSuUfHI0v2EIkm3Ye5n968k7GK0
ADMIN_ID=8492555919
DATABASE_URL=${{Postgres.DATABASE_URL}}
HUGGINGFACE_SPACE=vinthony/SadTalker
REQUIRED_CHANNELS=
PREMIUM_PRICE_UZS=30000
DAILY_FREE_LIMIT=2
WATERMARK_TEXT=@facevoice_ai_bot
MAX_VIDEO_DURATION=30
PAYMENT_AMOUNT=10000
PAYMENT_ACCOUNT=9860123456789012
```

**Important:** Use `${{Postgres.DATABASE_URL}}` for DATABASE_URL - Railway will automatically set this.

### Step 5: Verify Build & Start Commands
Railway should auto-detect these, but verify:
- **Build Command:** `npm run build`
- **Start Command:** `npm start`

### Step 6: Deploy
1. Push code to GitHub (already done ✅)
2. Railway automatically deploys
3. Check logs for "🎉 FaceVoice AI Bot ishga tushdi!" message

## 🔍 Post-Deployment Verification

### Check Logs
```bash
railway logs
```
Look for: "🎉 FaceVoice AI Bot ishga tushdi!"

### Test Bot
Send `/start` command to @facevoice_ai_bot in Telegram

### Verify Payment Methods
1. Create a video (use free credits)
2. On 3rd video, payment prompt should appear
3. Verify all 3 payment methods show correct details:
   - ⭐ Telegram Stars → @farruxbek_dev
   - 🇺🇿 Click → 4916 9903 3655 4883 (Turaev Rakhmatillo)
   - 🇺🇿 Payme → 4916 9903 3655 4883 (Turaev Rakhmatillo)

## 🆘 Troubleshooting

### Bot not starting
- Check logs: `railway logs`
- Verify BOT_TOKEN is correct
- Verify ADMIN_ID is correct

### Database connection error
- Verify DATABASE_URL is set to `${{Postgres.DATABASE_URL}}`
- Check PostgreSQL service is running
- Restart the service

### Bot not responding
- Check if bot is running: `railway logs`
- Verify bot token hasn't expired
- Restart the service

## 📞 Useful Commands

```bash
# View logs
railway logs

# Connect to database
railway run psql $DATABASE_URL

# Restart service
railway restart

# View environment variables
railway variables
```

## ✨ After Deployment

Your bot will be live 24/7 on Railway! 

**Features:**
- ✅ Free 2 videos per day
- ✅ Payment on 3rd video
- ✅ 3 payment methods (Telegram Stars, Click, Payme)
- ✅ Admin order management
- ✅ Video confirmation flow
- ✅ Automatic daily credit reset

**Next Steps:**
- Monitor logs regularly
- Test all payment methods
- Gather user feedback
- Scale as needed

