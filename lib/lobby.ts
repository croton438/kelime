export const MIN_LOBBY_PLAYERS = 2;
export const MAX_LOBBY_PLAYERS = 5;

export function canJoinLobby(activePlayerCount: number) {
  return Number.isInteger(activePlayerCount) && activePlayerCount >= 0 && activePlayerCount < MAX_LOBBY_PLAYERS;
}

export function canStartLobby(players: Array<{ ready?: boolean; connected: boolean }>) {
  const active = players.filter((player) => player.connected);
  return active.length >= MIN_LOBBY_PLAYERS && active.length <= MAX_LOBBY_PLAYERS;
}
