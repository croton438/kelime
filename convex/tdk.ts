import { ConvexError, v } from "convex/values";
import { action } from "./_generated/server";

export const lookup = action({ args: { word: v.string(), adminToken: v.string() }, handler: async (_ctx, args) => {
  if (!process.env.ADMIN_PASSWORD || args.adminToken !== process.env.ADMIN_PASSWORD) throw new ConvexError("Yetkisiz işlem.");
  const word = args.word.normalize("NFC").trim().toLocaleUpperCase("tr");
  if (!/^[A-ZÇĞİÖŞÜ]{2,30}$/.test(word)) throw new ConvexError("Geçersiz kelime.");
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 5000);
  try { const response = await fetch(`https://sozluk.gov.tr/gts?ara=${encodeURIComponent(word)}`, { signal: controller.signal }); if (!response.ok) throw new ConvexError("TDK servisine ulaşılamadı."); const data = await response.json(); return { source: "TDK Güncel Türkçe Sözlük", officialAffiliation: false, entries: Array.isArray(data) ? data.slice(0, 10) : [] }; } finally { clearTimeout(timeout); }
}});
