// Backend 1: tiny JSON-file "database" in the /data folder (git-ignored).
// Used automatically when MONGODB_URI is NOT set, so the app always runs locally.
import { promises as fs } from "fs";
import path from "path";
import type { ScoreEntry, User } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SCORES_FILE = path.join(DATA_DIR, "scores.json");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

export async function findUser(username: string): Promise<User | undefined> {
  const users = await readJson<User[]>(USERS_FILE, []);
  return users.find((u) => u.username.toLowerCase() === username.toLowerCase());
}

export async function addUser(user: User): Promise<void> {
  const users = await readJson<User[]>(USERS_FILE, []);
  if (users.some((u) => u.username.toLowerCase() === user.username.toLowerCase())) {
    throw new Error("USERNAME_TAKEN");
  }
  users.push(user);
  await writeJson(USERS_FILE, users);
}

export async function addScore(entry: ScoreEntry): Promise<void> {
  const scores = await readJson<ScoreEntry[]>(SCORES_FILE, []);
  scores.push(entry);
  await writeJson(SCORES_FILE, scores);
}

export async function topScores(limit = 10): Promise<ScoreEntry[]> {
  const scores = await readJson<ScoreEntry[]>(SCORES_FILE, []);
  return scores.sort((a, b) => b.score - a.score).slice(0, limit);
}