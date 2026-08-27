import { corsHeaders } from '../../_lib/cors.js';

/**
 * /api/auth/login
 * POST { username, password }
 * If admin user doesn't exist yet, auto-creates from ADMIN_USERNAME/ADMIN_PASSWORD/ADMIN_EMAIL env vars.
 */
export async function onRequest(context) {
  const { request, env } = context;
  const USERS = env.DB1;
  const j = (data, s = 200) => new Response(JSON.stringify(data), { status: s, headers: { 'Content-Type': 'application/json', ...corsHeaders(request, env) } });

  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(request, env) });
  if (request.method !== 'POST') return j({ error: 'Method not allowed' }, 405);

  try {
    const { username, password } = await request.json();
    if (!username || !password) return j({ error: 'Username and password required' }, 400);

    // --- Auto-create admin on first login attempt ---
    const adminUser = env.ADMIN_USERNAME || '';
    const adminPw = env.ADMIN_PASSWORD || '';
    const adminEmail = (env.ADMIN_EMAIL || '').toLowerCase();

    if (adminUser && adminPw && adminEmail) {
      const exists = await USERS.prepare('SELECT id FROM users WHERE is_admin = 1').first();
      if (!exists && (username === adminUser || username.toLowerCase() === adminEmail) && password === adminPw) {
        const salt = crypto.randomUUID().replace(/-/g, '');
        const hash = await hashPw(adminPw, salt);
        const result = await USERS.prepare(
          'INSERT INTO users (username, email, password_hash, salt, display_name, is_admin) VALUES (?, ?, ?, ?, ?, 1)'
        ).bind(adminUser, adminEmail, hash, salt, 'Admin').run();
        const userId = result.meta.last_row_id;
        const token = crypto.randomUUID();
        await USERS.prepare('INSERT INTO sessions (user_id, token) VALUES (?, ?)').bind(userId, token).run();
        return j({ success: true, token, user: { id: userId, username: adminUser, display_name: 'Admin', is_admin: true } });
      }
    }

    // --- Normal login ---
    const user = await USERS.prepare(
      "SELECT id, username, email, password_hash, salt, display_name, is_admin FROM users WHERE username = ? OR email = ?"
    ).bind(username, username.toLowerCase()).first();

    if (!user) return j({ error: 'Invalid credentials' }, 401);

    const hash = await hashPw(password, user.salt);
    if (hash !== user.password_hash) return j({ error: 'Invalid credentials' }, 401);

    // Delete old sessions for this user
    await USERS.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id).run();

    const token = crypto.randomUUID();
    await USERS.prepare('INSERT INTO sessions (user_id, token) VALUES (?, ?)').bind(user.id, token).run();

    return j({
      success: true,
      token,
      user: { id: user.id, username: user.username, display_name: user.display_name || user.username, is_admin: !!user.is_admin }
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
