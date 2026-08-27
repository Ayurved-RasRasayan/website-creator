import { corsHeaders } from '../../_lib/cors.js';

export async function onRequest(context) {
  const { request, env } = context;
  const j = (data, s = 200) => new Response(JSON.stringify(data), { status: s, headers: { 'Content-Type': 'application/json', ...corsHeaders(request, env) } });

  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(request, env) });
  if (request.method !== 'POST') return j({ error: 'Method not allowed' }, 405);

  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (token) {
    await env.DB1.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
  }
  return j({ success: true });
}