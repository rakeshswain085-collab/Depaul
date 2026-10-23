
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;

type MongoCache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongoCache | undefined;
}

const cache = (globalThis.mongooseCache ??= {
  connection: null,
  promise: null,
});

export async function connectDB() {
  if (cache.connection) {
    return cache.connection;
  }

  if (!uri) {
    throw new Error(
      "MONGODB_URI is missing from the server environment",
    );
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
  }

  try {
    cache.connection = await cache.promise;
    return cache.connection;
  } catch (error) {
    cache.promise = null;

    console.error(
      "MongoDB connection failed:",
      error instanceof Error ? error.message : "Unknown database error",
    );

    throw error;
  }
}
