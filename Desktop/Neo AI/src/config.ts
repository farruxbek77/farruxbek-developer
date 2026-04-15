import "dotenv/config";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Muhit o'zgaruvchisi topilmadi: ${name}`);
  }
  return value;
}

export const config = {
  botToken: requireEnv("BOT_TOKEN"),
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  groqApiKey: requireEnv("GROQ_API_KEY"),
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  databaseUrl: requireEnv("DATABASE_URL"),
  nodeEnv: process.env.NODE_ENV ?? "development",

  adminIds: (process.env.BOT_ADMIN_IDS ?? "")
    .split(",")
    .map((id) => parseInt(id.trim()))
    .filter((id) => !isNaN(id)),

  payment: {
    starsPerImage: parseInt(process.env.STARS_PER_IMAGE ?? "1"),
    freeCreditsOnStart: parseInt(process.env.FREE_CREDITS_ON_START ?? "5"),
  },

  limits: {
    dailyChatMessages: 20,
    maxContextMessages: 1000,
    imageSize: "1024x1024" as const,
    imageQuality: "standard" as const,
    chatModel: "gemini-2.5-flash" as const,
    imageModel: "gemini-2.0-flash-exp" as const,
    apiVersion: "v1beta" as const,
  },

  huggingFaceToken: process.env.HF_API_TOKEN ?? "",

  packages: [
    { id: "pack_10",  stars: 10,  credits: 10,  label: "10 kredit",  bonus: ""        },
    { id: "pack_25",  stars: 25,  credits: 30,  label: "30 kredit",  bonus: "+5 bonus" },
    { id: "pack_50",  stars: 50,  credits: 65,  label: "65 kredit",  bonus: "+15 bonus"},
    { id: "pack_100", stars: 100, credits: 140, label: "140 kredit", bonus: "+40 bonus"},
  ],
} as const;
