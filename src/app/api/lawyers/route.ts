// app/api/lawyers/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { LawyerModel } from '@/lib/models';
import { logger } from '@/lib/utils'

export async function GET() {
  try {
    await connectToDatabase();
    const lawyers = await LawyerModel.find({}).lean();
    // Optionally, map/format as needed for the frontend
    return NextResponse.json(lawyers);
  } catch (error) {
    logger.error('Error fetching lawyers:', error);
    return NextResponse.json({ error: 'Failed to fetch lawyers' }, { status: 500 });
  }
}