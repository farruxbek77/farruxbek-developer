import { Bot, InputFile } from "grammy";
import { MyContext } from "../types";
import { getUserBalance, spendCreditsForImage, saveLastImage } from "../services/database";
import {
  generateImage,
  translatePromptForImage,
} from "../services/openai";
import {
  mainMenuKeyboard,
  buyCreditsKeyboard,
  imageActionsKeyboard,
  backKeyboard,
} from "../utils/keyboards";
import { imageModeMessage, errorMessages } from "../utils/messages";
import { config } from "../config";
import axios from "axios";

export function registerImageHandlers(bot: Bot<MyContext>): void {

  // ── FOYDALANUVCHI RASM YUBORSA — TAHRIRLASH MENYU CHIQSIN ────────────────
  bot.on("message:photo", async (ctx) => {
    try {
      const photo = ctx.message.photo;
      const fileId = photo[photo.length - 1].file_id;
      const caption = ctx.message.caption ?? "";

      // Session va DB ga saqlash
      ctx.session.lastImageFileId = fileId;
      ctx.session.lastImagePrompt = caption;
      await saveLastImage(ctx.from!.id, fileId, caption).catch(() => {});

      await ctx.reply(
        `🖼 <b>Rasm qabul qilindi!</b>\n\nQuyidagi amallardan birini tanlang:`,
        {
          parse_mode: "HTML",
          reply_markup: imageActionsKeyboard(caption),
        }
      );
    } catch (e: any) {
      console.error("Photo handler:", e?.message);
    }
  });

  // /image buyrug'i
  bot.command("image", async (ctx) => {
    const balance = await getUserBalance(ctx.from!.id);
    ctx.session.mode = "image";
    ctx.session.imagePrompt = null;

    await ctx.reply(imageModeMessage(balance), {
      parse_mode: "HTML",
      reply_markup: backKeyboard(),
    });
  });

  // Callback: rasm menyu
  bot.callbackQuery("menu:image", async (ctx) => {
    await ctx.answerCallbackQuery();
    const balance = await getUserBalance(ctx.from!.id);
    ctx.session.mode = "image";
    ctx.session.imagePrompt = null;

    await ctx.editMessageText(imageModeMessage(balance), {
      parse_mode: "HTML",
      reply_markup: backKeyboard(),
    });
  });

  // Callback: rasmni qayta yaratish
  bot.callbackQuery(/^img:regen:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery("🔄 Qayta yaratilmoqda...");

    const prompt = ctx.match[1];
    await handleImageGeneration(ctx, prompt);
  });

  // Rasm promptini qayta ishlash (matn xabarlari)
  bot.on("message:text", async (ctx, next) => {
    if (ctx.session.mode !== "image") {
      return next();
    }

    const prompt = ctx.message.text;

    // /buyruqlarni o'tkazib yuborish
    if (prompt.startsWith("/")) {
      ctx.session.mode = "idle";
      return next();
    }

    ctx.session.imagePrompt = prompt;
    await handleImageGeneration(ctx, prompt);
  });
}

async function handleImageGeneration(
  ctx: any,
  prompt: string
): Promise<void> {
  const telegramId = ctx.from!.id;

  try {
    // Admin uchun kredit tekshiruvi o'tkazib yuboriladi
    const isAdmin = config.adminIds.includes(telegramId);

    // Balansi tekshirish
    const balance = await getUserBalance(telegramId);
    if (!isAdmin && balance < config.payment.starsPerImage) {
      await ctx.reply(
        `${errorMessages.noCredits}\n\n💳 Balansingiz: <b>${balance} kredit</b>`,
        {
          parse_mode: "HTML",
          reply_markup: buyCreditsKeyboard(),
        }
      );
      return;
    }

    // Yuklash xabari
    const loadingMsg = await ctx.reply(
      "🎨 <b>Rasm yaratilmoqda...</b>\n\n⏳ Bu bir necha soniya olishi mumkin.",
      { parse_mode: "HTML" }
    );

    // Promptni inglizchaga tarjima qilish
    let englishPrompt = prompt;
    try {
      englishPrompt = await translatePromptForImage(prompt);
    } catch {
      // Tarjima muvaffaqiyatsiz bo'lsa, asl promptni ishlatamiz
    }

    // Kredit sarflash (admin uchun kredit sarflanmaydi)
    let newBalance = balance;
    if (!isAdmin) {
      const result = await spendCreditsForImage(telegramId, config.payment.starsPerImage);
      if (!result.success) {
        await ctx.api.deleteMessage(ctx.chat!.id, loadingMsg.message_id);
        await ctx.reply(errorMessages.noCredits, {
          parse_mode: "HTML",
          reply_markup: buyCreditsKeyboard(),
        });
        return;
      }
      newBalance = result.newBalance;
    }

    // Rasm yaratish
    const { url, revisedPrompt } = await generateImage(englishPrompt);

    // URL yoki data URI dan buffer olish
    let imageBuffer: Buffer;
    if (url.startsWith("data:")) {
      // Gemini dan kelgan base64 data URI
      const base64Data = url.split(",")[1];
      imageBuffer = Buffer.from(base64Data, "base64");
    } else {
      // Pollinations URL
      const imageResponse = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 60000,
        headers: { "User-Agent": "NeoAIBot/1.0" },
      });
      imageBuffer = Buffer.from(imageResponse.data);
    }

    // Rasmni Telegramga yuborish
    try {

      await ctx.api.deleteMessage(ctx.chat!.id, loadingMsg.message_id);

      const sentMsg = await ctx.replyWithPhoto(new InputFile(imageBuffer, "image.png"), {
        caption:
          `🎨 <b>Rasm tayyor!</b>\n\n` +
          `📝 <i>${prompt}</i>\n\n` +
          `💳 Balans: <b>${newBalance} kredit</b>`,
        parse_mode: "HTML",
        reply_markup: imageActionsKeyboard(prompt),
      });

      // file_id ni session va DBga saqlash
      const photo = sentMsg.photo;
      if (photo && photo.length > 0) {
        const fileId = photo[photo.length - 1].file_id;
        ctx.session.lastImageFileId = fileId;
        ctx.session.lastImagePrompt = prompt;
        await saveLastImage(telegramId, fileId, prompt).catch(() => {});
      }

      // Rasm yaratilgandan keyin mode ni "idle" ga qaytarish
      ctx.session.mode = "idle";
    } catch (downloadError) {
      // Yuklash muvaffaqiyatsiz bo'lsa, URL yuboramiz
      await ctx.api.deleteMessage(ctx.chat!.id, loadingMsg.message_id);
      await ctx.reply(
        `🎨 <b>Rasm tayyor!</b>\n\n` +
        `📝 <i>${prompt}</i>\n\n` +
        `💳 Balans: <b>${newBalance} kredit</b>\n\n` +
        `[Rasmni ko'rish](${url})`,
        {
          parse_mode: "HTML",
          reply_markup: imageActionsKeyboard(prompt),
        }
      );
    }
  } catch (error: any) {
    console.error("Rasm yaratish xatosi:", error);

    const errorCode = error?.status ?? error?.code;
    const errorMsg = error?.message ?? error?.error?.message ?? "Noma'lum xato";
    console.error("Xato kodi:", errorCode, "| Xabar:", errorMsg);

    if (errorCode === 400) {
      await ctx.reply(
        `⚠️ <b>Xato:</b> ${errorMsg}`,
        {
          parse_mode: "HTML",
          reply_markup: backKeyboard("menu:image"),
        }
      );
    } else if (errorCode === 429) {
      await ctx.reply(errorMessages.apiError, {
        parse_mode: "HTML",
        reply_markup: backKeyboard("menu:image"),
      });
    } else {
      await ctx.reply(
        errorMessages.imageError,
        {
          parse_mode: "HTML",
          reply_markup: backKeyboard("menu:image"),
        }
      );
    }
  }
}
