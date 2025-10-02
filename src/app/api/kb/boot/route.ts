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
    // Ensure board exists
    const boardResult = await query<Board>(
      'SELECT * FROM kb_boards WHERE device_id = $1',
      [deviceId]
    );

    let board: Board;
    if (boardResult.rows.length === 0) {
      // Create new board
      const newBoardResult = await query<Board>(
        'INSERT INTO kb_boards (device_id, title) VALUES ($1, $2) RETURNING *',
        [deviceId, 'My Board']
      );
      board = newBoardResult.rows[0];
    } else {
      board = boardResult.rows[0];
    }

    // Check if columns exist
    let columnsResult = await query<Column>(
      'SELECT * FROM kb_columns WHERE board_id = $1 ORDER BY position',
      [board.id]
    );

    if (columnsResult.rows.length === 0) {
      // Seed default columns
      const defaultColumns = [
        { title: 'To Do', position: 0 },
        { title: 'In Progress', position: 1 },
        { title: 'Done', position: 2 }
      ];

      for (const col of defaultColumns) {
        await query(
          'INSERT INTO kb_columns (board_id, title, position) VALUES ($1, $2, $3)',
          [board.id, col.title, col.position]
        );
      }

      // Fetch the newly created columns
      columnsResult = await query<Column>(
        'SELECT * FROM kb_columns WHERE board_id = $1 ORDER BY position',
        [board.id]
      );
    }

    const columns = columnsResult.rows;

    // Fetch all tasks for this board
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
  } catch (e: unknown) {
    const error = e as Error;
    console.error('Boot error:', e);
    return errorResponse(error?.message ?? 'Database error', 500);
  }
}
