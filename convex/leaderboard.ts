import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const top = query({ args: { limit: v.optional(v.number()) }, handler: async (ctx, args) => {
  const limit = Math.min(100, Math.max(1, args.limit ?? 20));
  const rows = await ctx.db.query("scores").withIndex("by_score").order("desc").take(500);
  const seen = new Set<string>();
  return rows.filter((row) => { const key = row.username.normalize("NFC").toLocaleLowerCase("tr"); if (seen.has(key)) return false; seen.add(key); return true; }).slice(0, limit).map(({ username, score, correct, mode, createdAt }) => ({ username, score, correct, mode, createdAt }));
}});

export const record = mutation({ args: { sessionId: v.string(), score: v.number(), correct: v.number(), wrong: v.number(), lettersTaken: v.number(), mode: v.union(v.literal("single"), v.literal("multiplayer")), gameId: v.optional(v.id("games")) }, handler: async (ctx, args) => {
  const user = await ctx.db.query("users").withIndex("by_session", (q) => q.eq("sessionId", args.sessionId)).first();
  if (!user) throw new ConvexError("Oturum bulunamadı.");
  if (!Number.isInteger(args.score) || args.score < -9800 || args.score > 9800) throw new ConvexError("Geçersiz skor.");
  if (args.score <= user.bestScore) return null;
  // Çok oyunculu skorları gamePlayers kaydından doğrulanır; tek oyunculu istemci kaydı yalnızca kişisel tabloya adaydır.
  const scoreId = await ctx.db.insert("scores", { userId: user._id, username: user.username, score: args.score, correct: args.correct, wrong: args.wrong, lettersTaken: args.lettersTaken, mode: args.mode, gameId: args.gameId, createdAt: Date.now() });
  await ctx.db.patch(user._id, { gamesPlayed: user.gamesPlayed + 1, totalScore: user.totalScore + args.score, bestScore: Math.max(user.bestScore, args.score), updatedAt: Date.now() });
  return scoreId;
}});
