import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/worker.js';

function environment(response) {
  return { ASSETS: { fetch: async () => response } };
}

test('Worker applies security and no-cache headers to HTML', async () => {
  const source = new Response('<!doctype html>', { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } });
  const response = await worker.fetch(new Request('https://example.com/skills'), environment(source));
  assert.equal(response.headers.get('cache-control'), 'no-cache, must-revalidate');
  assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert.doesNotMatch(response.headers.get('content-security-policy'), /unsafe-inline|img-src[^;]*https:/);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.match(response.headers.get('permissions-policy'), /camera=\(\)/);
  assert.equal(await response.text(), '<!doctype html>');
});

test('Worker preserves non-HTML status, body, and cache policy while adding security headers', async () => {
  const source = new Response('asset', { status: 206, statusText: 'Partial Content', headers: { 'content-type': 'text/plain', 'cache-control': 'public, max-age=3600' } });
  const response = await worker.fetch(new Request('https://example.com/asset.txt'), environment(source));
  assert.equal(response.status, 206);
  assert.equal(response.statusText, 'Partial Content');
  assert.equal(response.headers.get('cache-control'), 'public, max-age=3600');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(await response.text(), 'asset');
});
