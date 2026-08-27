import { corsHeaders as cors } from '../../../_lib/cors.js';

export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;
  const url = new URL(request.url);
  const j = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json', ...cors(request, env, { methods: 'POST,OPTIONS', headers: 'Content-Type' }) } });

  if (request.method === 'OPTIONS') return new Response(null, { headers: cors(request, env, { methods: 'POST,OPTIONS', headers: 'Content-Type' }) });
  if (request.method !== 'POST') return j({ error: 'Method not allowed' }, 405);

  try {
    const { comment_id, reaction_type, visitor_id } = await request.json();
    if (!comment_id || !reaction_type || !visitor_id) return j({ error: 'Missing fields' }, 400);
    if (!['like', 'dislike'].includes(reaction_type)) return j({ error: 'Must be like or dislike' }, 400);

    const existing = await db
      .prepare('SELECT id, reaction_type FROM comment_reactions WHERE comment_id = ? AND visitor_id = ?')
      .bind(comment_id, visitor_id).first();

    if (existing) {
      if (existing.reaction_type === reaction_type) {
        // Toggle off
        await db.prepare('DELETE FROM comment_reactions WHERE id = ?').bind(existing.id).run();
      } else {
        // Switch reaction
        await db.prepare('UPDATE comment_reactions SET reaction_type = ? WHERE id = ?').bind(reaction_type, existing.id).run();
      }
    } else {
      await db.prepare('INSERT INTO comment_reactions (comment_id, visitor_id, reaction_type) VALUES (?, ?, ?)').bind(comment_id, visitor_id, reaction_type).run();
    }

    // Return updated counts
    const { results } = await db
      .prepare('SELECT reaction_type, COUNT(*) as cnt FROM comment_reactions WHERE comment_id = ? GROUP BY reaction_type')
      .bind(comment_id).all();
    const counts = { likes: 0, dislikes: 0 };
    for (const r of results) counts[r.reaction_type + 's'] = r.cnt;

    const check = await db
      .prepare('SELECT reaction_type FROM comment_reactions WHERE comment_id = ? AND visitor_id = ?').bind(comment_id, visitor_id).first();

    return j({ likes: counts.likes, dislikes: counts.dislikes, myReaction: check?.reaction_type || null });
  } catch (e) {
    return j({ error: 'Invalid request' }, 400);
  }
}
