#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Environment Variables Tekshirilmoqda...\n');

const envPath = path.join(__dirname, '..', '.env');

if (!fs.existsSync(envPath)) {
    console.log('❌ .env fayli topilmadi!');
    console.log('💡 .env.example faylidan nusxa oling:\n');
    console.log('   cp .env.example .env\n');
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const requiredVars = [
    'BOT_TOKEN',
    'ADMIN_ID',
    'DATABASE_URL',
    'HUGGINGFACE_SPACE',
];

let allValid = true;

requiredVars.forEach(varName => {
    const regex = new RegExp(`^${varName}=(.+)$`, 'm');
    const match = envContent.match(regex);

    if (!match || !match[1] || match[1].trim() === '') {
        console.log(`❌ ${varName} - Bo'sh yoki topilmadi`);
        allValid = false;
    } else {
        console.log(`✅ ${varName} - OK`);
    }
});

console.log('');

if (allValid) {
    console.log('✅ Barcha kerakli o\'zgaruvchilar to\'ldirilgan!');
    console.log('🚀 Botni ishga tushirishingiz mumkin: npm run dev\n');
} else {
    console.log('❌ Ba\'zi o\'zgaruvchilar to\'ldirilmagan!');
    console.log('💡 .env faylini to\'ldiring va qayta tekshiring.\n');
    process.exit(1);
}
