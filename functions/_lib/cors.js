/**
 * Shared CORS helper for Cloudflare Pages Functions.
 *
 * Set an ALLOWED_ORIGINS environment variable in the Cloudflare Dashboard
 * (Pages → Settings → Environment Variables) as a comma-separated list of
 * the exact origins allowed to call these APIs from browser JS, e.g.:
 *
 *   ALLOWED_ORIGINS = https://himvedicherbals.pages.dev,https://yourdomain.com
 *
 * Behavior:
 * - If ALLOWED_ORIGINS is not set at all, falls back to '*' (allow-all).
 *   This is a safety net so the site doesn't break before you configure it.
 * - Once ALLOWED_ORIGINS is set, only requests whose Origin header exactly
 *   matches an entry in the list get an Access-Control-Allow-Origin header
 *   back (that matched origin is echoed, as required by the CORS spec).
 * - Any other origin gets no Allow-Origin header at all, so the browser
 *   blocks that page's JS from reading the response.
 *
 * @param {Request} request - the incoming request (used to read Origin)
 * @param {object} env - the Cloudflare env bindings (context.env)
 * @param {object} [opts]
 * @param {string} [opts.methods] - value for Access-Control-Allow-Methods
 * @param {string} [opts.headers] - value for Access-Control-Allow-Headers
 */
export function corsHeaders(request, env, opts = {}) {
    const methods = opts.methods || 'GET,POST,OPTIONS';
    const headers = opts.headers || 'Content-Type,Authorization';

    const allowList = (env?.ALLOWED_ORIGINS || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

    const origin = request?.headers?.get('Origin') || '';

    const result = {
        'Access-Control-Allow-Methods': methods,
        'Access-Control-Allow-Headers': headers,
        'Vary': 'Origin',
    };

    if (allowList.length === 0) {
        // Not configured yet - allow all so nothing breaks pre-setup.
        result['Access-Control-Allow-Origin'] = '*';
    } else if (allowList.includes(origin)) {
        result['Access-Control-Allow-Origin'] = origin;
    }
    // else: leave Allow-Origin out entirely -> browser blocks the read

    return result;
}
