// MongoDB connection helper (Mongoose).
// Next.js dev mode reloads files often, so we cache the connection on `globalThis`
// to avoid opening a new connection on every reload.
import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}
const globalForMongoose = globalThis as unknown as { _mongooseCache?: MongooseCache };
const cache: MongooseCache = (globalForMongoose._mongooseCache ??= { conn: null, promise: null });

/** True when a MongoDB connection string has been configured in .env.local */
export function mongoEnabled(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000, // fail fast with a clear error instead of hanging
    });
  }
  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null; // allow a retry on the next request
    throw err;
  }
  return cache.conn;
}