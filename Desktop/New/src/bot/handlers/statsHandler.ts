import { Context } from 'telegraf';
import { mainMenuKeyboard } from '../keyboards';

export async function statsHandler(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const statsMessage = `
📊 SIZNING STATISTIKANGIZ

👤 Foydalanuvchi: ${ctx.from.first_name}
🆔 ID: ${userId}

💎 Premium: ❌ Yo'q
🎬 Bugun qolgan: 2/2
📈 Jami yaratilgan: 0 ta video

💡 Premium obuna oling va cheksiz video yarating!

📞 Admin: @farruxbek_dev
📢 Kanal: @facevoice_ai
  `.trim();

  await ctx.reply(statsMessage, mainMenuKeyboard);
}
