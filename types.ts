
export type PlayerID = number;
export type GameMode = 'local' | 'online';

export interface CapitalUpgrade {
  targetLevel: number;
  remaining: number;
}

export interface City {
  x: number;
  y: number;
  id: string;
}

export interface Player {
  id: PlayerID;
  color: string;
  name: string;
  capital: { x: number; y: number } | null;
  capitalLevel: number;
  capitalUpgrade: CapitalUpgrade | null;
  cities: City[];
  territory: Set<string>;
  originalTerritories: Set<string>;
  warWith: Set<PlayerID>;
  truceWith: Set<PlayerID>;
  truceTurns: Record<PlayerID, number>;
  truceProposals: Set<PlayerID>;
  eliminated: boolean;
}

export type CellType = 'capital' | 'city' | 'land' | 'warland' | 'warcity' | null;

export interface Cell {
  owner: PlayerID | null;
  type: CellType;
  control: string | null; // e.g., 'capital' or 'city0'
  level: number;
}

export type GamePhase = 'setup' | 'play' | 'end' | 'lobby';

export interface GameLogEntry {
  turn: number;
  playerId: PlayerID;
  text: string;
  type?: 'war' | 'peace' | 'growth' | 'info';
}

export interface NetworkMessage {
  type: 'SYNC_STATE' | 'ACTION_REQUEST' | 'LOBBY_UPDATE' | 'START_GAME' | 'CHAT';
  payload: any;
  senderId?: string;
}
