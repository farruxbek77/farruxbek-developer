// Multi-language support
export const translations = {
    uz: {
        welcome: `🎉 Xush kelibsiz!

🤖 FaceVoice AI - rasmlarni gapirtiruvchi bot

📝 Qanday ishlaydi?
1️⃣ Portret rasmini yuboring
2️⃣ Matn yoki audio yuboring
3️⃣ Video tayyor bo'lguncha kuting
4️⃣ Realistik video oling!

🎁 Kunlik 2 ta TEKIN video
💎 Premium: Cheksiz + Watermarksiz`,

        subscribe_required: '⚠️ Botdan foydalanish uchun kanallarga obuna bo\'ling:',
        subscribe_check: '✅ Tekshirish',
        subscribe_success: '✅ Obuna tasdiqlandi!',
        subscribe_failed: '❌ Siz hali barcha kanallarga obuna bo\'lmadingiz!',

        menu_generate: '🎬 Video Yaratish',
        menu_stats: '📊 Statistika',
        menu_premium: '💎 Premium',
        menu_help: '❓ Yordam',
        menu_cancel: '❌ Bekor qilish',

        send_image: '📸 Iltimos, portret rasmini yuboring:',
        send_text: '📝 Endi matn yuboring yoki 🎤 audio yozib yuboring:',
        processing: '⏳ Video yaratilmoqda... Iltimos kuting!',
        success: '✅ Videongiz tayyor!',
        error: '❌ Video yaratishda xatolik yuz berdi. Iltimos qayta urinib ko\'ring.',
        cancelled: '❌ Jarayon bekor qilindi.',

        limit_reached: '❌ Kunlik limitingiz tugadi!\n\n💎 Premium obuna oling yoki ertaga qayta urinib ko\'ring.',

        stats_title: '📊 SIZNING STATISTIKANGIZ',
        stats_premium: '💎 Premium:',
        stats_remaining: '🎬 Bugun qolgan:',
        stats_total: '📈 Jami yaratilgan:',

        premium_title: '💎 PREMIUM OBUNA',
        premium_benefits: `🚀 Premium afzalliklari:
✅ Cheksiz video yaratish
✅ Watermark (logotip) yo'q
✅ Navbatsiz tez ishlov
✅ Yuqori sifatli video
✅ Prioritet qo'llab-quvvatlash`,

        help_title: '❓ YORDAM',
    },

    ru: {
        welcome: `🎉 Добро пожаловать!

🤖 FaceVoice AI - бот для оживления фотографий

📝 Как это работает?
1️⃣ Отправьте портретное фото
2️⃣ Отправьте текст или аудио
3️⃣ Дождитесь создания видео
4️⃣ Получите реалистичное видео!

🎁 2 БЕСПЛАТНЫХ видео в день
💎 Premium: Безлимит + Без водяных знаков`,

        subscribe_required: '⚠️ Для использования бота подпишитесь на каналы:',
        subscribe_check: '✅ Проверить',
        subscribe_success: '✅ Подписка подтверждена!',
        subscribe_failed: '❌ Вы еще не подписались на все каналы!',

        menu_generate: '🎬 Создать Видео',
        menu_stats: '📊 Статистика',
        menu_premium: '💎 Premium',
        menu_help: '❓ Помощь',
        menu_cancel: '❌ Отмена',

        send_image: '📸 Пожалуйста, отправьте портретное фото:',
        send_text: '📝 Теперь отправьте текст или 🎤 запишите аудио:',
        processing: '⏳ Создается видео... Пожалуйста, подождите!',
        success: '✅ Ваше видео готово!',
        error: '❌ Произошла ошибка при создании видео. Попробуйте еще раз.',
        cancelled: '❌ Процесс отменен.',

        limit_reached: '❌ Дневной лимит исчерпан!\n\n💎 Оформите Premium или попробуйте завтра.',

        stats_title: '📊 ВАША СТАТИСТИКА',
        stats_premium: '💎 Premium:',
        stats_remaining: '🎬 Осталось сегодня:',
        stats_total: '📈 Всего создано:',

        premium_title: '💎 PREMIUM ПОДПИСКА',
        premium_benefits: `🚀 Преимущества Premium:
✅ Безлимитное создание видео
✅ Без водяных знаков
✅ Быстрая обработка без очереди
✅ Высокое качество видео
✅ Приоритетная поддержка`,

        help_title: '❓ ПОМОЩЬ',
    },

    en: {
        welcome: `🎉 Welcome!

🤖 FaceVoice AI - talking photo bot

📝 How it works?
1️⃣ Send a portrait photo
2️⃣ Send text or audio
3️⃣ Wait for video generation
4️⃣ Get realistic video!

🎁 2 FREE videos daily
💎 Premium: Unlimited + No watermark`,

        subscribe_required: '⚠️ Subscribe to channels to use the bot:',
        subscribe_check: '✅ Check',
        subscribe_success: '✅ Subscription confirmed!',
        subscribe_failed: '❌ You haven\'t subscribed to all channels yet!',

        menu_generate: '🎬 Create Video',
        menu_stats: '📊 Statistics',
        menu_premium: '💎 Premium',
        menu_help: '❓ Help',
        menu_cancel: '❌ Cancel',

        send_image: '📸 Please send a portrait photo:',
        send_text: '📝 Now send text or 🎤 record audio:',
        processing: '⏳ Creating video... Please wait!',
        success: '✅ Your video is ready!',
        error: '❌ Error creating video. Please try again.',
        cancelled: '❌ Process cancelled.',

        limit_reached: '❌ Daily limit reached!\n\n💎 Get Premium or try again tomorrow.',

        stats_title: '📊 YOUR STATISTICS',
        stats_premium: '💎 Premium:',
        stats_remaining: '🎬 Remaining today:',
        stats_total: '📈 Total created:',

        premium_title: '💎 PREMIUM SUBSCRIPTION',
        premium_benefits: `🚀 Premium benefits:
✅ Unlimited video creation
✅ No watermark
✅ Fast processing without queue
✅ High quality video
✅ Priority support`,

        help_title: '❓ HELP',
    },
};

export type Language = 'uz' | 'ru' | 'en';

export class LanguageService {
    private static userLanguages = new Map<number, Language>();

    static setLanguage(userId: number, lang: Language) {
        this.userLanguages.set(userId, lang);
    }

    static getLanguage(userId: number): Language {
        return this.userLanguages.get(userId) || 'uz';
    }

    static detectLanguage(text: string): Language {
        // Cyrillic detection
        if (/[а-яА-ЯёЁ]/.test(text)) return 'ru';
        // Latin with Uzbek specific
        if (/[oʻgʻ]/.test(text)) return 'uz';
        // Default to English
        return 'en';
    }

    static t(userId: number, key: string): string {
        const lang = this.getLanguage(userId);
        const translation = translations[lang];
        return (translation as any)[key] || key;
    }
}
