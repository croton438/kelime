import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({ sessionId: v.string(), username: v.string(), normalizedUsername: v.string(), gamesPlayed: v.number(), bestScore: v.number(), totalScore: v.number(), createdAt: v.number(), updatedAt: v.number() }).index("by_session", ["sessionId"]).index("by_name", ["normalizedUsername"]).index("by_best_score", ["bestScore"]),
  lobbies: defineTable({ code: v.string(), hostUserId: v.id("users"), status: v.union(v.literal("waiting"), v.literal("playing"), v.literal("finished")), mode: v.union(v.literal("online"), v.literal("classic"), v.literal("family")), durationMinutes: v.number(), createdAt: v.number() }).index("by_code", ["code"]),
  lobbyMembers: defineTable({ lobbyId: v.id("lobbies"), userId: v.id("users"), username: v.string(), ready: v.boolean(), connected: v.boolean(), order: v.number(), joinedAt: v.number(), currentQuestion: v.optional(v.number()), score: v.optional(v.number()), finished: v.optional(v.boolean()) }).index("by_lobby", ["lobbyId"]).index("by_lobby_user", ["lobbyId", "userId"]),
  questions: defineTable({ answer: v.string(), normalizedAnswer: v.string(), letterCount: v.number(), clue: v.string(), originLanguage: v.string(), acceptedAnswers: v.array(v.string()), isVerified: v.boolean(), isActive: v.boolean() }).index("by_length", ["letterCount"]).index("by_answer", ["normalizedAnswer"]),
  games: defineTable({ lobbyId: v.optional(v.id("lobbies")), ownerUserId: v.optional(v.id("users")), mode: v.union(v.literal("online"), v.literal("classic"), v.literal("family"), v.literal("single")), questionSeed: v.optional(v.string()), status: v.string(), createdAt: v.number(), finishedAt: v.optional(v.number()) }).index("by_lobby", ["lobbyId"]).index("by_owner", ["ownerUserId"]),
  gamePlayers: defineTable({ gameId: v.id("games"), userId: v.id("users"), score: v.number(), order: v.number() }).index("by_game", ["gameId"]),
  gameQuestions: defineTable({ gameId: v.id("games"), questionId: v.id("questions"), order: v.number() }).index("by_game", ["gameId"]),
  playerQuestionStates: defineTable({ gameId: v.id("games"), playerId: v.id("gamePlayers"), questionId: v.id("questions"), revealedPositions: v.array(v.number()), currentValue: v.number(), completed: v.boolean(), answerDeadline: v.optional(v.number()) }).index("by_player", ["playerId"]),
  answerAttempts: defineTable({ gameId: v.id("games"), playerId: v.id("gamePlayers"), guess: v.string(), createdAt: v.number() }).index("by_game", ["gameId"]),
  gameEvents: defineTable({ gameId: v.id("games"), type: v.string(), createdAt: v.number() }).index("by_game", ["gameId"]),
  adminSessions: defineTable({ tokenHash: v.string(), expiresAt: v.number() }).index("by_hash", ["tokenHash"]),
  tdkCache: defineTable({ word: v.string(), payload: v.string(), checkedAt: v.number() }).index("by_word", ["word"]),
  scores: defineTable({ userId: v.id("users"), username: v.string(), score: v.number(), correct: v.number(), wrong: v.number(), lettersTaken: v.number(), mode: v.union(v.literal("single"), v.literal("multiplayer")), gameId: v.optional(v.id("games")), createdAt: v.number() }).index("by_score", ["score"]).index("by_user", ["userId"]),
});
