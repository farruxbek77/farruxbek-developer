import sharp from "sharp";
import axios from "axios";
import FormData from "form-data";
import { config } from "../config";
import { execFile } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const execFileAsync = promisify(execFile);

// ─── YORDAMCHI FUNKSIYALAR ───────────────────────────────────────────────────

// Telegram dan rasm yuklab olish
export async function downloadTelegramImage(fileId: string): Promise<Buffer> {
  const file = await axios.get(
    `https://api.telegram.org/bot${config.botToken}/getFile?file_id=${fileId}`
  );
  const filePath: string = file.data.result.file_path;
  const response = await axios.get(
    `https://api.telegram.org/file/bot${config.botToken}/${filePath}`,
    { responseType: "arraybuffer", timeout: 30000 }
  );
  return Buffer.from(response.data);
}

// URL dan rasm yuklab olish
export async function downloadImageFromUrl(url: string): Promise<Buffer> {
  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 30000,
    headers: { "User-Agent": "NeoAIBot/1.0" },
  });
  return Buffer.from(response.data);
}

// ─── 1. TINIQLASHTIRISH ──────────────────────────────────────────────────────

export async function sharpenImage(
  buffer: Buffer,
  level: "low" | "medium" | "high"
): Promise<Buffer> {
  const settings = {
    low:    { sigma: 0.8,  m1: 0.3, m2: 0.3 },
    medium: { sigma: 2.0,  m1: 0.8, m2: 0.5 },
    high:   { sigma: 3.5,  m1: 1.5, m2: 0.8 },
  };

  return sharp(buffer)
    .sharpen(settings[level])
    .jpeg({ quality: 95 })
    .toBuffer();
}

// ─── 2. XIRALASHTIRISH ───────────────────────────────────────────────────────

export async function blurImage(
  buffer: Buffer,
  level: "low" | "medium" | "high"
): Promise<Buffer> {
  const sigmas = { low: 3, medium: 8, high: 20 };

  return sharp(buffer)
    .blur(sigmas[level])
    .jpeg({ quality: 90 })
    .toBuffer();
}

// Portret effekti: markazni tiniqlashtirib, chetlarini xiralashtirish
export async function portraitBlur(buffer: Buffer): Promise<Buffer> {
  const meta = await sharp(buffer).metadata();
  const w = meta.width!;
  const h = meta.height!;

  // Xira qatlam
  const blurred = await sharp(buffer).blur(12).toBuffer();

  // Markaziy qism (60% kenglik, 70% balandlik)
  const maskW = Math.round(w * 0.6);
  const maskH = Math.round(h * 0.7);
  const maskX = Math.round((w - maskW) / 2);
  const maskY = Math.round((h - maskH) / 2);

  // Sharp masking: original rasmning markazini kesib olamiz
  const centerCrop = await sharp(buffer)
    .extract({ left: maskX, top: maskY, width: maskW, height: maskH })
    .toBuffer();

  // Xira fon ustiga o'rtasini joylashtirish
  return sharp(blurred)
    .composite([{ input: centerCrop, left: maskX, top: maskY }])
    .jpeg({ quality: 92 })
    .toBuffer();
}

// ─── 3. ORQ FON O'ZGARTIRISH ─────────────────────────────────────────────────

// Python skript yo'li (Windows lokal yoki Linux server)
const PYTHON_EXE = process.env.PYTHON_PATH
  ?? (process.platform === "win32"
    ? "C:\\Users\\555\\AppData\\Local\\Programs\\Python\\Python311\\python.exe"
    : "/usr/bin/python3");
const RMBG_SCRIPT = path.join(__dirname, "..", "..", "scripts", "remove_bg.py");

// Background removal: Python rembg (lokal, bepul, ishonchli)
export async function removeImageBackground(buffer: Buffer): Promise<Buffer> {
  const pngBuffer = await sharp(buffer)
    .png()
    .resize(1024, 1024, { fit: "inside" })
    .toBuffer();

  const tmpIn  = path.join(os.tmpdir(), `rmbg_in_${Date.now()}.png`);
  const tmpOut = path.join(os.tmpdir(), `rmbg_out_${Date.now()}.png`);

  try {
    fs.writeFileSync(tmpIn, pngBuffer);
    console.log("[BG] Python rembg orqali fon olib tashlanmoqda...");

    await execFileAsync(
      PYTHON_EXE,
      [RMBG_SCRIPT, tmpIn, tmpOut],
      { timeout: 120000 }
    );

    const resultBuffer = fs.readFileSync(tmpOut);
    console.log("[BG] Fon muvaffaqiyatli olib tashlandi ✓");
    return resultBuffer;
  } finally {
    try { fs.unlinkSync(tmpIn); } catch {}
    try { fs.unlinkSync(tmpOut); } catch {}
  }
}

// Fonni yangi fon bilan almashtirish
export async function replaceBackground(
  subjectBuffer: Buffer,   // Fonsiz rasm (PNG, shaffof fon)
  bgBuffer: Buffer          // Yangi fon
): Promise<Buffer> {
  const subjectMeta = await sharp(subjectBuffer).metadata();
  const w = subjectMeta.width!;
  const h = subjectMeta.height!;

  // Yangi fonni o'lchamga moslashtirish
  const resizedBg = await sharp(bgBuffer)
    .resize(w, h, { fit: "cover", position: "center" })
    .jpeg({ quality: 95 })
    .toBuffer();

  // Subjectni fon ustiga qo'yish
  return sharp(resizedBg)
    .composite([{ input: subjectBuffer, blend: "over" }])
    .jpeg({ quality: 95 })
    .toBuffer();
}

// Yangi rasm yaratish (Pollinations.ai) — buffer qaytaradi
export async function generateBackground(description: string): Promise<Buffer> {
  const encoded = encodeURIComponent(`${description}, professional photography, 4k, high quality`);
  const seed = Math.floor(Math.random() * 999999);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&model=flux&seed=${seed}&nologo=true`;

  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 90000,
    headers: { "User-Agent": "NeoAIBot/1.0" },
  });

  return Buffer.from(response.data);
}

// Tayyor fon namunalari
export const backgroundPresets = [
  { id: "bg_nature",   label: "🌿 Tabiat",       prompt: "beautiful nature forest green trees sunlight" },
  { id: "bg_city",     label: "🏙 Shahar",        prompt: "modern city skyline night lights bokeh" },
  { id: "bg_beach",    label: "🏖 Plyaj",          prompt: "tropical beach ocean sunset golden hour" },
  { id: "bg_studio",   label: "📸 Studiya",        prompt: "professional photo studio white background gradient" },
  { id: "bg_space",    label: "🌌 Kosmos",         prompt: "galaxy nebula stars space universe dark" },
  { id: "bg_gradient", label: "🎨 Gradient",       prompt: "smooth colorful gradient abstract background" },
];

// ─── 4. KESISH ───────────────────────────────────────────────────────────────

export type CropRatio = "1:1" | "16:9" | "4:3" | "9:16" | "3:2" | "2:3";

export async function cropImage(buffer: Buffer, ratio: CropRatio): Promise<Buffer> {
  const meta = await sharp(buffer).metadata();
  const w = meta.width!;
  const h = meta.height!;

  const ratioMap: Record<CropRatio, [number, number]> = {
    "1:1":  [1, 1],
    "16:9": [16, 9],
    "4:3":  [4, 3],
    "9:16": [9, 16],
    "3:2":  [3, 2],
    "2:3":  [2, 3],
  };

  const [rw, rh] = ratioMap[ratio];
  let cw = w;
  let ch = Math.round((w * rh) / rw);

  if (ch > h) {
    ch = h;
    cw = Math.round((h * rw) / rh);
  }

  return sharp(buffer)
    .extract({
      left: Math.round((w - cw) / 2),
      top:  Math.round((h - ch) / 2),
      width: cw,
      height: ch,
    })
    .jpeg({ quality: 95 })
    .toBuffer();
}

// ─── 5. ELEMENT O'CHIRISH (QIRQISH) ─────────────────────────────────────────

export type TrimSide = "top" | "bottom" | "left" | "right";

export async function trimImageSide(
  buffer: Buffer,
  side: TrimSide,
  percent: number = 20   // necha foiz qirqilsin
): Promise<Buffer> {
  const meta = await sharp(buffer).metadata();
  const w = meta.width!;
  const h = meta.height!;
  const trimPx = Math.round((side === "top" || side === "bottom" ? h : w) * (percent / 100));

  let left = 0, top = 0, width = w, height = h;

  if (side === "top")    { top = trimPx;       height = h - trimPx; }
  if (side === "bottom") { height = h - trimPx; }
  if (side === "left")   { left = trimPx;       width = w - trimPx; }
  if (side === "right")  { width = w - trimPx; }

  return sharp(buffer)
    .extract({ left, top, width, height })
    .jpeg({ quality: 95 })
    .toBuffer();
}

// Auto-trim (bo'sh/qora chegaralarni kesish)
export async function autoTrimImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .trim({ background: "#ffffff", threshold: 10 })
    .jpeg({ quality: 95 })
    .toBuffer();
}
