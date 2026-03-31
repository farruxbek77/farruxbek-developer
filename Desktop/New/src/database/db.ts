import postgres from 'postgres';
import { config } from '../config';

let sql: any;
let isConnected = false;

async function initializeDatabase() {
    try {
        sql = postgres(config.database.url, {
            max: 3,
            idle_timeout: 10,
            connect_timeout: 5,
        });

        // Test connection
        await sql`SELECT 1`;
        isConnected = true;
        console.log('✅ Database connected successfully');
    } catch (error) {
        console.warn('⚠️ Database connection failed. Bot will work without database.');
        console.warn('Error:', (error as any).message);
        isConnected = false;
        // Create a mock sql function that returns empty results
        sql = async (query: any) => [];
    }
}

// Initialize on startup
initializeDatabase().catch(console.error);

export { sql, isConnected };

export interface User {
    id: number;
    username?: string;
    first_name?: string;
    is_premium: boolean;
    premium_until?: Date;
    daily_credits: number;
    last_reset_date: Date;
    total_generated: number;
}

export interface Generation {
    id: number;
    user_id: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    image_file_id?: string;
    text_input?: string;
    audio_file_id?: string;
    video_url?: string;
    queue_position?: number;
    created_at: Date;
    completed_at?: Date;
}
