import OpenAI from "openai";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import axios from "axios";
import { config } from "../config";

// ─── GROQ (suhbat uchun) ──────────────────────────────────────────────────────
const groq = new OpenAI({
  apiKey: config.groqApiKey,
  baseURL: "https://api.groq.com/openai/v1",
});

// ─── GEMINI (rasm uchun) ──────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(config.geminiApiKey);

const SYSTEM_PROMPT = `Siz "Neo AI" — aqlli va do'stona sun'iy intellekt yordamchisiz.
Foydalanuvchilar bilan o'zbek tilida muloqot qiling.
Qisqa, aniq va foydali javoblar bering.
Agar savol texnik bo'lsa, tushunarli tarzda tushuntiring.
Emojidan o'rinli foydalaning.`;

// Groq modellari (fallback tartibida)
const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "gemma2-9b-it",
];

// ─── SUHBAT: Gemini 2.5 Flash (asosiy) + Groq (zaxira) ──────────────────────
export async function getChatCompletion(
  history: Array<{ role: "user" | "assistant"; content: string }>,
  userMessage: string
): Promise<{ text: string; tokens: number }> {

  // 1️⃣ ASOSIY: Gemini 2.5 Flash — o'zbek tilini yaxshi biladi, 1M context
  if (config.geminiApiKey) {
    try {
      const model = genAI.getGenerativeModel(
        {
          model: "gemini-2.5-flash",
          systemInstruction: SYSTEM_PROMPT,
        },
        { apiVersion: "v1beta" }
      );

      // Tarixni Gemini formatiga o'tkazish
      const geminiHistory = history.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const chat = model.startChat({ history: geminiHistory });
      const result = await chat.sendMessage(userMessage);
      const text = result.response.text().trim();

      if (text) {
        console.log("[Chat] Gemini 2.5 Flash ✓");
        return { text, tokens: 0 };
      }
    } catch (err: any) {
      console.warn(`[Chat:Gemini] xato: ${err?.status ?? err?.message?.slice(0, 80)}`);
    }
  }

  // 2️⃣ ZAXIRA: Groq llama-3.3-70b — tez va ishonchli
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];

  for (const model of GROQ_MODELS) {
    try {
      const response = await groq.chat.completions.create({
        model,
        messages,
        max_tokens: 2048,
        temperature: 0.8,
      });

      const text = response.choices[0]?.message?.content ?? "";
      if (text) {
        console.log(`[Chat] Groq ${model} ✓`);
        return { text, tokens: response.usage?.total_tokens ?? 0 };
      }
    } catch (err: any) {
      console.warn(`[Groq:${model}] xato: ${err?.status} ${err?.message?.slice(0, 60)}`);
      if (err?.status === 429) {
        await new Promise((r) => setTimeout(r, 2000));
      }
      continue;
    }
  }

  throw new Error("AI vaqtincha ishlamayapti. Keyinroq urinib ko'ring.");
}

// ─── RASM YARATISH (Pollinations.ai) ─────────────────────────────────────────
export async function generateImage(
  prompt: string
): Promise<{ url: string; revisedPrompt: string }> {
  const enhancedPrompt = `${prompt}, high quality, detailed, professional, 4k`;

  // Gemini bilan sinab ko'rish (agar kalit bo'lsa)
  if (config.geminiApiKey) {
    try {
      const model = genAI.getGenerativeModel(
        { model: "gemini-2.0-flash-exp" },
        { apiVersion: "v1beta" }
      );
      const response = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: enhancedPrompt }] }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] } as never,
      });
      const parts = response.response.candidates?.[0]?.content?.parts ?? [];
      const imgPart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith("image/"));
      if (imgPart?.inlineData?.data) {
        return {
          url: `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`,
          revisedPrompt: enhancedPrompt,
        };
      }
    } catch (e: any) {
      console.warn("Gemini rasm muvaffaqiyatsiz:", e?.message?.slice(0, 60));
    }
  }

  // Pollinations.ai (asosiy, ishonchli)
  console.log(`[ImageGen] Final prompt: "${enhancedPrompt}"`);
  const encoded = encodeURIComponent(enhancedPrompt);
  const seed = Math.floor(Math.random() * 999999);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&model=flux&seed=${seed}&nologo=true`;

  // Bir marta yuklaymiz va buffer sifatida saqlaymiz
  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 90000,
    headers: { "User-Agent": "NeoAIBot/1.0" },
  });

  // Buffer ni data URI ga aylantirip qaytaramiz (2-so'rov yo'q)
  const imageBase64 = Buffer.from(response.data).toString("base64");
  return {
    url: `data:image/jpeg;base64,${imageBase64}`,
    revisedPrompt: enhancedPrompt,
  };
}

// ─── PROMPT TARJIMASI (Gemini — o'zbekchani biladi) ───────────────────────────
// O'zbek → ingliz lug'ati (noto'g'ri tarjima bo'ladigan so'zlar)
const UZ_DICTIONARY: Record<string, string> = {
  "kuchuk": "dog", "it": "dog", "köpek": "dog",
  "mushuk": "cat", "pishiq": "cat",
  "ot": "horse", "tulpar": "horse",
  "o'rdak": "duck", "ordak": "duck",
  "quyon": "rabbit",
  "qush": "bird",
  "sigir": "cow",
  "qo'y": "sheep", "qoy": "sheep",
  "echki": "goat",
  "cho'chqa": "pig",
  "tovuq": "chicken",
  "ayiq": "bear",
  "sher": "lion",
  "yo'lbars": "tiger",
  "fil": "elephant",
  "maymun": "monkey",
  "baliq": "fish",
  "ilon": "snake",
  "burgut": "eagle",
  "bo'ri": "wolf",
  "tulki": "fox",
};

function preTranslate(text: string): string {
  let result = text.toLowerCase();
  for (const [uz, en] of Object.entries(UZ_DICTIONARY)) {
    result = result.replace(new RegExp(`\\b${uz}\\b`, "gi"), en);
  }
  return result;
}

export async function translatePromptForImage(prompt: string): Promise<string> {
  const TRANSLATION_INSTRUCTION = `You are an expert Uzbek-to-English translator for image generation prompts.
Important Uzbek animal words: kuchuk/it=dog, mushuk=cat, ot=horse, quyon=rabbit, qush=bird, o'rdak=duck, sigir=cow, qo'y=sheep, ayiq=bear, sher=lion, yo'lbars=tiger, tovuq=chicken, baliq=fish.
Translate ONLY to English, output nothing else.

Uzbek: "${prompt}"
English:`;

  try {
    const model = genAI.getGenerativeModel(
      { model: "gemini-2.5-flash" },
      { apiVersion: "v1beta" }
    );
    const result = await model.generateContent(TRANSLATION_INSTRUCTION);
    const translated = result.response.text().trim();
    console.log(`[Translation] "${prompt}" → "${translated}"`);
    return translated || prompt;
  } catch (e: any) {
    console.warn("[Translation] Gemini failed:", e?.message?.slice(0, 60));
    try {
      const response = await groq.chat.completions.create({
        model: GROQ_MODELS[0],
        messages: [
          {
            role: "system",
            content: "You translate Uzbek to English for image generation. Key words: kuchuk/it=dog, mushuk=cat, ot=horse, quyon=rabbit, qush=bird, o'rdak=duck, sigir=cow, qo'y=sheep. Return ONLY the English translation.",
          },
          {
            role: "user",
            content: `Translate to English: "${prompt}"`,
          },
        ],
        max_tokens: 150,
        temperature: 0.1,
      });
      const translated = response.choices[0]?.message?.content?.trim() ?? prompt;
      console.log(`[Translation:Groq] "${prompt}" → "${translated}"`);
      return translated;
    } catch {
      // Ikkisi ham ishlamasa, lug'at orqali qisman tarjima
      const partial = preTranslate(prompt);
      console.log(`[Translation:Dict] "${prompt}" → "${partial}"`);
      return partial;
    }
  }
}
