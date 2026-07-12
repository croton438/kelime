import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

const MAX_PLAYERS = 5;
const MIN_PLAYERS = 2;

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const lobby = await ctx.db.query("lobbies").withIndex("by_code", (q) => q.eq("code", code.toUpperCase())).unique();
    if (!lobby) return null;
    const members = await ctx.db.query("lobbyMembers").withIndex("by_lobby", (q) => q.eq("lobbyId", lobby._id)).collect();
    return { ...lobby, members: members.sort((a, b) => a.order - b.order), capacity: MAX_PLAYERS };
  },
});

export const join = mutation({
  args: { lobbyId: v.id("lobbies"), userId: v.id("users"), username: v.string() },
  handler: async (ctx, args) => {
    const lobby = await ctx.db.get(args.lobbyId);
    if (!lobby || lobby.status !== "waiting") throw new ConvexError("Bu lobi katılıma açık değil.");
    const members = await ctx.db.query("lobbyMembers").withIndex("by_lobby", (q) => q.eq("lobbyId", args.lobbyId)).collect();
    const existing = members.find((member) => member.userId === args.userId);
    if (existing) { await ctx.db.patch(existing._id, { connected: true }); return existing._id; }
    const active = members.filter((member) => member.connected);
    if (active.length >= MAX_PLAYERS) throw new ConvexError("Lobi dolu (en fazla 5 oyuncu).");
    const normalized = args.username.trim().toLocaleLowerCase("tr");
    if (normalized.length < 2 || normalized.length > 20) throw new ConvexError("Oyuncu adı 2–20 karakter olmalı.");
    if (members.some((member) => member.username.toLocaleLowerCase("tr") === normalized)) throw new ConvexError("Bu oyuncu adı lobide kullanılıyor.");
    return ctx.db.insert("lobbyMembers", { ...args, username: args.username.trim(), ready: false, connected: true, order: members.length, joinedAt: Date.now() });
  },
});

export const start = mutation({
  args: { lobbyId: v.id("lobbies"), requestingUserId: v.id("users") },
  handler: async (ctx, { lobbyId, requestingUserId }) => {
    const lobby = await ctx.db.get(lobbyId);
    if (!lobby || lobby.hostUserId !== requestingUserId) throw new ConvexError("Yalnızca lobi yöneticisi başlatabilir.");
    const members = (await ctx.db.query("lobbyMembers").withIndex("by_lobby", (q) => q.eq("lobbyId", lobbyId)).collect()).filter((m) => m.connected);
    if (members.length < MIN_PLAYERS || members.length > MAX_PLAYERS) throw new ConvexError("Oyun 2–5 oyuncuyla başlayabilir.");
    await ctx.db.patch(lobbyId, { status: "playing" });
    return ctx.db.insert("games", { lobbyId, mode: lobby.mode, questionSeed: `online:${lobby.code}`, status: "active", createdAt: Date.now() });
  },
});
