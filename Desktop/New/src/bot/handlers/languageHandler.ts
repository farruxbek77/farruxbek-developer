import { Context } from 'telegraf';
import { LanguageService, Language } from '../../services/languageService';
import { languageKeyboard, mainMenuKeyboard } from '../keyboards';

export async function languageHandler(ctx: Context) {
    await ctx.reply(
        '🌐 Tilni tanlang / Выберите язык / Choose language:',
        languageKeyboard
    );
}

export async function languageCallbackHandler(ctx: Context) {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;

    const data = ctx.callbackQuery.data;
    const userId = ctx.from?.id;
    if (!userId) return;

    const langMap: Record<string, Language> = {
        lang_uz: 'uz',
        lang_ru: 'ru',
        lang_en: 'en',
    };

    const lang = langMap[data];
    if (!lang) return;

    LanguageService.setLanguage(userId, lang);

    const messages = {
        uz: '✅ Til o\'zgartirildi: O\'zbekcha',
        ru: '✅ Язык изменен: Русский',
        en: '✅ Language changed: English',
    };

    await ctx.answerCbQuery(messages[lang]);
    await ctx.reply(messages[lang], mainMenuKeyboard);
}
