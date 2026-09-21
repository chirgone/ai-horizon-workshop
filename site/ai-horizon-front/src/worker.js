export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const contentType = response.headers.get('content-type') || '';
    const headers = new Headers(response.headers);
    headers.set('content-security-policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
    headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
    headers.set('referrer-policy', 'no-referrer');
    headers.set('x-content-type-options', 'nosniff');
    headers.set('x-frame-options', 'DENY');
    if (contentType.includes('text/html')) headers.set('cache-control', 'no-cache, must-revalidate');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
};
