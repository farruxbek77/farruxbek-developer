import { Bot, InputFile } from "grammy";
import { MyContext } from "../types";
import {
  downloadTelegramImage,
  sharpenImage,
  blurImage,
  portraitBlur,
  removeImageBackground,
  replaceBackground,
  generateBackground,
  backgroundPresets,
  cropImage,
  trimImageSide,
  autoTrimImage,
  CropRatio,
  TrimSide,
} from "../services/imageEditor";
import { getLastImage, saveLastImage } from "../services/database";
import {
  imageActionsKeyboard,
  sharpenLevelKeyboard,
  blurLevelKeyboard,
  cropRatioKeyboard,
  trimSideKeyboard,
  backgroundPresetsKeyboard,
  backKeyboard,
} from "../utils/keyboards";

// ── YORDAMCHI FUNKSIYALAR ─────────────────────────────────────────────────────

async function getImageData(ctx: any): Promise<{ fileId: string; prompt: string } | null> {
  if (ctx.session.lastImageFileId) {
    return { fileId: ctx.session.lastImageFileId, prompt: ctx.session.lastImagePrompt ?? "" };
  }
  const data = await getLastImage(ctx.from!.id);
  if (data) {
    ctx.session.lastImageFileId = data.fileId;
    ctx.session.lastImagePrompt = data.prompt;
  }
  return data;
}

async function saveResult(ctx: any, msg: any, prompt: string): Promise<void> {
  const photo = msg.photo;
  if (photo?.length > 0) {
    const fileId = photo[photo.length - 1].file_id;
    ctx.session.lastImageFileId = fileId;
    ctx.session.lastImagePrompt = prompt;
    await saveLastImage(ctx.from!.id, fileId, prompt).catch(() => {});
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export function registerImageEditorHandlers(bot: Bot<MyContext>): void {

  // ── ORQAGA ────────────────────────────────────────────────────────────────
  bot.callbackQuery("edit:back", async (ctx) => {
    await ctx.answerCallbackQuery();
    const data = await getImageData(ctx);
    await ctx.editMessageReplyMarkup({
      reply_markup: imageActionsKeyboard(data?.prompt ?? ""),
    }).catch(() => {});
  });

  // ── 1. TINIQLASH ──────────────────────────────────────────────────────────
  bot.callbackQuery("edit:sharpen", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageReplyMarkup({ reply_markup: sharpenLevelKeyboard() }).catch(() => {});
  });

  bot.callbackQuery(/^edit:sharpen:(low|medium|high)$/, async (ctx) => {
    const level = ctx.match[1] as "low" | "medium" | "high";
    await ctx.answerCallbackQuery("✨ Ishlanmoqda...");

    const data = await getImageData(ctx);
    if (!data) { await ctx.reply("❌ Avval rasm yarating."); return; }

    const loadingMsg = await ctx.reply("✨ <b>Tiniqlashtirilmoqda...</b>", { parse_mode: "HTML" });
    try {
      const buffer = await downloadTelegramImage(data.fileId);
      const result = await sharpenImage(buffer, level);
      await ctx.api.deleteMessage(ctx.chat!.id, loadingMsg.message_id);

      const label = { low: "Yengil", medium: "O'rta", high: "Kuchli" }[level];
      const msg = await ctx.replyWithPhoto(new InputFile(result, "sharpened.jpg"), {
        caption: `✨ <b>Tiniqlash — ${label}</b>`,
        parse_mode: "HTML",
        reply_markup: imageActionsKeyboard(data.prompt),
      });
      await saveResult(ctx, msg, data.prompt);
    } catch (e: any) {
      await ctx.api.deleteMessage(ctx.chat!.id, loadingMsg.message_id).catch(() => {});
      console.error("Sharpen:", e?.message);
      await ctx.reply("❌ Tiniqlashtirishda xatolik: " + (e?.message ?? "").slice(0, 100));
    }
  });

  // ── 2. XIRALASHTIRISH ─────────────────────────────────────────────────────
  bot.callbackQuery("edit:blur", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageReplyMarkup({ reply_markup: blurLevelKeyboard() }).catch(() => {});
  });

  bot.callbackQuery(/^edit:blur:(low|medium|high|portrait)$/, async (ctx) => {
    const level = ctx.match[1] as "low" | "medium" | "high" | "portrait";
    await ctx.answerCallbackQuery("🌫 Ishlanmoqda...");

    const data = await getImageData(ctx);
    if (!data) { await ctx.reply("❌ Avval rasm yarating."); return; }

    const loadingMsg = await ctx.reply("🌫 <b>Xiralantirilmoqda...</b>", { parse_mode: "HTML" });
    try {
      const buffer = await downloadTelegramImage(data.fileId);
      const result = level === "portrait" ? await portraitBlur(buffer) : await blurImage(buffer, level);
      await ctx.api.deleteMessage(ctx.chat!.id, loadingMsg.message_id);

      const label = { low: "Yengil", medium: "O'rta", high: "Kuchli", portrait: "Portret" }[level];
      const msg = await ctx.replyWithPhoto(new InputFile(result, "blurred.jpg"), {
        caption: `🌫 <b>Xiralashtirish — ${label}</b>`,
        parse_mode: "HTML",
        reply_markup: imageActionsKeyboard(data.prompt),
      });
      await saveResult(ctx, msg, data.prompt);
    } catch (e: any) {
      await ctx.api.deleteMessage(ctx.chat!.id, loadingMsg.message_id).catch(() => {});
      console.error("Blur:", e?.message);
      await ctx.reply("❌ Xiralantirishda xatolik: " + (e?.message ?? "").slice(0, 100));
    }
  });

  // ── 3. FON O'ZGARTIRISH ───────────────────────────────────────────────────
  bot.callbackQuery("edit:background", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageReplyMarkup({ reply_markup: backgroundPresetsKeyboard() }).catch(() => {});
  });

  bot.callbackQuery(/^edit:bg:(bg_\w+)$/, async (ctx) => {
    const preset = backgroundPresets.find((p) => p.id === ctx.match[1]);
    if (!preset) { await ctx.answerCallbackQuery("❌ Topilmadi"); return; }
    await ctx.answerCallbackQuery(`${preset.label} yaratilmoqda...`);
    await processBackgroundChange(ctx, preset.prompt, preset.label);
  });

  bot.callbackQuery("edit:bg:custom", async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.mode = "edit_bg";
    await ctx.reply(
      "✏️ <b>Yangi fon tavsifini yozing:</b>\n\n<i>Masalan: Qorli tog', Tokyo kechasi</i>",
      { parse_mode: "HTML", reply_markup: backKeyboard("edit:background") }
    );
  });

  bot.on("message:text", async (ctx, next) => {
    if (ctx.session.mode !== "edit_bg") return next();
    if (ctx.message.text.startsWith("/")) { ctx.session.mode = "idle"; return next(); }
    const description = ctx.message.text;
    ctx.session.mode = "idle";
    await processBackgroundChange(ctx, description, `"${description}"`);
  });

  // ── 4. KESISH ─────────────────────────────────────────────────────────────
  bot.callbackQuery("edit:crop", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageReplyMarkup({ reply_markup: cropRatioKeyboard() }).catch(() => {});
  });

  bot.callbackQuery(/^edit:crop:(.+)$/, async (ctx) => {
    const ratio = ctx.match[1] as CropRatio;
    await ctx.answerCallbackQuery("✂️ Ishlanmoqda...");

    const data = await getImageData(ctx);
    if (!data) { await ctx.reply("❌ Avval rasm yarating."); return; }

    const loadingMsg = await ctx.reply("✂️ <b>Kesib olinmoqda...</b>", { parse_mode: "HTML" });
    try {
      const buffer = await downloadTelegramImage(data.fileId);
      const result = await cropImage(buffer, ratio);
      await ctx.api.deleteMessage(ctx.chat!.id, loadingMsg.message_id);

      const msg = await ctx.replyWithPhoto(new InputFile(result, "cropped.jpg"), {
        caption: `✂️ <b>Kesish — ${ratio}</b>`,
        parse_mode: "HTML",
        reply_markup: imageActionsKeyboard(data.prompt),
      });
      await saveResult(ctx, msg, data.prompt);
    } catch (e: any) {
      await ctx.api.deleteMessage(ctx.chat!.id, loadingMsg.message_id).catch(() => {});
      console.error("Crop:", e?.message);
      await ctx.reply("❌ Kesishda xatolik: " + (e?.message ?? "").slice(0, 100));
    }
  });

  // ── 5. ELEMENT O'CHIRISH ──────────────────────────────────────────────────
  bot.callbackQuery("edit:trim", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageReplyMarkup({ reply_markup: trimSideKeyboard() }).catch(() => {});
  });

  bot.callbackQuery(/^edit:trim:(top|bottom|left|right|auto)$/, async (ctx) => {
    const side = ctx.match[1] as TrimSide | "auto";
    await ctx.answerCallbackQuery("🗑 Ishlanmoqda...");

    const data = await getImageData(ctx);
    if (!data) { await ctx.reply("❌ Avval rasm yarating."); return; }

    const loadingMsg = await ctx.reply("🗑 <b>Qirqilmoqda...</b>", { parse_mode: "HTML" });
    try {
      const buffer = await downloadTelegramImage(data.fileId);
      const result = side === "auto" ? await autoTrimImage(buffer) : await trimImageSide(buffer, side, 20);
      await ctx.api.deleteMessage(ctx.chat!.id, loadingMsg.message_id);

      const label = { top: "Yuqori", bottom: "Past", left: "Chap", right: "O'ng", auto: "Auto" }[side];
      const msg = await ctx.replyWithPhoto(new InputFile(result, "trimmed.jpg"), {
        caption: `🗑 <b>Element O'chirish — ${label}</b>`,
        parse_mode: "HTML",
        reply_markup: imageActionsKeyboard(data.prompt),
      });
      await saveResult(ctx, msg, data.prompt);
    } catch (e: any) {
      await ctx.api.deleteMessage(ctx.chat!.id, loadingMsg.message_id).catch(() => {});
      console.error("Trim:", e?.message);
      await ctx.reply("❌ Qirqishda xatolik: " + (e?.message ?? "").slice(0, 100));
    }
  });
}

// ── FON ALMASHTIRISH ──────────────────────────────────────────────────────────
async function processBackgroundChange(ctx: any, bgDescription: string, bgLabel: string): Promise<void> {
  const loadingMsg = await ctx.reply(
    `🖼 <b>Fon o'zgartirilmoqda...</b>\n⏳ Iltimos kuting (15-30 soniya)...`,
    { parse_mode: "HTML" }
  );
  try {
    const data = await getImageData(ctx);
    if (!data) {
      await ctx.api.deleteMessage(ctx.chat!.id, loadingMsg.message_id).catch(() => {});
      await ctx.reply("❌ Avval rasm yarating yoki yuboring.");
      return;
    }
    const originalPrompt = data.prompt ?? "";

    // 1. Asl rasmni yuklab olish
    const originalBuffer = await downloadTelegramImage(data.fileId);

    // 2. Orqa fonni olib tashlash (@imgly — bepul, lokal)
    console.log("[BG] Orqa fon olib tashlanmoqda...");
    const subjectBuffer = await removeImageBackground(originalBuffer);

    // 3. Yangi fon yaratish (Pollinations.ai)
    console.log("[BG] Yangi fon yaratilmoqda:", bgDescription);
    const bgBuffer = await generateBackground(bgDescription);

    // 4. Subject + yangi fon birlashtirish
    const resultBuffer = await replaceBackground(subjectBuffer, bgBuffer);

    await ctx.api.deleteMessage(ctx.chat!.id, loadingMsg.message_id);

    const msg = await ctx.replyWithPhoto(new InputFile(resultBuffer, "new_bg.jpg"), {
      caption: `🖼 <b>Fon O'zgardi — ${bgLabel}</b>${originalPrompt ? `\n\n📝 <i>${originalPrompt}</i>` : ""}`,
      parse_mode: "HTML",
      reply_markup: imageActionsKeyboard(originalPrompt),
    });
    await saveResult(ctx, msg, originalPrompt);
  } catch (e: any) {
    console.error("Background:", e?.message);
    await ctx.api.deleteMessage(ctx.chat!.id, loadingMsg.message_id).catch(() => {});
    await ctx.reply("❌ Fon o'zgartirishda xatolik: " + (e?.message ?? "").slice(0, 100));
  }
}
