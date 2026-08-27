import { corsHeaders as cors } from '../../../_lib/cors.js';

export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;
  const USERS = env.DB1;
  const j = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json', ...cors(request, env, { methods: 'POST,OPTIONS' }) } });

  if (request.method === 'OPTIONS') return new Response(null, { headers: cors(request, env, { methods: 'POST,OPTIONS' }) });
  if (request.method !== 'POST') return j({ error: 'Method not allowed' }, 405);

  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return j({ error: 'Unauthorized' }, 401);

  const authRow = await USERS.prepare(
    "SELECT u.is_admin FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')"
  ).bind(token).first();
  if (!authRow?.is_admin) return j({ error: 'Admin only' }, 403);

  try {
    const { comment_id, action } = await request.json();
    if (!comment_id || !['approved', 'rejected'].includes(action)) return j({ error: 'Invalid' }, 400);
    await db.prepare('UPDATE comments SET status = ? WHERE id = ?').bind(action, comment_id).run();
    return j({ success: true });
  } catch (e) {
    return j({ error: 'Invalid request' }, 400);
  }
}
