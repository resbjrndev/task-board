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

interface TaskOwnership {
  task_id: string;
  column_id: string;
  board_id: string;
  device_id: string;
}

async function verifyOwnership(deviceId: string, taskId: string): Promise<boolean> {
  const result = await query<TaskOwnership>(
    `SELECT t.id as task_id, t.column_id, c.board_id, b.device_id
     FROM kb_tasks t
     JOIN kb_columns c ON t.column_id = c.id
     JOIN kb_boards b ON c.board_id = b.id
     WHERE t.id = $1 AND b.device_id = $2`,
    [taskId, deviceId]
  );
  return result.rows.length > 0;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const deviceId = getDeviceId(req);
  if (!deviceId) {
    return errorResponse('Missing or invalid X-Device-Id header', 400);
  }

  const { taskId } = await params;

  try {
    const body = await req.json();
    const { title, description, columnId } = body;

    // Verify ownership
    const isOwner = await verifyOwnership(deviceId, taskId);
    if (!isOwner) {
      return errorResponse('Task not found or access denied', 404);
    }

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }

    if (columnId !== undefined) {
      // Verify new column ownership if moving task
      const columnCheck = await query<{ column_id: string }>(
        `SELECT c.id as column_id
         FROM kb_columns c
         JOIN kb_boards b ON c.board_id = b.id
         WHERE c.id = $1 AND b.device_id = $2`,
        [columnId, deviceId]
      );

      if (columnCheck.rows.length === 0) {
        return errorResponse('Target column not found or access denied', 404);
      }

      updates.push(`column_id = $${paramCount++}`);
      values.push(columnId);
    }

    if (updates.length === 0) {
      return errorResponse('No valid fields to update', 400);
    }

    values.push(taskId);
    const updateQuery = `UPDATE kb_tasks SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await query<Task>(updateQuery, values);

    return NextResponse.json({ task: result.rows[0] });
  } catch (e: unknown) {
    const error = e as Error;
    console.error('Update task error:', e);
    return errorResponse(error?.message ?? 'Database error', 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const deviceId = getDeviceId(req);
  if (!deviceId) {
    return errorResponse('Missing or invalid X-Device-Id header', 400);
  }

  const { taskId } = await params;

  try {
    // Verify ownership
    const isOwner = await verifyOwnership(deviceId, taskId);
    if (!isOwner) {
      return errorResponse('Task not found or access denied', 404);
    }

    // Delete task
    await query('DELETE FROM kb_tasks WHERE id = $1', [taskId]);

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const error = e as Error;
    console.error('Delete task error:', e);
    return errorResponse(error?.message ?? 'Database error', 500);
  }
}
