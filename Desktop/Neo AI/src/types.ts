import { Context, SessionFlavor } from "grammy";

// Session ma'lumotlari
export interface SessionData {
  mode: "idle" | "chat" | "image" | "edit_bg";
  imagePrompt: string | null;
  lastImageFileId: string | null;
  lastImagePrompt: string | null;
}

// Bot kontekst turi
export type MyContext = Context & SessionFlavor<SessionData>;

// Kredit paketi
export interface CreditPackage {
  id: string;
  stars: number;
  credits: number;
  label: string;
  bonus: string;
}
