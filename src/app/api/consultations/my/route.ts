// app/api/consultations/my/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { ConsultationModel, LawyerModel } from '@/lib/models'

export async function GET(request: NextRequest) {
  // For now, get userId from query param for simplicity
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await connectToDatabase();
    const consultations = await ConsultationModel.find({ userId }).sort({ scheduledAt: -1 }).lean();
    // Fetch all lawyers for mapping
    const lawyersArr = await LawyerModel.find({}).lean();
    const lawyerMap = Object.fromEntries(lawyersArr.map(l => [l.id, l]));
    const result = consultations.map(c => ({
      id: c.id,
      lawyerName: lawyerMap[c.lawyerId]?.fullName || '',
      datetime: c.scheduledAt,
      method: c.method,
      notes: c.notes,
      roomUrl: c.roomUrl,
      status: c.status
    }));
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch consultations' }, { status: 500 });
  }
}
