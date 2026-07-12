import { describe, expect, it } from "vitest";
import { canJoinLobby, canStartLobby, MAX_LOBBY_PLAYERS } from "./lobby";

describe("2-5 oyunculu lobi", () => {
  it("dördüncü ve beşinci oyuncuyu kabul eder", () => {
    expect(canJoinLobby(3)).toBe(true);
    expect(canJoinLobby(4)).toBe(true);
  });
  it("altıncı oyuncuyu reddeder", () => {
    expect(MAX_LOBBY_PLAYERS).toBe(5);
    expect(canJoinLobby(5)).toBe(false);
  });
  it("beş hazır oyuncuyla oyunu başlatır", () => {
    expect(canStartLobby(Array.from({ length: 5 }, () => ({ ready: true, connected: true })))).toBe(true);
  });
  it("hazır onayı olmadan iki oyuncuyla başlatır", () => {
    expect(canStartLobby([{ connected: true }, { connected: true }])).toBe(true);
  });
});
