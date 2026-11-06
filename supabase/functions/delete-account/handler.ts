type Dependencies = {
  authenticate: (authorization: string) => Promise<string | null>;
  erase: (userId: string, deleteAccount: boolean) => Promise<void>;
  deleteAccount: (userId: string) => Promise<void>;
};

export async function handleDeletion(req: Request, deps: Dependencies, cors: Record<string, string>) {
  const response = (status: number, body: object) => new Response(JSON.stringify(body), {
    status, headers: { ...cors, 'Content-Type': 'application/json' },
  });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return response(405, { error: 'Method not allowed' });
  const authorization = req.headers.get('Authorization');
  if (!authorization) return response(401, { error: 'Unauthorized' });
  const body = await req.json().catch(() => null);
  if (!body || (body.action !== 'data' && body.action !== 'account')) {
    return response(400, { error: 'Explicit deletion action required' });
  }
  try {
    const userId = await deps.authenticate(authorization);
    if (!userId) return response(401, { error: 'Unauthorized' });
    await deps.erase(userId, body.action === 'account');
    if (body.action === 'account') await deps.deleteAccount(userId);
    return response(200, { success: true });
  } catch {
    return response(500, { error: 'Deletion failed. Please retry.' });
  }
}