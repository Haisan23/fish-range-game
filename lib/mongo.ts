// MongoDB Atlas storage backend.
// Used automatically when MONGODB_URI is set.
import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import type { ScoreEntry, ScoreRun, User, UserScoresDoc } from "./types";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not set");
}

const DB_NAME = process.env.MONGODB_DB_NAME || "fishrange";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectDb(): Promise<Db> {
  if (cachedDb) return cachedDb;
  if (!cachedClient) {
    cachedClient = new MongoClient(MONGODB_URI as string, {
      connectTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      maxPoolSize: 10,
    });
  }
  await cachedClient.connect();
  cachedDb = cachedClient.db(DB_NAME);
  return cachedDb;
}

export async function disconnectDb(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
}

export async function usersCollection(): Promise<Collection<User>> {
  const db = await connectDb();
  return db.collection<User>("users");
}

export async function userScoresCollection(): Promise<Collection<UserScoresDoc>> {
  const db = await connectDb();
  return db.collection<UserScoresDoc>("userScores");
}

export async function ensureIndexes(): Promise<void> {
  const users = await usersCollection();
  const scores = await userScoresCollection();

  try {
    await users.createIndex({ username: 1 }, { unique: true, name: "username_unique" });
  } catch {
    // Index already exists
  }

  try {
    await scores.createIndex({ username: 1 }, { unique: true, name: "username_unique" });
  } catch {
    // Index already exists
  }
}

function toPlain<T>(doc: T | null): T | undefined {
  if (!doc) return undefined;
  const { _id, ...rest } = doc as any;
  return rest as T;
}

export async function findUser(username: string): Promise<User | undefined> {
  const users = await usersCollection();
  const user = await users.findOne({ username: new RegExp(`^${username}$`, "i") });
  return toPlain(user);
}

export async function addUser(user: User): Promise<void> {
  const users = await usersCollection();
  try {
    await users.insertOne({
      ...user,
      _id: new ObjectId(),
    });
  } catch (err: any) {
    if (err?.code === 11000) {
      throw new Error("USERNAME_TAKEN");
    }
    throw err;
  }
}

/**
 * Save a score for a user by pushing it into their embedded scores array.
 * Uses an upsert so the first score for a user creates the document.
 */
export async function addScore(entry: ScoreEntry): Promise<void> {
  const scores = await userScoresCollection();
  const run: ScoreRun = {
    score: entry.score,
    level: entry.level,
    accuracy: entry.accuracy,
    date: entry.date,
  };
  await scores.updateOne(
    { username: entry.username },
    { $push: { scores: run } },
    { upsert: true }
  );
}

/**
 * Return the top N scores across all users, deduplicated by username
 * (each user contributes only their best score).
 */
export async function topScores(limit = 10): Promise<ScoreEntry[]> {
  const scores = await userScoresCollection();
  const docs = await scores.find({}).toArray();

  const entries: ScoreEntry[] = [];
  for (const doc of docs) {
    const plain = toPlain(doc);
    if (!plain || !plain.scores?.length) continue;
    let best: ScoreRun = plain.scores[0];
    for (const s of plain.scores) {
      if (s.score > best.score) best = s;
    }
    entries.push({ username: plain.username, ...best });
  }

  return entries
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}