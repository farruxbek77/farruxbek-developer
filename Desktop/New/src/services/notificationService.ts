import { Telegraf } from 'telegraf';

export class NotificationService {
    private static bot: Telegraf;

    static initialize(bot: Telegraf) {
        this.bot = bot;
    }

    static async notifyUser(userId: number, message: string) {
        try {
            await this.bot.telegram.sendMessage(userId, message);
        } catch (error) {
            console.error(`Failed to notify user ${userId}:`, error);
        }
    }

    static async notifyAdmin(adminId: number, message: string) {
        try {
            await this.bot.telegram.sendMessage(adminId, `🔔 ADMIN NOTIFICATION\n\n${message}`);
        } catch (error) {
            console.error('Failed to notify admin:', error);
        }
    }

    static async notifyPremiumExpiring(userId: number, daysLeft: number) {
        const message = `⚠️ Premium obunangiz ${daysLeft} kundan keyin tugaydi!\n\n💎 Yangilash uchun /premium buyrug'ini yuboring.`;
        await this.notifyUser(userId, message);
    }

    static async notifyVideoReady(userId: number, videoUrl: string) {
        const message = `✅ Videongiz tayyor!\n\n🎬 Yuklab olish: ${videoUrl}`;
        await this.notifyUser(userId, message);
    }

    static async notifyNewUser(adminId: number, userId: number, username?: string) {
        const message = `👤 Yangi foydalanuvchi!\n\nID: ${userId}\nUsername: @${username || 'no_username'}`;
        await this.notifyAdmin(adminId, message);
    }

    static async notifyNewPremium(adminId: number, userId: number, plan: string) {
        const message = `💎 Yangi Premium obuna!\n\nID: ${userId}\nReja: ${plan}`;
        await this.notifyAdmin(adminId, message);
    }

    static async notifyError(adminId: number, error: string, userId?: number) {
        const message = `❌ Xato yuz berdi!\n\n${error}\n\nFoydalanuvchi: ${userId || 'N/A'}`;
        await this.notifyAdmin(adminId, message);
    }
}
