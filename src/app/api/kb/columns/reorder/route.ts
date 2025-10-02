export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getDeviceId } from '@/lib/api-helpers';

export async function PATCH(req: NextRequest) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return NextResponse.json({ error: 'Missing device id' }, { status: 400 });

  const { ordered_ids }: { ordered_ids: string[] } = await req.json();
  if (!Array.isArray(ordered_ids) || !ordered_ids.length)
    return NextResponse.json({ error: 'ordered_ids required' }, { status: 400 });

  // Ensure board for this device
  const b = await query<{ id: string }>('select id from kb_boards where device_id=$1', [deviceId]);
  if (!b.rows[0]) return NextResponse.json({ error: 'Board not found' }, { status: 404 });

  // Only reorder columns that belong to this board
  await query(
    `with input as (
       select id, ord-1 as position
       from unnest($1::uuid[]) with ordinality as t(id, ord)
     )
     update kb_columns c
        set position = i.position
       from input i
      where c.id = i.id and c.board_id = $2`,
    [ordered_ids, b.rows[0].id]
  );

  return NextResponse.json({ success: true });
}
