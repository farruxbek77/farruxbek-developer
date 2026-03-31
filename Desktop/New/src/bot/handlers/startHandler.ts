import { Context } from 'telegraf';
import { SubscriptionService } from '../../services/subscriptionService';
import { mainMenuKeyboard } from '../keyboards';

export async function startHandler(ctx: Context) {
    const userId = ctx.from?.id;
    const firstName = ctx.from?.first_name;

    if (!userId) return;

    const welcomeMessage = `
🎉 Xush kelibsiz, ${firstName}!

🤖 FaceVoice AI - rasmlarni gapirtiruvchi bot

📝 Qanday ishlaydi?
1️⃣ Portret rasmini yuboring
2️⃣ Matn yoki audio yuboring
3️⃣ Video tayyor bo'lguncha kuting
4️⃣ Realistik video oling!

🎁 Kunlik 2 ta TEKIN video
💎 Premium: Cheksiz + Watermarksiz

Boshlash uchun "🎬 Video Yaratish" tugmasini bosing!

📞 Admin: @farruxbek_dev
📢 Kanal: @facevoice_ai
  `.trim();

    await ctx.reply(welcomeMessage, mainMenuKeyboard);
}
