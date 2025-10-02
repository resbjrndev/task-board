import type { NextRequest } from 'next/server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getDeviceId(req: NextRequest): string | null {
  const deviceId = req.headers.get('X-Device-Id');
  if (!deviceId || !UUID_RE.test(deviceId)) {
    return null;
  }
  return deviceId;
}

export function errorResponse(message: string, status: number = 400) {
  return Response.json({ error: message }, { status });
}
