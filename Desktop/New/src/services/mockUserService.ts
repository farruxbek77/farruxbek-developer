// Mock user service for when database is not configured
import { User } from '../database/db';
import { config } from '../config';

const mockUsers = new Map<number, User>();

export class MockUserService {
    static async getOrCreateUser(userId: number, username?: string, firstName?: string): Promise<User> {
        if (!mockUsers.has(userId)) {
            mockUsers.set(userId, {
                id: userId,
                username,
                first_name: firstName,
                is_premium: false,
                daily_credits: config.premium.dailyFreeLimit,
                last_reset_date: new Date(),
                total_generated: 0,
            });
        }
        return mockUsers.get(userId)!;
    }

    static async resetDailyCredits(userId: number): Promise<void> {
        const user = mockUsers.get(userId);
        if (!user) return;

        const today = new Date().toDateString();
        const lastReset = user.last_reset_date.toDateString();

        if (today !== lastReset) {
            user.daily_credits = config.premium.dailyFreeLimit;
            user.last_reset_date = new Date();
        }
    }

    static async useCredit(userId: number): Promise<boolean> {
        await this.resetDailyCredits(userId);
        const user = mockUsers.get(userId);

        if (!user) return false;
        if (user.is_premium) return true;
        if (user.daily_credits <= 0) return false;

        user.daily_credits--;
        return true;
    }

    static async setPremium(userId: number, days: number): Promise<void> {
        const user = mockUsers.get(userId);
        if (!user) return;

        user.is_premium = true;
        const premiumUntil = new Date();
        premiumUntil.setDate(premiumUntil.getDate() + days);
        user.premium_until = premiumUntil;
    }

    static async checkPremiumStatus(userId: number): Promise<boolean> {
        const user = mockUsers.get(userId);
        if (!user || !user.is_premium) return false;
        if (!user.premium_until) return false;
        return user.premium_until > new Date();
    }

    static async getStats(userId: number): Promise<User> {
        await this.resetDailyCredits(userId);
        const user = mockUsers.get(userId);
        if (!user) {
            return await this.getOrCreateUser(userId);
        }
        return user;
    }
}
