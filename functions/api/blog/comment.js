/**
 * /api/blog/comment
 * GET  ?slug=xxx&vid=xxx  → List approved comments (threaded)
 * POST { slug, text, parent_id? } → Create comment (auth required)
 */

import { corsHeaders as cors } from '../../_lib/cors.js';

export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;
  const USERS = env.DB1;
  const url = new URL(request.url);
  const j = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json', ...cors(request, env) } });

  if (request.method === 'OPTIONS') return new Response(null, { headers: cors(request, env) });

  // --- GET: List comments ---
  if (request.method === 'GET') {
    const slug = url.searchParams.get('slug');
    const vid = url.searchParams.get('vid') || '';
    if (!slug) return j({ error: 'slug required' }, 400);

    // Get auth user (for admin visibility + own comment highlighting)
    let authUser = null;
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (token) {
      authUser = await USERS.prepare(
        "SELECT u.id, u.username, u.is_admin FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')"
      ).bind(token).first();
    }
    const isAdmin = !!authUser?.is_admin;

    // Fetch all comments for this post
    const statusFilter = isAdmin ? "status IN ('approved','pending')" : "status = 'approved'";
    const { results: comments } = await db
      .prepare(`SELECT c.id, c.post_slug, c.user_id, c.text, c.parent_id, c.status, c.created_at,
        u.username as author
        FROM comments c LEFT JOIN users u ON c.user_id = u.id
        WHERE c.post_slug = ? AND ${statusFilter}
        ORDER BY c.created_at ASC`)
      .bind(slug).all();

    // Fetch reaction counts per comment
    const { results: reactions } = await db
      .prepare('SELECT comment_id, reaction_type, COUNT(*) as cnt FROM comment_reactions GROUP BY comment_id, reaction_type')
      .all();

    // Fetch current visitor's reactions
    const { results: myReactions } = vid ? await db
      .prepare('SELECT comment_id, reaction_type FROM comment_reactions WHERE visitor_id = ?').bind(vid).all() : { results: [] };

    // Build lookup maps
    const rMap = {}; // comment_id → { likes, dislikes }
    for (const r of reactions) {
      if (!rMap[r.comment_id]) rMap[r.comment_id] = { likes: 0, dislikes: 0 };
      if (r.reaction_type === 'like') rMap[r.comment_id].likes = r.cnt;
      else rMap[r.comment_id].dislikes = r.cnt;
    }
    const myMap = {}; // comment_id → reaction_type
    for (const r of myReactions) myMap[r.comment_id] = r.reaction_type;

    // Build flat list with reaction data
    const flat = comments.map(c => ({
      id: c.id, post_slug: c.post_slug, user_id: c.user_id,
      author: c.author || 'Anonymous', text: c.text,
      parent_id: c.parent_id, status: c.status,
      date: c.created_at,
      likes: rMap[c.id]?.likes || 0,
      dislikes: rMap[c.id]?.dislikes || 0,
      myReaction: myMap[c.id] || null,
    }));

    // Build tree
    const tree = [];
    const map = {};
    for (const c of flat) {
 c.children = [];
      map[c.id] = c;
      if (c.parent_id && map[c.parent_id]) map[c.parent_id].children.push(c);
      else tree.push(c);
    }

    return j({ comments: tree });
  }

  // --- POST: Create comment (auth required) ---
  if (request.method === 'POST') {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return j({ error: 'Please log in to comment' }, 401);

    const authRow = await USERS.prepare(
      "SELECT u.id, u.username, u.is_admin FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')"
    ).bind(token).first();
    if (!authRow) return j({ error: 'Session expired. Please log in again.' }, 401);

    try {
      const body = await request.json();
      const { slug, text, parent_id } = body;
      if (!slug || !text) return j({ error: 'slug and text required' }, 400);
      if (text.length > 2000) return j({ error: 'Comment max 2000 characters' }, 400);

      // Spam filter
      const lower = text.toLowerCase();
      const banned = ['http://', 'https://', '<script', 'buy now', 'click here', 'free money'];
      for (const w of banned) { if (lower.includes(w)) return j({ error: 'Comment contains disallowed content' }, 400); }

      const ip = request.headers.get('CF-Connecting-IP') || '';
      const ipHash = await hashStr(ip + 'cmt');

      // Admin comments are auto-approved
      const status = authRow.is_admin ? 'approved' : 'pending';

      const result = await db.prepare(
        'INSERT INTO comments (post_slug, user_id, text, parent_id, status, ip_hash) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(slug, authRow.id, text.replace(/[<>]/g, '').trim(), parent_id || null, status, ipHash).run();

      return j({ success: true, id: result.meta.last_row_id, status });
    } catch (e) {
      return j({ error: 'Invalid request' }, 400);
    }
  }

  return j({ error: 'Method not allowed' }, 405);
}

async function hashStr(s) {
  const d = new TextEncoder().encode(s);
  const h = await crypto.subtle.digest('SHA-256', d);
  return Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}