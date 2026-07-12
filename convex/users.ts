import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

const cleanName = (name: string) => name.replace(/[<>]/g, "").trim().replace(/\s+/g, " ").slice(0, 20);

export const ensureGuest = mutation({ args: { sessionId: v.string(), username: v.string() }, handler: async (ctx, args) => {
  if (args.sessionId.length < 24) throw new ConvexError("Geçersiz oturum.");
  const username = cleanName(args.username); if (username.length < 2) throw new ConvexError("Oyuncu adı 2–20 karakter olmalı.");
  const normalizedUsername = username.toLocaleLowerCase("tr");
  const existing = await ctx.db.query("users").withIndex("by_session", (q) => q.eq("sessionId", args.sessionId)).unique();
  const owner = await ctx.db.query("users").withIndex("by_name", (q) => q.eq("normalizedUsername", normalizedUsername)).unique();
  if (owner && owner.sessionId !== args.sessionId) throw new ConvexError("Bu oyuncu adı daha önce alınmış.");
  if (existing) { await ctx.db.patch(existing._id, { username, normalizedUsername, updatedAt: Date.now() }); return existing._id; }
  return ctx.db.insert("users", { sessionId: args.sessionId, username, normalizedUsername, gamesPlayed: 0, bestScore: 0, totalScore: 0, createdAt: Date.now(), updatedAt: Date.now() });
}});

export const me = query({ args: { sessionId: v.string() }, handler: (ctx, args) => ctx.db.query("users").withIndex("by_session", (q) => q.eq("sessionId", args.sessionId)).unique() });
