// Shapes shared by both storage backends (JSON file and MongoDB).
export interface User {
  username: string;
  salt: string;
  hash: string;
  createdAt: string; // ISO date
}

// A single run's stats (without username — username lives on the parent doc).
export interface ScoreRun {
  score: number;
  level: number;
  accuracy: number; // percentage 0-100
  date: string; // ISO date
}

// A score entry as returned by the API / scoreboard (username + best run).
export interface ScoreEntry {
  username: string;
  score: number;
  level: number;
  accuracy: number;
  date: string;
}

// Document shape for the userScores collection / file (one doc per user).
export interface UserScoresDoc {
  username: string;
  scores: ScoreRun[];
}