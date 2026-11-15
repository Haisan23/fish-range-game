// Thin helper for MongoDB connectivity used by API routes and health checks.
import { MongoClient, Db } from "mongodb";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export function mongoEnabled(): boolean {
  return !!process.env.MONGODB_URI;
}

export async function connectDB(): Promise<Db> {
  if (cachedDb) return cachedDb;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  cachedClient = new MongoClient(uri, {
    connectTimeoutMS: 5000,
    socketTimeoutMS: 30000,
    maxPoolSize: 10,
  });
  await cachedClient.connect();
  cachedDb = cachedClient.db(process.env.MONGODB_DB_NAME || "fishrange");
  return cachedDb;
}

export async function disconnectDB(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
}