// Rate limiting to prevent abuse
export class RateLimitService {
    private static limits = new Map<number, { count: number; resetAt: number }>();
    private static maxRequests = 10; // 10 requests
    private static windowMs = 60000; // per minute

    static checkLimit(userId: number): boolean {
        const now = Date.now();
        const userLimit = this.limits.get(userId);

        if (!userLimit || now > userLimit.resetAt) {
            this.limits.set(userId, {
                count: 1,
                resetAt: now + this.windowMs,
            });
            return true;
        }

        if (userLimit.count >= this.maxRequests) {
            return false;
        }

        userLimit.count++;
        return true;
    }

    static getRemainingRequests(userId: number): number {
        const userLimit = this.limits.get(userId);
        if (!userLimit || Date.now() > userLimit.resetAt) {
            return this.maxRequests;
        }
        return Math.max(0, this.maxRequests - userLimit.count);
    }

    static getResetTime(userId: number): number {
        const userLimit = this.limits.get(userId);
        if (!userLimit) return 0;
        return Math.max(0, userLimit.resetAt - Date.now());
    }

    static cleanup() {
        const now = Date.now();
        for (const [userId, limit] of this.limits.entries()) {
            if (now > limit.resetAt) {
                this.limits.delete(userId);
            }
        }
    }
}

// Cleanup every 5 minutes
setInterval(() => RateLimitService.cleanup(), 5 * 60 * 1000);
