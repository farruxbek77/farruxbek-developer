import { Markup } from 'telegraf';

export const mainMenuKeyboard = Markup.keyboard([
    ['🎬 Video Yaratish', '📊 Statistika'],
    ['💎 Premium', '❓ Yordam'],
    ['📢 Kanal', '🌐 Til'],
]).resize();

export const cancelKeyboard = Markup.keyboard([
    ['❌ Bekor qilish'],
]).resize();

export const premiumKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('💳 1 Oylik - 30,000 so\'m', 'premium_1m')],
    [Markup.button.callback('💳 3 Oylik - 81,000 so\'m', 'premium_3m')],
    [Markup.button.callback('💳 1 Yillik - 300,000 so\'m', 'premium_1y')],
    [Markup.button.url('📞 Admin bilan bog\'lanish', 'https://t.me/farruxbek_dev')],
]);

export const adminKeyboard = Markup.keyboard([
    ['📊 Statistika', '👥 Foydalanuvchilar'],
    ['📢 Xabar Yuborish', '⚙️ Sozlamalar'],
    ['🔙 Orqaga'],
]).resize();

export const languageKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🇺🇿 O\'zbekcha', 'lang_uz')],
    [Markup.button.callback('🇷🇺 Русский', 'lang_ru')],
    [Markup.button.callback('🇬🇧 English', 'lang_en')],
]);
