import "dotenv/config";
import { Bot, session } from "grammy";
import { MyContext, SessionData } from "./types";
import { config } from "./config";
import { prisma } from "./services/database";
import * as http from "http";
import { registerStartHandlers } from "./handlers/start";
import { registerChatHandlers } from "./handlers/chat";
import { registerImageHandlers } from "./handlers/image";
import { registerPaymentHandlers } from "./handlers/payment";
import { registerImageEditorHandlers } from "./handlers/imageEditor";
import { mainMenuKeyboard } from "./utils/keyboards";

// Standart session ma'lumotlari
function createInitialSessionData(): SessionData {
  return {
    mode: "idle",
    imagePrompt: null,
    lastImageFileId: null,
    lastImagePrompt: null,
  };
}

async function main(): Promise<void> {
  console.log("🤖 Neo AI Bot ishga tushmoqda...");

  // Bot yaratish
  const bot = new Bot<MyContext>(config.botToken);

  // Session middleware
  bot.use(
    session({
      initial: createInitialSessionData,
    })
  );

  // Barcha handlerlarni ro'yxatdan o'tkazish
  registerStartHandlers(bot);
  registerChatHandlers(bot);
  registerImageHandlers(bot);
  registerImageEditorHandlers(bot);
  registerPaymentHandlers(bot);

  // Noma'lum callbacklarni qayta ishlash
  bot.on("callback_query:data", async (ctx) => {
    console.warn(`Noma'lum callback: ${ctx.callbackQuery.data}`);
    await ctx.answerCallbackQuery("❓ Noma'lum amal");
  });

  // Defaultm matn xabarlari (hech qanday rejim yo'q)
  bot.on("message:text", async (ctx) => {
    const text = ctx.message.text;

    // Buyruqlarni o'tkazib yuborish
    if (text.startsWith("/")) return;

    await ctx.reply(
      "👋 Salom! Nima qilmoqchisiz?",
      {
        reply_markup: mainMenuKeyboard(),
      }
    );
  });

  // Global xato tutgich
  bot.catch((err) => {
    const ctx = err.ctx;
    const error = err.error;

    console.error(`❌ Xato [${ctx.update.update_id}]:`, error);

    // Foydalanuvchiga xabar yuborish
    ctx.reply("❌ Kutilmagan xatolik yuz berdi. Iltimos, /start ni bosing.").catch(
      () => {}
    );
  });

  // Database ulanishini tekshirish (Neon uyg'onishini kutib retry)
  let dbConnected = false;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await prisma.$connect();
      console.log("✅ PostgreSQL ulanishi muvaffaqiyatli");
      dbConnected = true;
      break;
    } catch (error: any) {
      console.warn(`⏳ Database ulanmadi (${attempt}/5), 3 soniyada qayta uriniladi...`);
      if (attempt === 5) {
        console.error("❌ Database ulanish xatosi:", error?.message ?? error);
        process.exit(1);
      }
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  // Bot ma'lumotlarini olish
  const botInfo = await bot.api.getMe();
  console.log(`✅ Bot ishga tushdi: @${botInfo.username}`);
  console.log(`🌍 Muhit: ${config.nodeEnv}`);
  console.log(`💰 Har rasm uchun yulduz: ${config.payment.starsPerImage}`);
  console.log(`🎁 Boshlang'ich kreditlar: ${config.payment.freeCreditsOnStart}`);

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n⏹ ${signal} qabul qilindi, bot to'xtatilmoqda...`);
    bot.stop();
    await prisma.$disconnect();
    console.log("✅ Bot muvaffaqiyatli to'xtatildi");
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  // Health check server (Fly.io uchun)
  const port = parseInt(process.env.PORT ?? "3000");
  http.createServer((req, res) => {
    res.writeHead(200);
    res.end("OK");
  }).listen(port, () => {
    console.log(`🌐 Health check server: port ${port}`);
  });

  // Polling rejimida ishga tushirish
  await bot.start({
    onStart: (info) => {
      console.log(`🚀 @${info.username} polling rejimida ishlamoqda...`);
    },
  });
}

main().catch((error) => {
  console.error("❌ Kritik xato:", error);
  process.exit(1);
});
