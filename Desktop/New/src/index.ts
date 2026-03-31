import { Telegraf } from 'telegraf';
import { Markup } from 'telegraf';
import { config } from './config';
import { AIService } from './services/aiService';
import { SubscriptionService } from './services/subscriptionService';
import { AnalyticsService } from './services/analyticsService';
import { NotificationService } from './services/notificationService';

// Handlers
import { startHandler } from './bot/handlers/startHandler';
import { generateHandler, handleImage, handleTextOrAudio, cancelHandler } from './bot/handlers/generateHandler';
import { statsHandler } from './bot/handlers/statsHandler';
import { premiumHandler, premiumCallbackHandler } from './bot/handlers/premiumHandler';
import { helpHandler } from './bot/handlers/helpHandler';
import { languageHandler, languageCallbackHandler } from './bot/handlers/languageHandler';
import { channelHandler } from './bot/handlers/channelHandler';
import {
    adminHandler,
    statsCommandHandler,
    usersCommandHandler,
    queueCommandHandler,
    broadcastCommandHandler,
    premiumCommandHandler,
    givePremiumHandler,
    handleBroadcastMessage,
    completeOrderHandler,
    acceptOrderHandler,
    rejectOrderHandler,
    confirmPaymentHandler,
    rejectPaymentHandler,
    confirmVideoHandler,
    rejectVideoHandler,
    paymentConfirmHandler,
    paymentRejectHandler,
} from './bot/handlers/adminHandler';

const bot = new Telegraf(config.bot.token);

// Initialize Services
AIService.initialize().catch(console.error);
// NotificationService.initialize(bot).catch(console.error); // Disabled for Railway free plan

// Session storage for broadcast
const sessions = new Map<number, any>();

// Middleware: Analytics tracking (skip if database error)
bot.use(async (ctx, next) => {
    if (ctx.from) {
        // Fire and forget - don't wait for analytics
        AnalyticsService.trackEvent(ctx.from.id, 'bot_interaction', {
            updateType: ctx.updateType,
        }).catch(() => {
            // Silently ignore analytics errors
        });
    }
    return next();
});

// Middleware: Check subscription
bot.use(async (ctx, next) => {
    if (!ctx.from) return;

    // Skip subscription check for /start command, admin, and channel button
    const messageText = ctx.message && 'text' in ctx.message ? ctx.message.text : '';

    if (
        messageText === '/start' ||
        messageText === '📢 Kanal' ||
        ctx.from.id === config.bot.adminId
    ) {
        return next();
    }

    try {
        // Set timeout for subscription check (2 seconds max)
        const subscriptionPromise = SubscriptionService.checkAllSubscriptions(ctx);
        const timeoutPromise = new Promise<boolean>((resolve) => {
            setTimeout(() => resolve(true), 2000); // Default to true after 2 seconds
        });

        const isSubscribed = await Promise.race([subscriptionPromise, timeoutPromise]);

        if (!isSubscribed) {
            await ctx.reply(
                '⚠️ Botdan foydalanish uchun kanallarga obuna bo\'ling:',
                { reply_markup: SubscriptionService.getSubscriptionKeyboard() }
            );
            return;
        }
    } catch (error) {
        // Silently ignore subscription errors and allow user to continue
        console.error('Subscription check error:', error);
    }

    return next();
});

// Commands
bot.command('start', startHandler);
bot.command('admin', adminHandler);
bot.command('stats', statsCommandHandler);
bot.command('users', usersCommandHandler);
bot.command('queue', queueCommandHandler);
bot.command('broadcast', broadcastCommandHandler);
bot.command('premium', premiumCommandHandler);

// Handle /givepremium command
bot.command('givepremium', async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length !== 3) {
        await ctx.reply('❌ Format: /givepremium USER_ID DAYS');
        return;
    }

    const targetUserId = parseInt(args[1]);
    const days = parseInt(args[2]);

    if (isNaN(targetUserId) || isNaN(days)) {
        await ctx.reply('❌ USER_ID va DAYS raqam bo\'lishi kerak!');
        return;
    }

    await givePremiumHandler(ctx, targetUserId, days);
});

// Handle /complete command
bot.command('complete', async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length !== 2) {
        await ctx.reply('❌ Format: /complete ORDER_ID');
        return;
    }

    const orderId = args[1];
    await completeOrderHandler(ctx, orderId);
});

// Handle /confirm command (payment confirmation)
bot.command('confirm', async (ctx) => {
    await confirmPaymentHandler(ctx);
});

// Handle /reject command (payment rejection)
bot.command('reject', async (ctx) => {
    await rejectPaymentHandler(ctx);
});

bot.hears('🎬 Video Yaratish', generateHandler);
bot.hears('📊 Statistika', statsHandler);
bot.hears('💎 Premium', premiumHandler);
bot.hears('❓ Yordam', helpHandler);
bot.hears('❌ Bekor qilish', cancelHandler);
bot.hears('🌐 Til / Language', languageHandler);

// Callbacks
bot.action('check_subscription', async (ctx) => {
    const isSubscribed = await SubscriptionService.checkAllSubscriptions(ctx);
    if (isSubscribed) {
        await ctx.answerCbQuery('✅ Obuna tasdiqlandi!');
        await startHandler(ctx);
    } else {
        await ctx.answerCbQuery('❌ Siz hali barcha kanallarga obuna bo\'lmadingiz!');
    }
});

bot.action(/premium_.*/, premiumCallbackHandler);
bot.action(/lang_.*/, languageCallbackHandler);
bot.action(/accept_.*/, acceptOrderHandler);
bot.action(/reject_.*/, rejectOrderHandler);
bot.action('payment_stars', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    const { createPendingPayment } = await import('./bot/handlers/paymentHandler');
    createPendingPayment(userId, ctx.from?.username);

    await ctx.answerCbQuery('⭐ Telegram Stars: 50 stars');
    await ctx.editMessageText(
        '⭐ Telegram Stars: 50 stars\n\n' +
        '📱 Telegram Stars yuboring yoki gift qiling:\n' +
        '@farruxbek_dev\n\n' +
        'To\'lovni amalga oshiring va admin tasdiqlashini kuting.'
    );
});

bot.action('payment_click', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    const { createPendingPayment } = await import('./bot/handlers/paymentHandler');
    createPendingPayment(userId, ctx.from?.username);

    await ctx.answerCbQuery('🇺🇿 Click: 10,000 so\'m');
    await ctx.editMessageText(
        '🇺🇿 Click: 10,000 so\'m\n\n' +
        '💳 Karta raqami: 4916 9903 3655 4883\n' +
        '👤 Karta egasi: Turaev Rakhmatillo\n\n' +
        'To\'lovni amalga oshiring va admin tasdiqlashini kuting.'
    );
});

bot.action('payment_payme', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    const { createPendingPayment } = await import('./bot/handlers/paymentHandler');
    createPendingPayment(userId, ctx.from?.username);

    await ctx.answerCbQuery('🇺🇿 Payme: 10,000 so\'m');
    await ctx.editMessageText(
        '🇺🇿 Payme: 10,000 so\'m\n\n' +
        '💳 Karta raqami: 4916 9903 3655 4883\n' +
        '👤 Karta egasi: Turaev Rakhmatillo\n\n' +
        'To\'lovni amalga oshiring va admin tasdiqlashini kuting.'
    );
});
bot.action(/confirm_video_.*/, confirmVideoHandler);
bot.action(/reject_video_.*/, rejectVideoHandler);
bot.action(/payment_confirm_.*/, paymentConfirmHandler);
bot.action(/payment_reject_.*/, paymentRejectHandler);

// Handle photo
bot.on('photo', handleImage);

// Handle text and voice
bot.on('text', async (ctx) => {
    // Handle channel button FIRST - direct link to channel
    if (ctx.message && 'text' in ctx.message && ctx.message.text === '📢 Kanal') {
        await ctx.reply(
            '📢 Bizning rasmiy kanalimizga obuna bo\'ling!',
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '📢 Kanalga Obuna Bo\'lish', url: 'https://t.me/facevoice_ai' }],
                        [{ text: '📞 Admin', url: 'https://t.me/farruxbek_dev' }],
                    ],
                },
            }
        );
        return;
    }

    const userId = ctx.from.id;
    const session = sessions.get(userId);

    // Check if admin is broadcasting
    if (userId === config.bot.adminId && session?.awaitingBroadcast) {
        sessions.delete(userId);
        await handleBroadcastMessage(ctx, ctx.message.text);
        return;
    }

    await handleTextOrAudio(ctx);
});

bot.on('voice', handleTextOrAudio);

// Error handling
bot.catch((err: any, ctx) => {
    console.error('Bot error:', (err as Error).message);
    try {
        ctx.reply('❌ Xatolik yuz berdi. Iltimos qayta urinib ko\'ring.');
    } catch (e) {
        console.error('Failed to send error message:', (e as Error).message);
    }
});

// Launch bot
bot.launch().then(() => {
    console.log('');
    console.log('🎉 ========================================');
    console.log('🤖 FaceVoice AI Bot ishga tushdi!');
    console.log('========================================');
    console.log('✅ Bot: @facevoice_ai_bot');
    console.log('✅ Admin: @farruxbek_dev');
    console.log('✅ Narxlar: so\'mda (30k/81k/300k)');
    console.log('⚠️  AI Model: keyinroq');
    console.log('⚠️  Database: ixtiyoriy');
    console.log('========================================');
    console.log('📱 Test qiling: /start');
    console.log('========================================');
    console.log('');
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
