// MongoDB Atlas storage backend.
// Used automatically when MONGODB_URI is set.
import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import type { ScoreEntry, User } from "./types";

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

export async function scoresCollection(): Promise<Collection<ScoreEntry>> {
  const db = await connectDb();
  return db.collection<ScoreEntry>("scores");
}

export async function ensureIndexes(): Promise<void> {
  const users = await usersCollection();
  const scores = await scoresCollection();

  try {
    await users.createIndex({ username: 1 }, { unique: true, name: "username_unique" });
  } catch {
    // Index already exists
  }

  try {
    await scores.createIndex({ score: -1 }, { name: "score_desc" });
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

export async function addScore(entry: ScoreEntry): Promise<void> {
  const scores = await scoresCollection();
  await scores.insertOne({
    ...entry,
    _id: new ObjectId(),
  });
}

export async function topScores(limit = 10): Promise<ScoreEntry[]> {
  const scores = await scoresCollection();
  const docs = await scores
    .find({})
    .sort({ score: -1 })
    .limit(limit)
    .toArray();
  return docs.map((d) => toPlain(d)!);
}