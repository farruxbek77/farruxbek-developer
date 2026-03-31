// Cache service for better performance
export class CacheService {
    private static cache = new Map<string, { data: any; expiry: number }>();

    static set(key: string, data: any, ttlSeconds: number = 300) {
        const expiry = Date.now() + ttlSeconds * 1000;
        this.cache.set(key, { data, expiry });
    }

    static get<T>(key: string): T | null {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.data as T;
    }

    static delete(key: string) {
        this.cache.delete(key);
    }

    static clear() {
        this.cache.clear();
    }

    static getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        };
    }
}
