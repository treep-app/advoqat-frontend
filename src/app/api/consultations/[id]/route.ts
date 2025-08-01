import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  if (body.action === 'reschedule') {
    return NextResponse.json({
      status: 'rescheduled',
      newDatetime: body.newDatetime
    })
  } else if (body.action === 'cancel') {
    return NextResponse.json({
      status: 'cancelled'
    })
  }
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
} 