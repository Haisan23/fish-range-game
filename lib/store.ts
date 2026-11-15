// Storage backend selector.
// When MONGODB_URI is set, use MongoDB Atlas. Otherwise fall back to local JSON files.
import type { ScoreEntry, User } from "./types";

export type { ScoreEntry, User };

let backend: "json" | "mongo" = "json";
let mongoModule: typeof import("./mongo") | null = null;

async function getBackend() {
  if (process.env.MONGODB_URI && backend !== "mongo") {
    mongoModule = await import("./mongo");
    await mongoModule.ensureIndexes();
    backend = "mongo";
  }
  return backend;
}

export async function findUser(username: string): Promise<User | undefined> {
  if (await getBackend() === "mongo" && mongoModule) {
    return mongoModule.findUser(username);
  }
  const { findUser: jsonFindUser } = await import("./storeFile");
  return jsonFindUser(username);
}

export async function addUser(user: User): Promise<void> {
  if (await getBackend() === "mongo" && mongoModule) {
    return mongoModule.addUser(user);
  }
  const { addUser: jsonAddUser } = await import("./storeFile");
  return jsonAddUser(user);
}

export async function addScore(entry: ScoreEntry): Promise<void> {
  if (await getBackend() === "mongo" && mongoModule) {
    return mongoModule.addScore(entry);
  }
  const { addScore: jsonAddScore } = await import("./storeFile");
  return jsonAddScore(entry);
}

export async function topScores(limit = 10): Promise<ScoreEntry[]> {
  if (await getBackend() === "mongo" && mongoModule) {
    return mongoModule.topScores(limit);
  }
  const { topScores: jsonTopScores } = await import("./storeFile");
  return jsonTopScores(limit);
}

export async function connectDb() {
  if (mongoModule) return mongoModule.connectDb();
  throw new Error("MongoDB backend not available");
}

export async function disconnectDb() {
  if (mongoModule) return mongoModule.disconnectDb();
}