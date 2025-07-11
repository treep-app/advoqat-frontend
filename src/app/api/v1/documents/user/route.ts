import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { GeneratedDocumentModel } from '@/lib/models';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Get userId from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    await connectToDatabase();
    const documents = await GeneratedDocumentModel.find({ userId }).sort({ createdAt: -1 }).lean();

    // Optionally, remove _id or sensitive fields
    const cleanDocs = documents.map(({ _id, ...doc }) => ({ id: _id?.toString(), ...doc }));

    return NextResponse.json({ success: true, documents: cleanDocs });
  } catch (error) {
    console.error('Error fetching user documents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 