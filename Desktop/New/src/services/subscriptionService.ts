import { Context } from 'telegraf';
import { config } from '../config';

export class SubscriptionService {
    static async checkAllSubscriptions(ctx: Context): Promise<boolean> {
        const userId = ctx.from?.id;
        if (!userId) return false;

        const requiredChannels = config.channels.required;
        if (!requiredChannels || requiredChannels.length === 0) return true;

        for (const channelId of requiredChannels) {
            if (!channelId) continue; // Skip empty channel IDs

            try {
                const member = await ctx.telegram.getChatMember(channelId, userId);
                const isSubscribed = ['creator', 'administrator', 'member'].includes(member.status);

                if (!isSubscribed) {
                    return false;
                }
            } catch (error) {
                console.error(`Channel check error for ${channelId}:`, error);
                return false;
            }
        }

        return true;
    }

    static getSubscriptionKeyboard() {
        const channels = config.channels.required;

        // Agar kanallar bo'lmasa, default kanal ko'rsatamiz
        if (!channels || channels.length === 0) {
            return {
                inline_keyboard: [
                    [{ text: '📢 Bizning Kanal', url: 'https://t.me/facevoice_ai' }],
                    [{ text: '✅ Davom etish', callback_data: 'check_subscription' } as any],
                ],
            };
        }

        const buttons: any[] = channels.map((channelId, index) => ({
            text: `📢 Kanal ${index + 1}`,
            url: `https://t.me/${channelId.replace('@', '')}`,
        }));

        buttons.push({ text: '✅ Tekshirish', callback_data: 'check_subscription' });

        return {
            inline_keyboard: [
                ...buttons.slice(0, -1).map(btn => [btn]),
                [buttons[buttons.length - 1]],
            ],
        };
    }
}
