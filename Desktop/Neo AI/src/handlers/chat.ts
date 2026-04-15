import { Bot } from "grammy";
import { MyContext } from "../types";
import {
  checkAndIncrementChatLimit,
  getRecentChatHistory,
  saveChatMessage,
  clearChatHistory,
} from "../services/database";
import { getChatCompletion } from "../services/openai";
import {
  mainMenuKeyboard,
  confirmKeyboard,
  backKeyboard,
} from "../utils/keyboards";
import { chatModeMessage, errorMessages } from "../utils/messages";
import { config } from "../config";

export function registerChatHandlers(bot: Bot<MyContext>): void {
  // /chat buyrug'i yoki menu:chat callback
  bot.command("chat", async (ctx) => {
    ctx.session.mode = "chat";
    const limitCheck = await checkAndIncrementChatLimit(ctx.from!.id);
    // Limitni ko'rsatish uchun kamaytiramiz (hali hisob qilinmagan)
    const stats = await getRecentChatHistory(ctx.from!.id, 0);

    await ctx.reply(
      chatModeMessage(20),
      {
        parse_mode: "HTML",
        reply_markup: backKeyboard(),
      }
    );
  });

  // Callback: chat menyu
  bot.callbackQuery("menu:chat", async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.mode = "chat";

    await ctx.editMessageText(
      chatModeMessage(20),
      {
        parse_mode: "HTML",
        reply_markup: backKeyboard(),
      }
    );
  });

  // /clear buyrug'i
  bot.command("clear", async (ctx) => {
    await ctx.reply(
      "🗑 <b>Suhbat tarixini tozalash</b>\n\nBarcha chat tarixi o'chirilsin?",
      {
        parse_mode: "HTML",
        reply_markup: confirmKeyboard("confirm:clear_history", "menu:main"),
      }
    );
  });

  // Tasdiqlash so'rash (menyu va profil uchun umumiy)
  async function askClearConfirm(ctx: any) {
    await ctx.answerCallbackQuery();
    const text = "🗑 <b>Suhbat tarixini tozalash</b>\n\nBarcha chat tarixi o'chirilsin?";
    const markup = { parse_mode: "HTML" as const, reply_markup: confirmKeyboard("confirm:clear_history", "menu:main") };
    try { await ctx.editMessageText(text, markup); } catch { await ctx.reply(text, markup); }
  }

  // Callback: tarixi tozalash (asosiy menyu orqali)
  bot.callbackQuery("menu:clear_history", askClearConfirm);

  // Callback: tarixi tozalash (profil orqali)
  bot.callbackQuery("profile:clear_history", askClearConfirm);

  // Callback: tasdiqlash - tarixi tozalash
  bot.callbackQuery("confirm:clear_history", async (ctx) => {
    try {
      await ctx.answerCallbackQuery("🗑 Tarix tozalanmoqda...");
      await clearChatHistory(ctx.from!.id);
      ctx.session.mode = "idle";

      const text = "✅ <b>Suhbat tarixi tozalandi!</b>\n\nEndi yangi suhbat boshlashingiz mumkin.";
      const markup = { parse_mode: "HTML" as const, reply_markup: mainMenuKeyboard() };
      try { await ctx.editMessageText(text, markup); } catch { await ctx.reply(text, markup); }
    } catch (error) {
      await ctx.answerCallbackQuery("❌ Xatolik");
    }
  });

  // Chat xabarlarini qayta ishlash (matn xabarlari)
  bot.on("message:text", async (ctx, next) => {
    if (ctx.session.mode !== "chat") {
      return next();
    }

    const userMessage = ctx.message.text;

    // /buyruqlarni o'tkazib yuborish
    if (userMessage.startsWith("/")) {
      return next();
    }

    try {
      // Typing indikator
      await ctx.replyWithChatAction("typing");

      // Limit tekshirish
      const limitCheck = await checkAndIncrementChatLimit(ctx.from!.id);
      if (!limitCheck.allowed) {
        await ctx.reply(
          `${errorMessages.chatLimit}\n\n💳 Balansni to'ldirish uchun:`,
          {
            parse_mode: "HTML",
            reply_markup: mainMenuKeyboard(),
          }
        );
        ctx.session.mode = "idle";
        return;
      }

      // Chat tarixini olish
      const history = await getRecentChatHistory(
        ctx.from!.id,
        config.limits.maxContextMessages
      );

      // AI javobini olish
      const { text, tokens } = await getChatCompletion(
        history,
        userMessage
      );

      // Tarixni saqlash
      await saveChatMessage(ctx.from!.id, "user", userMessage);
      await saveChatMessage(ctx.from!.id, "assistant", text, tokens);

      // Javobni yuborish
      const remainingMsg =
        limitCheck.remaining > 0
          ? `\n\n📊 <i>Bugun qoldi: ${limitCheck.remaining} xabar</i>`
          : "\n\n⚠️ <i>Bugungi limit tugadi!</i>";

      await ctx.reply(text + remainingMsg, {
        parse_mode: "HTML",
        reply_markup: backKeyboard(),
      });
    } catch (error: any) {
      const errMsg = error?.message ?? error?.toString() ?? "noma'lum";
      console.error("Chat handler xatosi:", JSON.stringify({
        message: errMsg,
        status: error?.status,
        code: error?.code,
      }));

      if (error?.status === 429) {
        await ctx.reply(errorMessages.apiError, {
          parse_mode: "HTML",
          reply_markup: mainMenuKeyboard(),
        });
      } else {
        await ctx.reply(`❌ ${errMsg.slice(0, 200)}`, {
          parse_mode: "HTML",
          reply_markup: backKeyboard(),
        });
      }
    }
  });
}
