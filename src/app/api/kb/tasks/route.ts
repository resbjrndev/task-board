export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getDeviceId, errorResponse } from '@/lib/api-helpers';

interface Task {
  id: string;
  column_id: string;
  title: string;
  description: string | null;
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
    const { columnId, title, description } = body;

    if (!columnId || typeof columnId !== 'string') {
      return errorResponse('Missing or invalid columnId', 400);
    }

    if (!title || typeof title !== 'string') {
      return errorResponse('Missing or invalid title', 400);
    }

    // Verify column ownership
    const ownershipResult = await query<{ column_id: string }>(
      `SELECT c.id as column_id
       FROM kb_columns c
       JOIN kb_boards b ON c.board_id = b.id
       WHERE c.id = $1 AND b.device_id = $2`,
      [columnId, deviceId]
    );

    if (ownershipResult.rows.length === 0) {
      return errorResponse('Column not found or access denied', 404);
    }

    // Get max position and insert new task
    const positionResult = await query<{ max_pos: number | null }>(
      'SELECT COALESCE(MAX(position), -1) as max_pos FROM kb_tasks WHERE column_id = $1',
      [columnId]
    );

    const newPosition = (positionResult.rows[0].max_pos ?? -1) + 1;

    const taskResult = await query<Task>(
      'INSERT INTO kb_tasks (column_id, title, description, position) VALUES ($1, $2, $3, $4) RETURNING *',
      [columnId, title, description || null, newPosition]
    );

    console.log('kb: create task', { title, columnId });

    return NextResponse.json({ task: taskResult.rows[0] });
  } catch (e: unknown) {
    const error = e as Error;
    console.error('Create task error:', e);
    return errorResponse(error?.message ?? 'Database error', 500);
  }
}
