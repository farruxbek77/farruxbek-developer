import { Context } from 'telegraf';
import { Markup } from 'telegraf';
import { config } from '../../config';
import { AnalyticsService } from '../../services/analyticsService';
import { QueueService } from '../../services/queueService';
import { sql } from '../../database/db';
import { getOrders } from './generateHandler';
import { adminKeyboard, mainMenuKeyboard } from '../keyboards';
import { confirmPayment, rejectPayment, removePendingPayment, getPendingPayment } from './paymentHandler';

export async function adminHandler(ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId || userId !== config.bot.adminId) {
        await ctx.reply('❌ Sizda admin huquqlari yo\'q!');
        return;
    }

    const adminMessage = `
👨‍💼 ADMIN PANEL

Quyidagi buyruqlardan foydalaning:
/stats - Umumiy statistika
/users - Foydalanuvchilar
/queue - Navbat holati
/broadcast - Xabar yuborish
/premium - Premium berish
  `.trim();

    await ctx.reply(adminMessage, adminKeyboard);
}

export async function statsCommandHandler(ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId || userId !== config.bot.adminId) return;

    const dailyStats = await AnalyticsService.getDailyStats();
    const revenueStats = await AnalyticsService.getRevenueStats();
    const queueStats = QueueService.getQueueStats();

    const totalUsers = await sql`SELECT COUNT(*) as count FROM users`;
    const totalGenerations = await sql`SELECT COUNT(*) as count FROM generations`;

    const statsMessage = `
📊 UMUMIY STATISTIKA

👥 Foydalanuvchilar:
• Jami: ${totalUsers[0].count}
• Premium: ${revenueStats.premium_users}
• Bugun aktiv: ${dailyStats.active_users}

🎬 Videolar:
• Jami: ${totalGenerations[0].count}
• Bugun: ${dailyStats.total_generations}
• Muvaffaqiyatli: ${dailyStats.successful}
• Xato: ${dailyStats.failed}

⏳ Navbat:
• Ishlanmoqda: ${queueStats.processing}
• Maksimal: ${queueStats.maxConcurrent}
• Bo'sh: ${queueStats.available}

💰 Daromad:
• Premium foydalanuvchilar: ${revenueStats.premium_users}
• Taxminiy daromad: $${revenueStats.estimated_revenue}
  `.trim();

    await ctx.reply(statsMessage);
}

export async function usersCommandHandler(ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId || userId !== config.bot.adminId) return;

    const topUsers = await AnalyticsService.getTopUsers(10);

    let message = '👥 TOP 10 FOYDALANUVCHILAR\n\n';

    topUsers.forEach((user: any, index: number) => {
        const premiumBadge = user.is_premium ? '💎' : '';
        message += `${index + 1}. ${user.first_name} ${premiumBadge}\n`;
        message += `   @${user.username || 'no_username'}\n`;
        message += `   Videolar: ${user.video_count}\n\n`;
    });

    await ctx.reply(message);
}

export async function queueCommandHandler(ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId || userId !== config.bot.adminId) return;

    const queueStats = QueueService.getQueueStats();

    const pendingGenerations = await sql`
    SELECT 
      g.id,
      g.user_id,
      u.first_name,
      g.queue_position,
      g.created_at
    FROM generations g
    JOIN users u ON g.user_id = u.id
    WHERE g.status = 'pending'
    ORDER BY g.queue_position ASC
    LIMIT 10
  `;

    let message = `⏳ NAVBAT HOLATI\n\n`;
    message += `Ishlanmoqda: ${queueStats.processing}/${queueStats.maxConcurrent}\n`;
    message += `Bo'sh: ${queueStats.available}\n\n`;
    message += `Navbatdagi 10 ta:\n\n`;

    pendingGenerations.forEach((gen: any, index: number) => {
        message += `${index + 1}. ${gen.first_name} (ID: ${gen.user_id})\n`;
        message += `   Pozitsiya: ${gen.queue_position}\n`;
        message += `   Vaqt: ${new Date(gen.created_at).toLocaleString('uz-UZ')}\n\n`;
    });

    await ctx.reply(message);
}

export async function broadcastCommandHandler(ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId || userId !== config.bot.adminId) return;

    await ctx.reply(
        '📢 Xabar yuborish uchun matnni yuboring:\n\n' +
        'Xabar barcha foydalanuvchilarga yuboriladi.\n' +
        'Bekor qilish uchun /cancel yuboring.'
    );

    // Store state for broadcast
    (ctx as any).session = { awaitingBroadcast: true };
}

export async function handleBroadcastMessage(ctx: Context, message: string) {
    const userId = ctx.from?.id;
    if (!userId || userId !== config.bot.adminId) return;

    const users = await sql`SELECT id FROM users`;

    let sent = 0;
    let failed = 0;

    const statusMsg = await ctx.reply(`📤 Yuborilmoqda... 0/${users.length}`);

    for (const user of users) {
        try {
            await ctx.telegram.sendMessage(user.id, message);
            sent++;

            // Update status every 10 users
            if (sent % 10 === 0) {
                await ctx.telegram.editMessageText(
                    ctx.chat!.id,
                    statusMsg.message_id,
                    undefined,
                    `📤 Yuborilmoqda... ${sent}/${users.length}`
                );
            }
        } catch (error) {
            failed++;
        }
    }

    await ctx.telegram.editMessageText(
        ctx.chat!.id,
        statusMsg.message_id,
        undefined,
        `✅ Yuborildi!\n\n` +
        `Muvaffaqiyatli: ${sent}\n` +
        `Xato: ${failed}\n` +
        `Jami: ${users.length}`
    );
}

export async function premiumCommandHandler(ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId || userId !== config.bot.adminId) return;

    await ctx.reply(
        '💎 Premium berish uchun quyidagi formatda yuboring:\n\n' +
        '/givepremium USER_ID DAYS\n\n' +
        'Masalan: /givepremium 123456789 30'
    );
}

export async function givePremiumHandler(ctx: Context, targetUserId: number, days: number) {
    const userId = ctx.from?.id;
    if (!userId || userId !== config.bot.adminId) return;

    const premiumUntil = new Date();
    premiumUntil.setDate(premiumUntil.getDate() + days);

    await sql`
    UPDATE users
    SET is_premium = true, premium_until = ${premiumUntil.toISOString()}
    WHERE id = ${targetUserId}
  `;

    await ctx.reply(
        `✅ Premium berildi!\n\n` +
        `Foydalanuvchi: ${targetUserId}\n` +
        `Kunlar: ${days}\n` +
        `Tugash sanasi: ${premiumUntil.toLocaleDateString('uz-UZ')}`
    );

    // Notify user
    try {
        await ctx.telegram.sendMessage(
            targetUserId,
            `🎉 Tabriklaymiz!\n\n` +
            `Sizga ${days} kunlik Premium obuna berildi!\n\n` +
            `💎 Endi siz cheksiz video yarata olasiz!`
        );
    } catch (error) {
        console.error('Failed to notify user:', error);
    }
}

export async function completeOrderHandler(ctx: Context, orderId: string) {
    const userId = ctx.from?.id;
    if (!userId || userId !== config.bot.adminId) return;

    const orders = getOrders();
    const order = orders.get(parseInt(orderId));

    if (!order) {
        await ctx.reply('❌ Zakaz topilmadi!');
        return;
    }

    // Notify user
    try {
        await ctx.telegram.sendMessage(
            order.userId,
            '🎉 Sizning zakaz tayyor!\n\n' +
            'Video admin tomonidan yuborildi.\n\n' +
            'Agar video olmagan bo\'lsangiz, @farruxbek_dev ga murojaat qiling.'
        );
    } catch (error) {
        console.error('Failed to notify user:', error);
    }

    // Remove order
    orders.delete(parseInt(orderId));

    await ctx.reply(
        `✅ Zakaz tugatildi!\n\n` +
        `Foydalanuvchi: @${order.username}\n` +
        `ID: ${order.userId}\n` +
        `Foydalanuvchiga xabar yuborildi.`
    );
}

export async function acceptOrderHandler(ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId || userId !== config.bot.adminId) return;

    const callbackData = (ctx.callbackQuery as any)?.data;
    if (!callbackData || !callbackData.startsWith('accept_')) return;

    const orderId = parseInt(callbackData.replace('accept_', ''));
    const orders = getOrders();
    const order = orders.get(orderId);

    if (!order) {
        await ctx.answerCbQuery('❌ Zakaz topilmadi!');
        return;
    }

    try {
        // Notify user that order is accepted and ask for confirmation
        await ctx.telegram.sendMessage(
            order.userChatId,
            '✅ Sizning zakaz qabul qilindi!\n\n' +
            '⏰ Admin video tayyorlayapti...\n\n' +
            '🎬 Video tayyor bo\'lgach, siz tasdiqlaysiz.',
            Markup.inlineKeyboard([
                [
                    Markup.button.callback('✅ Ha', `confirm_video_${orderId}`),
                    Markup.button.callback('❌ Yo\'q', `reject_video_${orderId}`),
                ],
            ])
        );

        // Update admin message
        await ctx.editMessageText(
            `📋 YANGI ZAKAZ

👤 Foydalanuvchi: @${order.username}
🆔 ID: ${order.userId}
🔑 Zakaz ID: ${orderId}
🎬 Video #${order.videoCount}

✅ STATUS: QABUL QILINDI`
        );

        await ctx.answerCbQuery('✅ Zakaz qabul qilindi!');
    } catch (error) {
        console.error('Failed to accept order:', error);
        await ctx.answerCbQuery('❌ Xatolik yuz berdi!');
    }
}

export async function rejectOrderHandler(ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId || userId !== config.bot.adminId) return;

    const callbackData = (ctx.callbackQuery as any)?.data;
    if (!callbackData || !callbackData.startsWith('reject_')) return;

    const orderId = parseInt(callbackData.replace('reject_', ''));
    const orders = getOrders();
    const order = orders.get(orderId);

    if (!order) {
        await ctx.answerCbQuery('❌ Zakaz topilmadi!');
        return;
    }

    try {
        // Notify user that order is rejected
        await ctx.telegram.sendMessage(
            order.userChatId,
            '❌ Sizning zakaz bekor qilindi!\n\n' +
            'Kredit qaytarildi.\n\n' +
            '📞 Savollar uchun: @farruxbek_dev'
        );

        // Update admin message
        await ctx.editMessageText(
            `📋 YANGI ZAKAZ

👤 Foydalanuvchi: @${order.username}
🆔 ID: ${order.userId}
🔑 Zakaz ID: ${orderId}

❌ STATUS: BEKOR QILINDI`
        );

        // Remove order
        orders.delete(orderId);

        await ctx.answerCbQuery('✅ Zakaz bekor qilindi!');
    } catch (error) {
        console.error('Failed to reject order:', error);
        await ctx.answerCbQuery('❌ Xatolik yuz berdi!');
    }
}

export async function confirmPaymentHandler(ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId || userId !== config.bot.adminId) return;

    const args = (ctx.message as any)?.text?.split(' ');
    if (!args || args.length !== 2) {
        await ctx.reply('❌ Format: /confirm USERID');
        return;
    }

    const targetUserId = parseInt(args[1]);
    if (isNaN(targetUserId)) {
        await ctx.reply('❌ USERID raqam bo\'lishi kerak!');
        return;
    }

    const payment = getPendingPayment(targetUserId);
    if (!payment) {
        await ctx.reply('❌ Bu foydalanuvchi uchun to\'lov topilmadi!');
        return;
    }

    // Confirm payment
    confirmPayment(targetUserId);

    // Notify user with confirmation buttons
    try {
        await ctx.telegram.sendMessage(
            targetUserId,
            '🎬 Video tayyor! Qabul qilasizmi?',
            Markup.inlineKeyboard([
                [
                    Markup.button.callback('✅ Ha', `confirm_video_${targetUserId}`),
                    Markup.button.callback('❌ Yo\'q', `reject_video_${targetUserId}`),
                ],
            ])
        );
    } catch (error) {
        console.error('Failed to notify user:', error);
    }

    await ctx.reply(
        `✅ To'lov tasdiqlandi!\n\n` +
        `Foydalanuvchi: ${targetUserId}\n` +
        `Miqdor: ${payment.amount.toLocaleString('uz-UZ')} so'm\n` +
        `Foydalanuvchiga so'rov yuborildi.`
    );
}

export async function rejectPaymentHandler(ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId || userId !== config.bot.adminId) return;

    const args = (ctx.message as any)?.text?.split(' ');
    if (!args || args.length !== 2) {
        await ctx.reply('❌ Format: /reject USERID');
        return;
    }

    const targetUserId = parseInt(args[1]);
    if (isNaN(targetUserId)) {
        await ctx.reply('❌ USERID raqam bo\'lishi kerak!');
        return;
    }

    const payment = getPendingPayment(targetUserId);
    if (!payment) {
        await ctx.reply('❌ Bu foydalanuvchi uchun to\'lov topilmadi!');
        return;
    }

    // Reject payment
    rejectPayment(targetUserId);

    // Notify user
    try {
        await ctx.telegram.sendMessage(
            targetUserId,
            '❌ To\'lov bekor qilindi! Qayta urinib ko\'ring.'
        );
    } catch (error) {
        console.error('Failed to notify user:', error);
    }

    await ctx.reply(
        `❌ To'lov bekor qilindi!\n\n` +
        `Foydalanuvchi: ${targetUserId}\n` +
        `Miqdor: ${payment.amount.toLocaleString('uz-UZ')} so'm\n` +
        `Foydalanuvchiga xabar yuborildi.`
    );
}

export async function confirmVideoHandler(ctx: Context) {
    const callbackData = (ctx.callbackQuery as any)?.data;
    if (!callbackData || !callbackData.startsWith('confirm_video_')) return;

    const orderId = parseInt(callbackData.replace('confirm_video_', ''));
    const orders = getOrders();
    const order = orders.get(orderId);

    if (!order) {
        await ctx.answerCbQuery('❌ Zakaz topilmadi!');
        return;
    }

    try {
        const videoCount = order.videoCount || 1;

        // Determine message based on video count
        let confirmMessage = '';
        if (videoCount === 1) {
            confirmMessage = '✅ 1-free limit tugadi!\n\n🎉 Birinchi videongiz tayyor!';
        } else if (videoCount === 2) {
            confirmMessage = '✅ 2-free limit tugadi!\n\n🎉 Ikkinchi videongiz tayyor!';
        } else {
            // 3rd video - show payment prompt
            confirmMessage = '💳 Free limit tugadi! To\'lov qilasizmi?';

            await ctx.editMessageText(confirmMessage,
                Markup.inlineKeyboard([
                    [
                        Markup.button.callback('✅ Ha', `payment_confirm_${order.userId}`),
                        Markup.button.callback('❌ Yo\'q', `payment_reject_${order.userId}`),
                    ],
                ])
            );

            await ctx.answerCbQuery('✅ Video tasdiqlandi!');
            orders.delete(orderId);
            return;
        }

        // For videos 1-2, show free limit message and reset credits
        confirmMessage += '\n\n📊 Yangi kredit: 2 ta video';

        // Reset daily credits to 2 after confirmation
        const { UserService } = await import('../../services/userService');
        await UserService.resetDailyCredits(order.userId);

        await ctx.editMessageText(confirmMessage);
        await ctx.answerCbQuery('✅ Video tasdiqlandi!');

        // Remove order
        orders.delete(orderId);
    } catch (error) {
        console.error('Failed to confirm video:', error);
        await ctx.answerCbQuery('❌ Xatolik yuz berdi!');
    }
}

export async function rejectVideoHandler(ctx: Context) {
    const callbackData = (ctx.callbackQuery as any)?.data;
    if (!callbackData || !callbackData.startsWith('reject_video_')) return;

    const orderId = parseInt(callbackData.replace('reject_video_', ''));
    const orders = getOrders();
    const order = orders.get(orderId);

    if (!order) {
        await ctx.answerCbQuery('❌ Zakaz topilmadi!');
        return;
    }

    try {
        await ctx.editMessageText('❌ Video rad etildi.');
        await ctx.answerCbQuery('✅ Video rad etildi!');

        // Remove order
        orders.delete(orderId);
    } catch (error) {
        console.error('Failed to reject video:', error);
        await ctx.answerCbQuery('❌ Xatolik yuz berdi!');
    }
}

export async function paymentConfirmHandler(ctx: Context) {
    const callbackData = (ctx.callbackQuery as any)?.data;
    if (!callbackData || !callbackData.startsWith('payment_confirm_')) return;

    const userId = parseInt(callbackData.replace('payment_confirm_', ''));

    try {
        // Show payment methods with details
        await ctx.editMessageText(
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

        await ctx.answerCbQuery('✅ To\'lov usullari ko\'rsatildi!');
    } catch (error) {
        console.error('Failed to show payment methods:', error);
        await ctx.answerCbQuery('❌ Xatolik yuz berdi!');
    }
}

export async function paymentRejectHandler(ctx: Context) {
    const callbackData = (ctx.callbackQuery as any)?.data;
    if (!callbackData || !callbackData.startsWith('payment_reject_')) return;

    try {
        await ctx.editMessageText('Xayr! 👋\n\nAsosiy menyuga qaytish uchun /start yuboring.');
        await ctx.answerCbQuery('✅ Bekor qilindi!');
    } catch (error) {
        console.error('Failed to reject payment:', error);
        await ctx.answerCbQuery('❌ Xatolik yuz berdi!');
    }
}
