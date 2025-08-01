import mongoose from 'mongoose';
import { logger } from '@/lib/utils'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

let cachedConnection: typeof mongoose | null = null;

export async function connectToDatabase() {
  if (cachedConnection) return cachedConnection;

  try {
    const connection = await mongoose.connect(MONGODB_URI as string, {
      serverSelectionTimeoutMS: 5000,
    });
    cachedConnection = connection;
    logger.log('MongoDB connected');
    return connection;
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    throw error;
  }
}
