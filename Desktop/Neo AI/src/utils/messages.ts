// Xush kelibsiz xabari
export function welcomeMessage(firstName: string, credits: number): string {
  return (
    `🤖 <b>Neo AI ga xush kelibsiz, ${firstName}!</b>\n\n` +
    `Men sun'iy intellekt yordamchisiman. Men sizga:\n\n` +
    `💬 <b>AI Suhbat</b> — GPT-4o mini bilan muloqot\n` +
    `🎨 <b>Rasm Yaratish</b> — DALL-E 3 bilan professional rasmlar\n\n` +
    `🎁 Sizga <b>${credits} ta bepul kredit</b> berildi!\n` +
    `(Har bir rasm = 1 kredit)\n\n` +
    `Quyidagi menyudan tanlang:`
  );
}

// Asosiy menyu xabari
export function mainMenuMessage(
  firstName: string,
  credits: number
): string {
  return (
    `👋 Salom, <b>${firstName}</b>!\n\n` +
    `💳 Balans: <b>${credits} kredit</b>\n\n` +
    `Nima qilmoqchisiz?`
  );
}

// Yordam xabari
export function helpMessage(): string {
  return (
    `❓ <b>Neo AI - Yordam</b>\n\n` +
    `<b>Buyruqlar:</b>\n` +
    `/start — Bosh menyu\n` +
    `/chat — AI suhbatni boshlash\n` +
    `/image — Rasm yaratish\n` +
    `/balance — Balansni ko'rish\n` +
    `/buy — Kredit sotib olish\n` +
    `/profile — Profilim\n` +
    `/clear — Suhbat tarixini tozalash\n\n` +
    `<b>AI Suhbat:</b>\n` +
    `• Kunlik 20 ta bepul xabar\n` +
    `• Kontekstli muloqot (tarix saqlanadi)\n\n` +
    `<b>Rasm Yaratish:</b>\n` +
    `• Har bir rasm uchun 1 kredit sarflanadi\n` +
    `• DALL-E 3 texnologiyasi\n` +
    `• 1024x1024 o'lchamda\n\n` +
    `<b>Kredit Tizimi:</b>\n` +
    `• Ro'yxatdan o'tishda 5 ta bepul kredit\n` +
    `• Telegram ⭐ Yulduzlar orqali sotib oling\n\n` +
    `📞 Muammo? @support ga yozing`
  );
}

// Profil xabari
export function profileMessage(stats: {
  credits: number;
  totalSpent: number;
  imagesGenerated: number;
  messagesSent: number;
  isPremium: boolean;
  createdAt: Date;
  chatCount: number;
  dailyChatLimit: number;
}): string {
  const memberSince = stats.createdAt.toLocaleDateString("uz-UZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const premiumBadge = stats.isPremium ? "👑 Premium" : "🆓 Bepul";

  return (
    `👤 <b>Profilim</b>\n\n` +
    `${premiumBadge}\n\n` +
    `💳 <b>Balans:</b> ${stats.credits} kredit\n` +
    `⭐ <b>Jami sarflangan:</b> ${stats.totalSpent} yulduz\n\n` +
    `📊 <b>Statistika:</b>\n` +
    `🎨 Yaratilgan rasmlar: ${stats.imagesGenerated} ta\n` +
    `💬 Yuborilgan xabarlar: ${stats.messagesSent} ta\n` +
    `📅 Bugungi chat: ${stats.chatCount}/${stats.dailyChatLimit}\n\n` +
    `📆 A'zolik: ${memberSince}`
  );
}

// Chat rejimi xabari
export function chatModeMessage(remaining: number): string {
  return (
    `💬 <b>AI Suhbat Rejimi</b>\n\n` +
    `GPT-4o mini bilan muloqot qilmoqdasiz.\n\n` +
    `📊 Bugungi limit: <b>${remaining}</b> ta xabar qoldi\n\n` +
    `Savolingizni yozing yoki /menu orqali qaytib keling.`
  );
}

// Rasm rejimi xabari
export function imageModeMessage(credits: number): string {
  return (
    `🎨 <b>Rasm Yaratish Rejimi</b>\n\n` +
    `DALL-E 3 bilan professional rasmlar yarating!\n\n` +
    `💳 Balansingiz: <b>${credits} kredit</b>\n` +
    `💡 1 rasm = 1 kredit\n\n` +
    `Rasmni qanday tasvirlashingizni yozing:\n` +
    `<i>Masalan: "Ko'k osmonda uchayotgan oq ot"</i>`
  );
}

// Xato xabarlari
export const errorMessages = {
  general: "❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.",
  noCredits:
    "💳 <b>Kredit yetarli emas!</b>\n\nRasm yaratish uchun kredit sotib oling.",
  chatLimit:
    "⏰ <b>Kunlik limit tugadi!</b>\n\n24 soat o'tgach yangilanadi yoki kredit sotib oling.",
  apiError:
    "🔧 AI xizmatida vaqtinchalik muammo. Bir oz kutib, qaytadan urinib ko'ring.",
  imageError: "🎨 Rasm yaratishda xatolik. Boshqa so'z bilan tasvirlang.",
};
