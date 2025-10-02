const DEVICE_ID_KEY = 'flashy_device_id';

function getDeviceId(): string {
  if (typeof window === 'undefined') {
    throw new Error('kbApi can only be used in browser');
  }

  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

async function apiCall(url: string, options: RequestInit = {}) {
  const deviceId = getDeviceId();
  const response = await fetch(url, {
    ...options,
    headers: {
      'X-Device-Id': deviceId,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error (${response.status}): ${text}`);
  }

  return response.json();
}

export const kbApi = {
  boot() {
    return apiCall('/api/kb/boot');
  },

  getBoard() {
    return apiCall('/api/kb/board');
  },

  createColumn(title: string) {
    return apiCall('/api/kb/columns', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  },

  renameColumn(columnId: string, title: string) {
    return apiCall(`/api/kb/columns/${columnId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    });
  },

  deleteColumn(columnId: string) {
    return apiCall(`/api/kb/columns/${columnId}`, {
      method: 'DELETE',
    });
  },

  createTask(columnId: string, title: string, description?: string) {
    return apiCall('/api/kb/tasks', {
      method: 'POST',
      body: JSON.stringify({ columnId, title, description }),
    });
  },

  updateTask(taskId: string, updates: { title?: string; description?: string; columnId?: string }) {
    return apiCall(`/api/kb/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  deleteTask(taskId: string) {
    return apiCall(`/api/kb/tasks/${taskId}`, {
      method: 'DELETE',
    });
  },

  reorderColumns(orderedIds: string[]) {
    return apiCall('/api/kb/columns/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ ordered_ids: orderedIds }),
    });
  },

  reorderTasks(columnId: string, orderedIds: string[]) {
    return apiCall('/api/kb/tasks/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ column_id: columnId, ordered_ids: orderedIds }),
    });
  },
};
