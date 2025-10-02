export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getDeviceId, errorResponse } from '@/lib/api-helpers';

interface Board {
  id: string;
}

interface Column {
  id: string;
  board_id: string;
  title: string;
  position: number;
  created_at: string;
}

export async function POST(req: NextRequest) {
  const deviceId = getDeviceId(req);
  if (!deviceId) {
    return errorResponse('Missing or invalid X-Device-Id header', 400);
  }

  try {
    const body = await req.json();
    const { title } = body;

    if (!title || typeof title !== 'string') {
      return errorResponse('Missing or invalid title', 400);
    }

    // Find caller's board
    const boardResult = await query<Board>(
      'SELECT id FROM kb_boards WHERE device_id = $1',
      [deviceId]
    );

    if (boardResult.rows.length === 0) {
      return errorResponse('Board not found for this device', 404);
    }

    const board = boardResult.rows[0];

    // Get max position and insert new column
    const positionResult = await query<{ max_pos: number | null }>(
      'SELECT COALESCE(MAX(position), -1) as max_pos FROM kb_columns WHERE board_id = $1',
      [board.id]
    );

    const newPosition = (positionResult.rows[0].max_pos ?? -1) + 1;

    const columnResult = await query<Column>(
      'INSERT INTO kb_columns (board_id, title, position) VALUES ($1, $2, $3) RETURNING *',
      [board.id, title, newPosition]
    );

    return NextResponse.json({ column: columnResult.rows[0] });
  } catch (e: unknown) {
    const error = e as Error;
    console.error('Create column error:', e);
    return errorResponse(error?.message ?? 'Database error', 500);
  }
}
