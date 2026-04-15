import { InlineKeyboard } from "grammy";
import { config } from "../config";

// Asosiy menyu
export function mainMenuKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("💬 AI Suhbat", "menu:chat")
    .text("🎨 Rasm Yaratish", "menu:image")
    .row()
    .text("💰 Kredit Sotib Olish", "menu:buy")
    .text("👤 Profilim", "menu:profile")
    .row()
    .text("🗑 Tarixni O'chirish", "menu:clear_history")
    .text("❓ Yordam", "menu:help");
}

// Kredit paketlari
export function creditsPackagesKeyboard(): InlineKeyboard {
  const kb = new InlineKeyboard();

  config.packages.forEach((pkg, index) => {
    const label = `⭐ ${pkg.stars} yulduz → ${pkg.label} ${pkg.bonus}`.trim();
    kb.text(label, `buy:${pkg.id}`);
    if (index % 2 === 1) kb.row();
  });

  return kb.row().text("🔙 Orqaga", "menu:main");
}

// Profil menyusi
export function profileKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("📊 Statistika", "profile:stats")
    .text("🗑 Tarixni Tozalash", "profile:clear_history")
    .row()
    .text("🔙 Orqaga", "menu:main");
}

// Rasm yaratib bo'lgandan keyingi tugmalar
export function imageActionsKeyboard(prompt: string): InlineKeyboard {
  const kb = new InlineKeyboard()
    .text("✨ Tiniqlash",        "edit:sharpen")
    .text("🌫 Xiralashtirish",   "edit:blur")
    .row()
    .text("🖼 Fon O'zgartirish", "edit:background")
    .text("✂️ Kesish",           "edit:crop")
    .row()
    .text("🗑 Element O'chirish","edit:trim");

  // Prompt bo'lsa "Qayta Yaratish" tugmasini qo'shamiz
  if (prompt && prompt.trim().length > 0) {
    kb.text("🔄 Qayta Yaratish", `img:regen:${prompt.slice(0, 40)}`);
  }

  return kb.row().text("🔙 Bosh Menyu", "menu:main");
}

// Tiniqlash darajalari
export function sharpenLevelKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("✨ Yengil",   "edit:sharpen:low")
    .text("✨✨ O'rta",  "edit:sharpen:medium")
    .text("✨✨✨ Kuchli","edit:sharpen:high")
    .row()
    .text("🔙 Orqaga",  "edit:back");
}

// Xiralashtirish darajalari
export function blurLevelKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("🌫 Yengil",   "edit:blur:low")
    .text("🌫🌫 O'rta",  "edit:blur:medium")
    .text("🌫🌫🌫 Kuchli","edit:blur:high")
    .row()
    .text("🎭 Portret Effekti", "edit:blur:portrait")
    .row()
    .text("🔙 Orqaga",  "edit:back");
}

// Kesish nisbatlari
export function cropRatioKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("⬛ 1:1 (Kvadrat)",  "edit:crop:1:1")
    .text("🖥 16:9 (Kino)",    "edit:crop:16:9")
    .row()
    .text("📺 4:3 (TV)",       "edit:crop:4:3")
    .text("📱 9:16 (Reels)",   "edit:crop:9:16")
    .row()
    .text("🖼 3:2 (Foto)",     "edit:crop:3:2")
    .text("📷 2:3 (Portret)",  "edit:crop:2:3")
    .row()
    .text("🔙 Orqaga",         "edit:back");
}

// Element o'chirish (qirqish)
export function trimSideKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("⬆️ Yuqorisini",   "edit:trim:top")
    .text("⬇️ Pastini",      "edit:trim:bottom")
    .row()
    .text("⬅️ Chapini",      "edit:trim:left")
    .text("➡️ O'ngini",      "edit:trim:right")
    .row()
    .text("🔲 Auto Kesish",  "edit:trim:auto")
    .row()
    .text("🔙 Orqaga",       "edit:back");
}

// Fon presetlari
export function backgroundPresetsKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("🌿 Tabiat",    "edit:bg:bg_nature")
    .text("🏙 Shahar",    "edit:bg:bg_city")
    .row()
    .text("🏖 Plyaj",     "edit:bg:bg_beach")
    .text("📸 Studiya",   "edit:bg:bg_studio")
    .row()
    .text("🌌 Kosmos",    "edit:bg:bg_space")
    .text("🎨 Gradient",  "edit:bg:bg_gradient")
    .row()
    .text("✏️ O'z Fonimni Yozaman", "edit:bg:custom")
    .row()
    .text("🔙 Orqaga",    "edit:back");
}

// Tasdiqlash tugmasi
export function confirmKeyboard(
  confirmData: string,
  cancelData: string
): InlineKeyboard {
  return new InlineKeyboard()
    .text("✅ Ha, tozala", confirmData)
    .text("❌ Bekor qilish", cancelData);
}

// Orqaga tugmasi
export function backKeyboard(data: string = "menu:main"): InlineKeyboard {
  return new InlineKeyboard().text("🔙 Orqaga", data);
}

// Kredit sotib olish taklifi
export function buyCreditsKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("💰 Kredit Sotib Olish", "menu:buy")
    .text("🔙 Menyu", "menu:main");
}
