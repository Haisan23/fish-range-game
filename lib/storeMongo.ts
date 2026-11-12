// Backend 2: MongoDB. Same function names as storeFile.ts so the rest of the app doesn't care which is used.
import { connectDB } from "./db";
import { ScoreModel, UserModel } from "./models";
import type { ScoreEntry, User } from "./types";

export async function findUser(username: string): Promise<User | undefined> {
  await connectDB();
  const u = await UserModel.findOne({ usernameLower: username.toLowerCase() }).lean();
  if (!u) return undefined;
  return { username: u.username, salt: u.salt, hash: u.hash, createdAt: new Date(u.createdAt).toISOString() };
}

export async function addUser(user: User): Promise<void> {
  await connectDB();
  try {
    await UserModel.create({
      username: user.username,
      usernameLower: user.username.toLowerCase(),
      salt: user.salt,
      hash: user.hash,
    });
  } catch (err) {
    // 11000 = MongoDB "duplicate key" (unique index on usernameLower)
    if ((err as { code?: number }).code === 11000) throw new Error("USERNAME_TAKEN");
    throw err;
  }
}

export async function addScore(entry: ScoreEntry): Promise<void> {
  await connectDB();
  await ScoreModel.create({
    username: entry.username,
    score: entry.score,
    level: entry.level,
    accuracy: entry.accuracy,
  });
}

export async function topScores(limit = 10): Promise<ScoreEntry[]> {
  await connectDB();
  const rows = await ScoreModel.find().sort({ score: -1 }).limit(limit).lean();
  return rows.map((r) => ({
    username: r.username,
    score: r.score,
    level: r.level,
    accuracy: r.accuracy,
    date: new Date(r.createdAt).toISOString(),
  }));
}