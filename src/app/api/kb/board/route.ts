export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getDeviceId, errorResponse } from '@/lib/api-helpers';

interface Board {
  id: string;
  device_id: string;
  title: string;
  created_at: string;
}

interface Column {
  id: string;
  board_id: string;
  title: string;
  position: number;
  created_at: string;
}

interface Task {
  id: string;
  column_id: string;
  title: string;
  description: string | null;
  position: number;
  created_at: string;
}

export async function GET(req: NextRequest) {
  const deviceId = getDeviceId(req);
  if (!deviceId) {
    return errorResponse('Missing or invalid X-Device-Id header', 400);
  }

  try {
    // Get board
    const boardResult = await query<Board>(
      'SELECT * FROM kb_boards WHERE device_id = $1',
      [deviceId]
    );

    if (boardResult.rows.length === 0) {
      return errorResponse('Board not found for this device', 404);
    }

    const board = boardResult.rows[0];

    // Get columns
    const columnsResult = await query<Column>(
      'SELECT * FROM kb_columns WHERE board_id = $1 ORDER BY position',
      [board.id]
    );

    const columns = columnsResult.rows;

    // Get all tasks
    const tasksResult = await query<Task>(
      `SELECT t.* FROM kb_tasks t
       JOIN kb_columns c ON t.column_id = c.id
       WHERE c.board_id = $1
       ORDER BY t.position`,
      [board.id]
    );

    // Group tasks by column
    const tasksByColumn: Record<string, Task[]> = {};
    columns.forEach(col => {
      tasksByColumn[col.id] = [];
    });
    tasksResult.rows.forEach(task => {
      if (tasksByColumn[task.column_id]) {
        tasksByColumn[task.column_id].push(task);
      }
    });

    return NextResponse.json({
      board,
      columns,
      tasksByColumn
    });
  } catch (e: any) {
    console.error('Get board error:', e);
    return errorResponse(e?.message ?? 'Database error', 500);
  }
}
