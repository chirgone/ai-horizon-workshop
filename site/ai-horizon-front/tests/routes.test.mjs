import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const appSource = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
const routePaths = [...appSource.matchAll(/<Route path="([^"]+)"/g)].map((match) => match[1]);

test('Customer workshop route contract remains complete', () => {
  const expected = ['/', '/workspaces', '/blueprints', '/blueprints/:slug', '/connectors', '/connectors/:slug', '/skills', '/skills/:slug', '/workspaces/new', '/workspaces/:workspaceId', '/outputs', '/outputs/new', '/outputs/templates/:slug', '/outputs/:reportId', '/explore', '/lessons', '/exercises', '/resources', '/lessons/:slug', '/exercises/:slug', '/resources/:slug', '*'];
  assert.deepEqual(routePaths, expected);
});

test('Release accessibility controls remain wired', () => {
  assert.match(appSource, /aria-expanded=\{navOpen\}/);
  assert.match(appSource, /aria-controls="workshop-navigation"/);
  assert.match(appSource, /aria-current=\{active \? 'page'/);
  assert.match(appSource, /Skip to main content/);
  assert.match(appSource, /event\.key === 'Escape'/);
});
