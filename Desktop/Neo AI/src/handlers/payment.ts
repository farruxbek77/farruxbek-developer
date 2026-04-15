import { Bot } from "grammy";
import { MyContext } from "../types";
import { addCredits } from "../services/database";
import {
  creditsPackagesKeyboard,
  backKeyboard,
  mainMenuKeyboard,
} from "../utils/keyboards";
import { config } from "../config";

export function registerPaymentHandlers(bot: Bot<MyContext>): void {
  // /buy buyrug'i
  bot.command("buy", async (ctx) => {
    await ctx.reply(buildBuyMessage(), {
      parse_mode: "HTML",
      reply_markup: creditsPackagesKeyboard(),
    });
  });

  // Callback: kredit sotib olish menyusi
  bot.callbackQuery("menu:buy", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(buildBuyMessage(), {
      parse_mode: "HTML",
      reply_markup: creditsPackagesKeyboard(),
    });
  });

  // Callback: paket tanlash
  bot.callbackQuery(/^buy:(.+)$/, async (ctx) => {
    const packageId = ctx.match[1];
    const pkg = config.packages.find((p) => p.id === packageId);

    if (!pkg) {
      await ctx.answerCallbackQuery("❌ Paket topilmadi");
      return;
    }

    try {
      await ctx.answerCallbackQuery();

      // Telegram Stars invoice yaratish
      await ctx.replyWithInvoice(
        `⭐ Neo AI — ${pkg.label}`,
        `${pkg.credits} ta kredit (${pkg.bonus || "qo'shimcha bonus yo'q"}).\n\nHar kredit bilan 1 ta professional rasm yarating!`,
        packageId,                         // payload
        "XTR",                             // Telegram Stars valyutasi
        [
          {
            label: `${pkg.credits} kredit ${pkg.bonus}`.trim(),
            amount: pkg.stars,
          },
        ]
      );
    } catch (error) {
      console.error("Invoice yaratish xatosi:", error);
      await ctx.reply(
        "❌ To'lov tizimida xatolik. Iltimos, qaytadan urinib ko'ring.",
        { reply_markup: backKeyboard("menu:buy") }
      );
    }
  });

  // Pre-checkout query (Telegram Stars to'lovni tasdiqlash)
  bot.on("pre_checkout_query", async (ctx) => {
    try {
      const packageId = ctx.preCheckoutQuery.invoice_payload;
      const pkg = config.packages.find((p) => p.id === packageId);

      if (!pkg) {
        await ctx.answerPreCheckoutQuery(false, "Paket topilmadi");
        return;
      }

      // To'lovni tasdiqlash
      await ctx.answerPreCheckoutQuery(true);
    } catch (error) {
      console.error("Pre-checkout xatosi:", error);
      await ctx.answerPreCheckoutQuery(false, "Tizimda xatolik");
    }
  });

  // Muvaffaqiyatli to'lov
  bot.on("message:successful_payment", async (ctx) => {
    const payment = ctx.message.successful_payment;
    const packageId = payment.invoice_payload;
    const pkg = config.packages.find((p) => p.id === packageId);

    if (!pkg) {
      await ctx.reply("❌ Paket ma'lumotlari topilmadi. @support ga murojaat qiling.");
      return;
    }

    try {
      const telegramChargeId = payment.telegram_payment_charge_id;
      const user = await addCredits(
        ctx.from!.id,
        pkg.credits,
        pkg.stars,
        telegramChargeId,
        `${pkg.credits} kredit — ${pkg.stars} Yulduz`
      );

      await ctx.reply(
        `✅ <b>To'lov muvaffaqiyatli!</b>\n\n` +
        `⭐ To'langan: <b>${pkg.stars} Yulduz</b>\n` +
        `🎁 Qo'shildi: <b>${pkg.credits} kredit</b>\n` +
        (pkg.bonus ? `🎉 Bonus: <b>${pkg.bonus}</b>\n` : "") +
        `\n💳 Joriy balans: <b>${user.credits} kredit</b>`,
        {
          parse_mode: "HTML",
          reply_markup: mainMenuKeyboard(),
        }
      );
    } catch (error) {
      console.error("To'lov qayta ishlash xatosi:", error);
      await ctx.reply(
        "⚠️ To'lov qabul qilindi, lekin kreditlar qo'shishda xatolik.\n" +
        "Iltimos, @support ga murojaat qiling va to'lov ID sini yuboring: " +
        payment.telegram_payment_charge_id
      );
    }
  });
}

function buildBuyMessage(): string {
  const packages = config.packages
    .map(
      (pkg) =>
        `⭐ <b>${pkg.stars} Yulduz</b> → ${pkg.credits} kredit${pkg.bonus ? ` <i>(${pkg.bonus})</i>` : ""}`
    )
    .join("\n");

  return (
    `💰 <b>Kredit Sotib Olish</b>\n\n` +
    `Telegram ⭐ Yulduzlar orqali kredit xarid qiling!\n` +
    `Har kredit bilan 1 ta DALL-E 3 rasm yaratasiz.\n\n` +
    `<b>Paketlar:</b>\n` +
    packages +
    `\n\n` +
    `💡 Quyidan paket tanlang:`
  );
}
