/**
 * /api/blog/like
 * GET  ?slug=xxx&vid=xxx  → Check if visitor liked + total count
 * POST { slug, vid }       → Toggle like (like if not liked, unlike if already liked)
 * 
 * vid = visitor ID (UUID stored in visitor's localStorage)
 */

import { corsHeaders as buildCorsHeaders } from '../../_lib/cors.js';

export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;
  const url = new URL(request.url);
  const corsOpts = { methods: 'GET, POST, OPTIONS', headers: 'Content-Type' };
  const json = (data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...buildCorsHeaders(request, env, corsOpts) },
  });

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(request, env, corsOpts) });
  }

  // --- GET: Check like status + count ---
  if (request.method === 'GET') {
    const slug = url.searchParams.get('slug');
    const vid = url.searchParams.get('vid');
    if (!slug) return json({ error: 'slug is required' }, 400);

    const { count } = await db
      .prepare('SELECT COUNT(*) as count FROM post_likes WHERE post_slug = ?')
      .bind(slug)
      .first();

    let liked = false;
    if (vid) {
      const row = await db
        .prepare('SELECT id FROM post_likes WHERE post_slug = ? AND visitor_id = ?')
        .bind(slug, vid)
        .first();
      liked = !!row;
    }

    return json({ liked, count: count || 0 });
  }

  // --- POST: Toggle like ---
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const { slug, vid } = body;
      if (!slug || !vid) return json({ error: 'slug and vid are required' }, 400);

      // Check if already liked
      const existing = await db
        .prepare('SELECT id FROM post_likes WHERE post_slug = ? AND visitor_id = ?')
        .bind(slug, vid)
        .first();

      if (existing) {
 // Unlike
        await db.prepare('DELETE FROM post_likes WHERE id = ?').bind(existing.id).run();
        return json({ liked: false });
      } else {
        // Like
        const ip = request.headers.get('CF-Connecting-IP') || '';
        const ipHash = await hashStr(ip + 'like-salt');
        await db
          .prepare('INSERT INTO post_likes (post_slug, visitor_id, ip_hash) VALUES (?, ?, ?)')
          .bind(slug, vid, ipHash)
          .run();
        return json({ liked: true });
      }
    } catch (e) {
      return json({ error: 'Invalid request body' }, 400);
    }
  }

  return json({ error: 'Method not allowed' }, 405);
}

async function hashStr(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}
