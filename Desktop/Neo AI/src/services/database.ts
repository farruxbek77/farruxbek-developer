import { PrismaClient, User } from "@prisma/client";
import { config } from "../config";


const prisma = new PrismaClient({
  log: config.nodeEnv === "development" ? ["warn", "error"] : ["error"],
});

export { prisma };

// Foydalanuvchini topish yoki yaratish
export async function upsertUser(telegramUser: {
  id: number;
  username?: string;
  first_name: string;
  last_name?: string;
}): Promise<User> {
  // Avval foydalanuvchi borligini tekshiramiz
  const existing = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramUser.id) },
    select: { id: true },
  });

  const user = await prisma.user.upsert({
    where: { telegramId: BigInt(telegramUser.id) },
    update: {
      username: telegramUser.username,
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name,
      lastActiveAt: new Date(),
    },
    create: {
      telegramId: BigInt(telegramUser.id),
      username: telegramUser.username,
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name,
      credits: config.payment.freeCreditsOnStart,
    },
  });

  // Faqat yangi foydalanuvchi bo'lsa stats yangilash
  if (!existing) {
    await prisma.botStats.upsert({
      where: { id: 1 },
      update: { totalUsers: { increment: 1 } },
      create: { id: 1, totalUsers: 1 },
    });
  }

  return user;
}

// Foydalanuvchi balansini olish
export async function getUserBalance(telegramId: number): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
    select: { credits: true },
  });
  return user?.credits ?? 0;
}

// Kunlik chat limitini tekshirish va yangilash
export async function checkAndIncrementChatLimit(
  telegramId: number
): Promise<{ allowed: boolean; remaining: number }> {
  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
    select: { chatCount: true, chatResetAt: true, dailyChatLimit: true, isPremium: true },
  });

  if (!user) return { allowed: false, remaining: 0 };

  // Admin uchun cheksiz limit
  if (config.adminIds.includes(telegramId)) {
    await prisma.user.update({
      where: { telegramId: BigInt(telegramId) },
      data: { messagesSent: { increment: 1 } },
    });
    return { allowed: true, remaining: 999 };
  }

  // Premium foydalanuvchilar uchun limit yo'q
  if (user.isPremium) {
    await prisma.user.update({
      where: { telegramId: BigInt(telegramId) },
      data: { chatCount: { increment: 1 }, messagesSent: { increment: 1 } },
    });
    return { allowed: true, remaining: 999 };
  }

  const now = new Date();
  const resetTime = new Date(user.chatResetAt);
  const hoursSinceReset = (now.getTime() - resetTime.getTime()) / (1000 * 60 * 60);

  // 24 soat o'tgan bo'lsa, limitni yangilash
  if (hoursSinceReset >= 24) {
    await prisma.user.update({
      where: { telegramId: BigInt(telegramId) },
      data: {
        chatCount: 1,
        chatResetAt: now,
        messagesSent: { increment: 1 },
      },
    });
    return { allowed: true, remaining: user.dailyChatLimit - 1 };
  }

  if (user.chatCount >= user.dailyChatLimit) {
    const nextReset = new Date(resetTime.getTime() + 24 * 60 * 60 * 1000);
    const hoursLeft = Math.ceil((nextReset.getTime() - now.getTime()) / (1000 * 60 * 60));
    return { allowed: false, remaining: 0 };
  }

  await prisma.user.update({
    where: { telegramId: BigInt(telegramId) },
    data: {
      chatCount: { increment: 1 },
      messagesSent: { increment: 1 },
    },
  });

  return {
    allowed: true,
    remaining: user.dailyChatLimit - user.chatCount - 1,
  };
}

// Rasm uchun kredit sarflash
export async function spendCreditsForImage(
  telegramId: number,
  amount: number
): Promise<{ success: boolean; newBalance: number }> {
  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
    select: { id: true, credits: true },
  });

  if (!user || user.credits < amount) {
    return { success: false, newBalance: user?.credits ?? 0 };
  }

  const updated = await prisma.user.update({
    where: { telegramId: BigInt(telegramId) },
    data: {
      credits: { decrement: amount },
      imagesGenerated: { increment: 1 },
    },
  });

  await prisma.botStats.upsert({
    where: { id: 1 },
    update: { totalImages: { increment: 1 } },
    create: { id: 1, totalImages: 1 },
  });

  return { success: true, newBalance: updated.credits };
}

// Kreditlar qo'shish (to'lovdan keyin)
export async function addCredits(
  telegramId: number,
  credits: number,
  starsAmount: number,
  telegramPaymentId: string,
  description: string
): Promise<User> {
  const user = await prisma.user.update({
    where: { telegramId: BigInt(telegramId) },
    data: {
      credits: { increment: credits },
      totalSpent: { increment: starsAmount },
    },
  });

  await prisma.transaction.create({
    data: {
      userId: user.id,
      telegramPaymentId,
      type: "PURCHASE",
      amount: starsAmount,
      creditsAdded: credits,
      description,
    },
  });

  await prisma.botStats.upsert({
    where: { id: 1 },
    update: { totalStarsEarned: { increment: starsAmount } },
    create: { id: 1, totalStarsEarned: starsAmount },
  });

  return user;
}

// Oxirgi rasm ma'lumotlarini saqlash (bot restart dan keyin ham ishlaydi)
export async function saveLastImage(
  telegramId: number,
  fileId: string,
  prompt: string
): Promise<void> {
  await prisma.user.update({
    where: { telegramId: BigInt(telegramId) },
    data: { lastImageFileId: fileId, lastImagePrompt: prompt },
  });
}

// Oxirgi rasm ma'lumotlarini olish
export async function getLastImage(
  telegramId: number
): Promise<{ fileId: string; prompt: string } | null> {
  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
    select: { lastImageFileId: true, lastImagePrompt: true },
  });
  if (!user?.lastImageFileId) return null;
  return { fileId: user.lastImageFileId, prompt: user.lastImagePrompt ?? "" };
}

// Chat tarixini saqlash
export async function saveChatMessage(
  telegramId: number,
  role: "user" | "assistant",
  content: string,
  tokens?: number
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
    select: { id: true },
  });

  if (!user) return;

  await prisma.chatHistory.create({
    data: {
      userId: user.id,
      role,
      content,
      tokens,
    },
  });
}

// So'nggi chat xabarlarini olish (kontekst uchun)
export async function getRecentChatHistory(
  telegramId: number,
  limit: number = 10
): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
    select: { id: true },
  });

  if (!user) return [];

  const history = await prisma.chatHistory.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { role: true, content: true },
  });

  return history.reverse().map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
}

// Chat tarixini tozalash
export async function clearChatHistory(telegramId: number): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
    select: { id: true },
  });

  if (!user) return;

  await prisma.chatHistory.deleteMany({
    where: { userId: user.id },
  });
}

// Foydalanuvchi statistikasini olish
export async function getUserStats(telegramId: number) {
  return prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
    select: {
      credits: true,
      totalSpent: true,
      imagesGenerated: true,
      messagesSent: true,
      isPremium: true,
      premiumUntil: true,
      createdAt: true,
      chatCount: true,
      dailyChatLimit: true,
    },
  });
}
