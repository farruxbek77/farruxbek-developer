import dotenv from 'dotenv';
dotenv.config();

// Validate required environment variables
const requiredVars = ['BOT_TOKEN', 'ADMIN_ID'];
const missingVars = requiredVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars.join(', '));
    process.exit(1);
}

export const config = {
    bot: {
        token: process.env.BOT_TOKEN!,
        adminId: parseInt(process.env.ADMIN_ID || '0'),
    },
    database: {
        url: process.env.DATABASE_URL || 'postgresql://localhost/facevoice',
    },
    ai: {
        huggingfaceSpace: process.env.HUGGINGFACE_SPACE || 'vinthony/SadTalker',
    },
    channels: {
        required: process.env.REQUIRED_CHANNELS?.split(',') || [],
    },
    premium: {
        priceUZS: parseInt(process.env.PREMIUM_PRICE_UZS || '30000'),
        dailyFreeLimit: parseInt(process.env.DAILY_FREE_LIMIT || '2'),
    },
    bot_settings: {
        watermark: process.env.WATERMARK_TEXT || '@FaceVoiceAI',
        maxDuration: parseInt(process.env.MAX_VIDEO_DURATION || '30'),
    },
    payment: {
        amount: parseInt(process.env.PAYMENT_AMOUNT || '10000'),
        account: process.env.PAYMENT_ACCOUNT || '9860123456789012',
    },
};
