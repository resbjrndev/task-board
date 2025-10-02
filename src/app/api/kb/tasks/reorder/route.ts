export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getDeviceId } from '@/lib/api-helpers';

export async function PATCH(req: NextRequest) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return NextResponse.json({ error: 'Missing device id' }, { status: 400 });

  const { column_id, ordered_ids }: { column_id: string; ordered_ids: string[] } = await req.json();
  if (!column_id || !Array.isArray(ordered_ids) || !ordered_ids.length)
    return NextResponse.json({ error: 'column_id and ordered_ids required' }, { status: 400 });

  // Ownership check: column must be in the caller's board
  const chk = await query(
    `select c.id
       from kb_columns c
       join kb_boards b on b.id = c.board_id
      where c.id = $1 and b.device_id = $2`,
    [column_id, deviceId]
  );
  if (!chk.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await query(
    `with input as (
       select id, ord-1 as position
       from unnest($1::uuid[]) with ordinality as t(id, ord)
     )
     update kb_tasks t
        set position = i.position
       from input i
      where t.id = i.id and t.column_id = $2`,
    [ordered_ids, column_id]
  );

  return NextResponse.json({ success: true });
}
