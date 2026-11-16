'use server';

import mongoose from 'mongoose';

const globalWithMongoose = global as unknown as {
  mongooseConn?: typeof mongoose;
  mongoosePromise?: Promise<typeof mongoose>;
};

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (globalWithMongoose.mongooseConn) {
    return globalWithMongoose.mongooseConn;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set');
  }

  const uri = process.env.MONGODB_URI;
  // basic validation: connection string must start with mongodb:// or mongodb+srv://
  const validScheme = /^mongodb(\+srv)?:\/\//i.test(uri);
  if (!validScheme) {
    throw new Error(
      'Invalid MONGODB_URI. It must start with "mongodb://" or "mongodb+srv://".\n' +
        'Please set a valid MongoDB connection string in .env.local (MONGODB_URI) and restart the dev server.'
    );
  }

  if (!globalWithMongoose.mongoosePromise) {
    globalWithMongoose.mongoosePromise = mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB || 'smart-cart',
    });
  }

  globalWithMongoose.mongooseConn = await globalWithMongoose.mongoosePromise;
  return globalWithMongoose.mongooseConn;
}


