export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const r = await query<{ now: string }>('select now()::text as now');
    return NextResponse.json({ ok: true, db_time: r.rows[0].now });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'unknown' }, { status: 500 });
  }
}
