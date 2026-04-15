import { Bot, Context } from "grammy";
import { MyContext } from "../types";
import { upsertUser, getUserStats } from "../services/database";
import {
  mainMenuKeyboard,
  profileKeyboard,
  backKeyboard,
} from "../utils/keyboards";
import {
  welcomeMessage,
  mainMenuMessage,
  helpMessage,
  profileMessage,
} from "../utils/messages";

export function registerStartHandlers(bot: Bot<MyContext>): void {
  // /start buyrug'i
  bot.command("start", async (ctx) => {
    try {
      const tgUser = ctx.from!;
      const user = await upsertUser({
        id: tgUser.id,
        username: tgUser.username,
        first_name: tgUser.first_name,
        last_name: tgUser.last_name,
      });

      ctx.session.mode = "idle";
      ctx.session.imagePrompt = null;

      await ctx.reply(
        welcomeMessage(user.firstName, user.credits),
        {
          parse_mode: "HTML",
          reply_markup: mainMenuKeyboard(),
        }
      );
    } catch (error) {
      console.error("Start handler xatosi:", error);
      await ctx.reply("❌ Botni ishga tushirishda xatolik. Iltimos, qaytadan urinib ko'ring.");
    }
  });

  // /menu buyrug'i
  bot.command("menu", async (ctx) => {
    try {
      const tgUser = ctx.from!;
      const user = await upsertUser({
        id: tgUser.id,
        username: tgUser.username,
        first_name: tgUser.first_name,
        last_name: tgUser.last_name,
      });

      ctx.session.mode = "idle";
      ctx.session.imagePrompt = null;

      await ctx.reply(
        mainMenuMessage(user.firstName, user.credits),
        {
          parse_mode: "HTML",
          reply_markup: mainMenuKeyboard(),
        }
      );
    } catch (error) {
      console.error("Menu handler xatosi:", error);
      await ctx.reply("❌ Xatolik yuz berdi.");
    }
  });

  // /profile buyrug'i
  bot.command("profile", async (ctx) => {
    try {
      const stats = await getUserStats(ctx.from!.id);
      if (!stats) {
        await ctx.reply("❌ Foydalanuvchi topilmadi. /start ni bosing.");
        return;
      }

      await ctx.reply(profileMessage(stats), {
        parse_mode: "HTML",
        reply_markup: profileKeyboard(),
      });
    } catch (error) {
      console.error("Profile handler xatosi:", error);
      await ctx.reply("❌ Xatolik yuz berdi.");
    }
  });

  // /balance buyrug'i
  bot.command("balance", async (ctx) => {
    try {
      const stats = await getUserStats(ctx.from!.id);
      if (!stats) {
        await ctx.reply("❌ Foydalanuvchi topilmadi. /start ni bosing.");
        return;
      }

      await ctx.reply(
        `💳 <b>Balans:</b> ${stats.credits} kredit\n\n` +
        `📊 Jami xabar: ${stats.messagesSent} ta\n` +
        `🎨 Jami rasm: ${stats.imagesGenerated} ta`,
        {
          parse_mode: "HTML",
          reply_markup: backKeyboard(),
        }
      );
    } catch (error) {
      await ctx.reply("❌ Xatolik yuz berdi.");
    }
  });

  // /help buyrug'i
  bot.command("help", async (ctx) => {
    await ctx.reply(helpMessage(), {
      parse_mode: "HTML",
      reply_markup: backKeyboard(),
    });
  });

  // Callback: asosiy menyu
  bot.callbackQuery("menu:main", async (ctx) => {
    try {
      await ctx.answerCallbackQuery();
      const tgUser = ctx.from!;
      const user = await upsertUser({
        id: tgUser.id,
        username: tgUser.username,
        first_name: tgUser.first_name,
        last_name: tgUser.last_name,
      });

      ctx.session.mode = "idle";
      ctx.session.imagePrompt = null;

      const text = mainMenuMessage(user.firstName, user.credits);
      const markup = { parse_mode: "HTML" as const, reply_markup: mainMenuKeyboard() };

      // Rasmli xabarda editMessageText ishlamaydi — yangi xabar yuboramiz
      try {
        await ctx.editMessageText(text, markup);
      } catch {
        await ctx.reply(text, markup);
      }
    } catch (error) {
      await ctx.answerCallbackQuery("❌ Xatolik yuz berdi");
    }
  });

  // Callback: profil
  bot.callbackQuery("menu:profile", async (ctx) => {
    try {
      await ctx.answerCallbackQuery();
      const stats = await getUserStats(ctx.from!.id);
      if (!stats) { await ctx.answerCallbackQuery("Foydalanuvchi topilmadi"); return; }
      const text = profileMessage(stats);
      const markup = { parse_mode: "HTML" as const, reply_markup: profileKeyboard() };
      try { await ctx.editMessageText(text, markup); } catch { await ctx.reply(text, markup); }
    } catch (error) {
      await ctx.answerCallbackQuery("❌ Xatolik");
    }
  });

  // Callback: statistika
  bot.callbackQuery("profile:stats", async (ctx) => {
    try {
      await ctx.answerCallbackQuery();
      const stats = await getUserStats(ctx.from!.id);
      if (!stats) return;
      const text = profileMessage(stats);
      const markup = { parse_mode: "HTML" as const, reply_markup: profileKeyboard() };
      try { await ctx.editMessageText(text, markup); } catch { await ctx.reply(text, markup); }
    } catch (error) {
      await ctx.answerCallbackQuery("❌ Xatolik");
    }
  });

  // Callback: yordam
  bot.callbackQuery("menu:help", async (ctx) => {
    try {
      await ctx.answerCallbackQuery();
      const text = helpMessage();
      const markup = { parse_mode: "HTML" as const, reply_markup: backKeyboard() };
      try { await ctx.editMessageText(text, markup); } catch { await ctx.reply(text, markup); }
    } catch (error) {
      await ctx.answerCallbackQuery("❌ Xatolik");
    }
  });
}
