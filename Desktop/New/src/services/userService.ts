import { config } from '../config';

// Mock user interface
export interface User {
  id: number;
  username?: string;
  first_name?: string;
  daily_credits: number;
  is_premium: boolean;
  premium_until?: string;
  last_reset_date?: string;
  video_count?: number; // Track which video attempt this is (1, 2, or 3+)
}

// In-memory user storage (database'siz)
const users = new Map<number, User>();

export class UserService {
  static async getOrCreateUser(userId: number, username?: string, firstName?: string): Promise<User> {
    if (users.has(userId)) {
      return users.get(userId)!;
    }

    const user: User = {
      id: userId,
      username,
      first_name: firstName,
      daily_credits: config.premium.dailyFreeLimit,
      is_premium: false,
      last_reset_date: new Date().toISOString().split('T')[0],
      video_count: 0,
    };

    users.set(userId, user);
    return user;
  }

  static async resetDailyCredits(userId: number): Promise<void> {
    const user = await this.getOrCreateUser(userId);
    const today = new Date().toISOString().split('T')[0];

    if (user.last_reset_date !== today) {
      user.daily_credits = config.premium.dailyFreeLimit;
      user.video_count = 0;
      user.last_reset_date = today;
      users.set(userId, user);
    }
  }

  static async useCredit(userId: number): Promise<boolean> {
    await this.resetDailyCredits(userId);
    const user = await this.getOrCreateUser(userId);

    if (user.daily_credits > 0 || user.is_premium) {
      user.daily_credits--;
      user.video_count = (user.video_count || 0) + 1;
      users.set(userId, user);
      return true;
    }

    return false;
  }

  static async getVideoCount(userId: number): Promise<number> {
    const user = await this.getOrCreateUser(userId);
    return user.video_count || 0;
  }

  static async resetVideoCount(userId: number): Promise<void> {
    const user = await this.getOrCreateUser(userId);
    user.video_count = 0;
    users.set(userId, user);
  }

  static async setPremium(userId: number, days: number): Promise<void> {
    const user = await this.getOrCreateUser(userId);
    const premiumUntil = new Date();
    premiumUntil.setDate(premiumUntil.getDate() + days);

    user.is_premium = true;
    user.premium_until = premiumUntil.toISOString();
    users.set(userId, user);
  }

  static async checkPremiumStatus(userId: number): Promise<boolean> {
    const user = await this.getOrCreateUser(userId);

    if (!user.is_premium) return false;
    if (!user.premium_until) return false;

    return new Date(user.premium_until) > new Date();
  }

  static async getStats(userId: number): Promise<User> {
    await this.resetDailyCredits(userId);
    return await this.getOrCreateUser(userId);
  }
}
