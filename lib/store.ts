// The rest of the app imports ONLY from this file.
// If MONGODB_URI is set -> MongoDB. Otherwise -> local JSON files.
import { mongoEnabled } from "./db";
import * as file from "./storeFile";
import * as mongo from "./storeMongo";
import type { ScoreEntry, User } from "./types";

export type { ScoreEntry, User } from "./types";

const backend = () => (mongoEnabled() ? mongo : file);

export const findUser = (username: string): Promise<User | undefined> => backend().findUser(username);
export const addUser = (user: User): Promise<void> => backend().addUser(user);
export const addScore = (entry: ScoreEntry): Promise<void> => backend().addScore(entry);
export const topScores = (limit = 10): Promise<ScoreEntry[]> => backend().topScores(limit);