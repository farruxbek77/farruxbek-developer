import { Context } from 'telegraf';
import { premiumKeyboard, mainMenuKeyboard } from '../keyboards';
import { config } from '../../config';

export async function premiumHandler(ctx: Context) {
    const premiumMessage = `
💎 PREMIUM OBUNA

🚀 Premium afzalliklari:
✅ Cheksiz video yaratish
✅ Watermark (logotip) yo'q
✅ Navbatsiz tez ishlov
✅ Yuqori sifatli video
✅ Prioritet qo'llab-quvvatlash

💰 Narxlar:
• 1 Oy - ${config.premium.priceUZS.toLocaleString('uz-UZ')} so'm
• 3 Oy - ${(config.premium.priceUZS * 2.7).toLocaleString('uz-UZ')} so'm (10% chegirma)
• 1 Yil - ${(config.premium.priceUZS * 10).toLocaleString('uz-UZ')} so'm (17% chegirma)

📞 Admin: @farruxbek_dev
📢 Kanal: @facevoice_ai
  `.trim();

    await ctx.reply(premiumMessage, premiumKeyboard);
}

export async function premiumCallbackHandler(ctx: Context) {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;

    const data = ctx.callbackQuery.data;
    const plans: Record<string, { duration: string; price: string }> = {
        premium_1m: { duration: '1 oy', price: `${config.premium.priceUZS.toLocaleString('uz-UZ')} so'm` },
        premium_3m: { duration: '3 oy', price: `${(config.premium.priceUZS * 2.7).toLocaleString('uz-UZ')} so'm` },
        premium_1y: { duration: '1 yil', price: `${(config.premium.priceUZS * 10).toLocaleString('uz-UZ')} so'm` },
    };

    const plan = plans[data];
    if (!plan) return;

    await ctx.answerCbQuery();
    await ctx.reply(
        `✅ Siz ${plan.duration}lik Premium rejani tanladingiz (${plan.price})\n\n` +
        `📞 To'lov uchun admin bilan bog'laning: @farruxbek_dev\n\n` +
        `💡 To'lovni amalga oshirgandan so'ng, admin sizga Premium dostupni beradi.`,
        mainMenuKeyboard
    );
}
