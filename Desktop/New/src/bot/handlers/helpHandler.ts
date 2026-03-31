import { Context } from 'telegraf';
import { mainMenuKeyboard } from '../keyboards';

export async function helpHandler(ctx: Context) {
  const helpMessage = `
❓ YORDAM

🎬 Video yaratish:
1. "🎬 Video Yaratish" tugmasini bosing
2. Portret rasmini yuboring
3. Matn yoki audio yuboring
4. Videoni oling!

💡 Maslahatlar:
• Yuzni aniq ko'rsatadigan rasmlar ishlating
• Matn qisqa va tushunarli bo'lsin (max 200 so'z)
• Audio 30 soniyadan oshmasin
• Yaxshi yorug'likdagi rasmlar eng yaxshi natija beradi

🎁 Tekin foydalanish:
• Kuniga 2 ta video TEKIN
• Har kuni soat 00:00 da yangilanadi

💎 Premium:
• Cheksiz video
• Watermarksiz
• Tezkor ishlov

📞 Qo'llab-quvvatlash:
• Admin: @farruxbek_dev
• Kanal: @facevoice_ai

🌐 Veb-sayt: yourwebsite.com
  `.trim();

  await ctx.reply(helpMessage, mainMenuKeyboard);
}
