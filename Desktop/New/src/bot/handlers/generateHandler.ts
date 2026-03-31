import { Context } from 'telegraf';
import { UserService } from '../../services/userService';
import { config } from '../../config';
import { cancelKeyboard, mainMenuKeyboard } from '../keyboards';
import { Markup } from 'telegraf';
import { createPendingPayment } from './paymentHandler';

interface SessionData {
    step?: 'waiting_image' | 'waiting_text_or_audio';
    imageFileId?: string;
    imageUrl?: string;
}

interface Order {
    userId: number;
    username?: string;
    createdAt: Date;
    userChatId: number;
    videoCount?: number; // Track which video this is (1, 2, or 3+)
}

const sessions = new Map<number, SessionData>();
const orders = new Map<number, Order>();

export async function generateHandler(ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    const user = await UserService.getStats(userId);

    if (!user.is_premium && user.daily_credits <= 0) {
        // Create pending payment
        const username = ctx.from?.username || `user_${userId}`;
        createPendingPayment(userId, username);

        await ctx.reply(
            `💳 To'lov usulini tanlang:\n\n` +
            `⭐ Telegram Stars: 50 stars\n` +
            `🇺🇿 Click: 10,000 so'm\n` +
            `🇺🇿 Payme: 10,000 so'm`,
            Markup.inlineKeyboard([
                [Markup.button.callback('⭐ Telegram Stars', 'payment_stars')],
                [Markup.button.callback('🇺🇿 Click', 'payment_click')],
                [Markup.button.callback('🇺🇿 Payme', 'payment_payme')],
            ])
        );
        return;
    }

    sessions.set(userId, { step: 'waiting_image' });

    await ctx.reply(
        '📸 Ixtiyoriy: Portret rasmini yuboring: \n\n' +
        '✅ Yaxshi sifatli rasm\n' +
        '✅ Yuzni aniq ko\'rsatadigan\n' +
        '✅ JPG yoki PNG format\n\n' +
        '💡 Maslahat: Yuzni to\'g\'ridan-to\'g\'ri ko\'rsatadigan rasmlar eng yaxshi natija beradi!',
        cancelKeyboard
    );
}

export async function handleImage(ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    const session = sessions.get(userId);
    if (!session || session.step !== 'waiting_image') return;

    const photo = 'photo' in ctx.message! ? ctx.message.photo : null;
    if (!photo || photo.length === 0) {
        await ctx.reply('❌ Iltimos, rasm yuboring!');
        return;
    }

    const fileId = photo[photo.length - 1].file_id;
    const file = await ctx.telegram.getFile(fileId);
    const imageUrl = `https://api.telegram.org/file/bot${ctx.telegram.token}/${file.file_path}`;

    session.imageFileId = fileId;
    session.imageUrl = imageUrl;
    session.step = 'waiting_text_or_audio';

    await ctx.reply(
        '✅ Rasm qabul qilindi!\n\n' +
        '📝 Endi matn yuboring yoki 🎤 audio yozib yuboring:\n\n' +
        '💡 Matn: "Salom, bugun ajoyib kun!"\n' +
        '💡 Audio: Ovozli xabar yuboring (max 30 soniya)',
        cancelKeyboard
    );
}

export async function handleTextOrAudio(ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    const session = sessions.get(userId);
    if (!session || session.step !== 'waiting_text_or_audio') return;

    let text: string | undefined;

    if ('text' in ctx.message!) {
        text = ctx.message.text;
    } else if ('voice' in ctx.message!) {
        text = '[Audio xabar]';
    } else {
        await ctx.reply('❌ Iltimos, matn yoki audio yuboring!');
        return;
    }

    // Use credit
    const canGenerate = await UserService.useCredit(userId);
    if (!canGenerate) {
        await ctx.reply('❌ Kredit yetarli emas!', mainMenuKeyboard);
        sessions.delete(userId);
        return;
    }

    // Get current video count (this is the video number being created)
    const videoCount = await UserService.getVideoCount(userId);

    const processingMsg = await ctx.reply(
        '⏳ Zakaz qabul qilindi!\n\n' +
        '⏰ Admin tekshiryapti...\n\n' +
        '📞 Savollar uchun: @farruxbek_dev'
    );

    try {
        // Create order
        const orderId = Date.now();
        const username = ctx.from?.username || `user_${userId}`;
        orders.set(orderId, {
            userId,
            username,
            createdAt: new Date(),
            userChatId: ctx.chat!.id,
            videoCount: videoCount
        });

        // Send order to admin with buttons
        const adminMessage = `
📋 YANGI ZAKAZ

👤 Foydalanuvchi: @${username}
🆔 ID: ${userId}
📝 Matn: ${text}
⏰ Vaqt: ${new Date().toLocaleString('uz-UZ')}
🔑 Zakaz ID: ${orderId}
🎬 Video #${videoCount}
        `.trim();

        try {
            await ctx.telegram.sendMessage(
                config.bot.adminId,
                adminMessage,
                Markup.inlineKeyboard([
                    [
                        Markup.button.callback('✅ Qabul qilish', `accept_${orderId}`),
                        Markup.button.callback('❌ Bekor qilish', `reject_${orderId}`),
                    ],
                ])
            );
        } catch (adminError) {
            console.error('Failed to send to admin:', adminError);
            // Remove order if admin send failed
            orders.delete(orderId);
            throw adminError;
        }

        // Don't delete session yet - wait for admin response
        // sessions.delete(userId);
    } catch (error) {
        console.error('Order error:', error);
        // Restore credit if order failed
        await UserService.useCredit(userId); // This will add credit back
        await ctx.telegram.editMessageText(
            ctx.chat!.id,
            processingMsg.message_id,
            undefined,
            '❌ Zakaz qabul qilinmadi. Iltimos qayta urinib ko\'ring.'
        );
        sessions.delete(userId);
    }
}

export async function cancelHandler(ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    sessions.delete(userId);
    await ctx.reply('❌ Jarayon bekor qilindi.', mainMenuKeyboard);
}

export function getOrders() {
    return orders;
}
