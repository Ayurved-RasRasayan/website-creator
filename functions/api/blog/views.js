/**
 * /api/blog/views
 * GET  ?slug=xxx  → Get total view count for a post
 * POST { slug, vid } → Record a view (once per visitor per session)
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

  // --- GET: View count ---
  if (request.method === 'GET') {
    const slug = url.searchParams.get('slug');
    if (!slug) return json({ error: 'slug is required' }, 400);

    const { count } = await db
      .prepare('SELECT COUNT(DISTINCT visitor_id) as count FROM post_views WHERE post_slug = ?')
      .bind(slug)
      .first();

    return json({ views: count || 0 });
  }

  // --- POST: Record view ---
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const { slug, vid } = body;
      if (!slug || !vid) return json({ error: 'slug and vid are required' }, 400);

      const ip = request.headers.get('CF-Connecting-IP') || '';
      const ipHash = await hashStr(ip + 'view-salt');

      // Only record once per visitor per post
      const existing = await db
        .prepare('SELECT id FROM post_views WHERE post_slug = ? AND visitor_id = ?')
        .bind(slug, vid)
        .first();

      if (!existing) {
        await db
          .prepare('INSERT INTO post_views (post_slug, visitor_id, ip_hash) VALUES (?, ?, ?)')
          .bind(slug, vid, ipHash)
          .run();
      }

      const { count } = await db
        .prepare('SELECT COUNT(DISTINCT visitor_id) as count FROM post_views WHERE post_slug = ?')
        .bind(slug)
        .first();

      return json({ views: count || 0 });
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
