import { corsHeaders } from '../../_lib/cors.js';

export async function onRequest(context) {
  const { request, env } = context;
  const USERS = env.DB1;
  const j = (data, s = 200) => new Response(JSON.stringify(data), { status: s, headers: { 'Content-Type': 'application/json', ...corsHeaders(request, env) } });

  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(request, env) });
  if (request.method !== 'POST') return j({ error: 'Method not allowed' }, 405);

  try {
    const { username, email, password, display_name } = await request.json();
    if (!username || !email || !password) return j({ error: 'Username, email, and password are required' }, 400);
    if (username.length < 3 || username.length > 30) return j({ error: 'Username must be 3-30 characters' }, 400);
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return j({ error: 'Username: only letters, numbers, underscores' }, 400);
    if (password.length < 6) return j({ error: 'Password must be at least 6 characters' }, 400);

    const existing = await USERS.prepare('SELECT id FROM users WHERE username = ? OR email = ?').bind(username, email.toLowerCase()).first();
    if (existing) return j({ error: 'Username or email already taken' }, 409);

    const salt = crypto.randomUUID().replace(/-/g, '');
    const hash = await hashPw(password, salt);

    // Admin status is ONLY granted via the ADMIN_EMAIL env var match -
    // regular signups are never admin, regardless of signup order.
    const adminEmail = (env.ADMIN_EMAIL || '').toLowerCase();
    const isAdmin = (adminEmail && email.toLowerCase() === adminEmail) ? 1 : 0;

    const result = await USERS.prepare(
      'INSERT INTO users (username, email, password_hash, salt, display_name, is_admin) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(username, email.toLowerCase(), hash, salt, display_name || username, isAdmin).run();

    const userId = result.meta.last_row_id;
    const token = crypto.randomUUID();
    await USERS.prepare('INSERT INTO sessions (user_id, token) VALUES (?, ?)').bind(userId, token).run();

    return j({
      success: true,
      token,
      user: { id: userId, username, display_name: display_name || username, is_admin: !!isAdmin }
    });
  } catch (e) {
    return j({ error: 'Invalid request' }, 400);
  }
}

async function hashPw(pw, salt) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256);
  return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
}
