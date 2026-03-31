import { Context } from 'telegraf';
import { Markup } from 'telegraf';

export async function channelHandler(ctx: Context) {
    const channelMessage = `
📢 BIZNING KANAL

Bizning rasmiy kanalimizga obuna bo'ling!

✅ Yangiliklar va yangilanishlar
✅ Demo videolar
✅ Maslahatlar va triklar
✅ Maxsus takliflar

👇 Quyidagi tugmani bosing:
  `.trim();

    const channelKeyboard = Markup.inlineKeyboard([
        [Markup.button.url('📢 Kanalga Obuna Bo\'lish', 'https://t.me/facevoice_ai')],
        [Markup.button.url('📞 Admin', 'https://t.me/farruxbek_dev')],
    ]);

    await ctx.reply(channelMessage, channelKeyboard);
}
