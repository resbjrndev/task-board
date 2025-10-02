export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getDeviceId, errorResponse } from '@/lib/api-helpers';

interface Column {
  id: string;
  board_id: string;
  title: string;
  position: number;
  created_at: string;
}

interface ColumnOwnership {
  column_id: string;
  board_id: string;
  device_id: string;
}

async function verifyOwnership(deviceId: string, columnId: string): Promise<boolean> {
  const result = await query<ColumnOwnership>(
    `SELECT c.id as column_id, c.board_id, b.device_id
     FROM kb_columns c
     JOIN kb_boards b ON c.board_id = b.id
     WHERE c.id = $1 AND b.device_id = $2`,
    [columnId, deviceId]
  );
  return result.rows.length > 0;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ columnId: string }> }
) {
  const deviceId = getDeviceId(req);
  if (!deviceId) {
    return errorResponse('Missing or invalid X-Device-Id header', 400);
  }

  const { columnId } = await params;

  try {
    const body = await req.json();
    const { title } = body;

    if (!title || typeof title !== 'string') {
      return errorResponse('Missing or invalid title', 400);
    }

    // Verify ownership
    const isOwner = await verifyOwnership(deviceId, columnId);
    if (!isOwner) {
      return errorResponse('Column not found or access denied', 404);
    }

    // Update title
    const result = await query<Column>(
      'UPDATE kb_columns SET title = $1 WHERE id = $2 RETURNING *',
      [title, columnId]
    );

    return NextResponse.json({ column: result.rows[0] });
  } catch (e: unknown) {
    const error = e as Error;
    console.error('Update column error:', e);
    return errorResponse(error?.message ?? 'Database error', 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ columnId: string }> }
) {
  const deviceId = getDeviceId(req);
  if (!deviceId) {
    return errorResponse('Missing or invalid X-Device-Id header', 400);
  }

  const { columnId } = await params;

  try {
    // Verify ownership
    const isOwner = await verifyOwnership(deviceId, columnId);
    if (!isOwner) {
      return errorResponse('Column not found or access denied', 404);
    }

    // Delete column (tasks cascade via FK)
    await query('DELETE FROM kb_columns WHERE id = $1', [columnId]);

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const error = e as Error;
    console.error('Delete column error:', e);
    return errorResponse(error?.message ?? 'Database error', 500);
  }
}
