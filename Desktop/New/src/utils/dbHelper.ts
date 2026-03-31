import { config } from '../config';

export function isDatabaseConfigured(): boolean {
    const dbUrl = config.database.url;

    // Check if database URL is configured
    if (!dbUrl ||
        dbUrl.includes('user:password') ||
        dbUrl.includes('host:5432') ||
        dbUrl === 'postgresql://user:password@host:5432/database') {
        return false;
    }

    return true;
}

export function requireDatabase(operation: string): void {
    if (!isDatabaseConfigured()) {
        console.warn(`⚠️ Database not configured. ${operation} skipped.`);
        console.warn('💡 Configure DATABASE_URL in .env to enable this feature.');
    }
}
