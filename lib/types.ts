// Shapes shared by both storage backends (JSON file and MongoDB).
export interface User {
  username: string;
  salt: string;
  hash: string;
  createdAt: string; // ISO date
}

export interface ScoreEntry {
  username: string;
  score: number;
  level: number;
  accuracy: number; // percentage 0-100
  date: string; // ISO date
}