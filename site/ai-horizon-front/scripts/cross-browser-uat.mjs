import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';

const artifactRoot = path.join(tmpdir(), 'opencode', `ai-horizon-cross-browser-${Date.now()}`);
const routeCases = [
  { pathname: '/', heading: 'Build withCloudflare OS' },
  { pathname: '/workspaces', heading: 'Workspaces' },
  { pathname: '/blueprints', heading: 'Blueprint Catalog' },
  { pathname: '/blueprints/account-audit', heading: 'Cloudflare Account Audit Report' },
  { pathname: '/connectors', heading: 'Connect evidence, not entire systems.' },
  { pathname: '/connectors/pipeline-crm', heading: 'Pipeline' },
  { pathname: '/skills', heading: 'Super Skills' },
  { pathname: '/skills/evidence-register-builder', heading: 'Evidence Register Builder' },
  { pathname: '/outputs', heading: 'PDF report outputs' },
  { pathname: '/outputs/templates/account-audit', heading: 'Security posture brief' },
  { pathname: '/explore', heading: 'Explore' },
  { pathname: '/lessons/installation', heading: 'Installation' },
];
const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 430, height: 844 },
];
const browserConfigs = [
  {
    name: 'safari',
    command: process.env.SAFARIDRIVER_PATH || '/usr/bin/safaridriver',
    args: (port) => ['--port', String(port)],
    capabilities: { browserName: 'safari' },
  },
  {
    name: 'firefox',
    command: process.env.GECKODRIVER_PATH || 'geckodriver',
    args: (port) => ['--port', String(port)],
    capabilities: { browserName: 'firefox', 'moz:firefoxOptions': { args: ['-headless'] } },
  },
];

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function getFreePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function stopProcess(process) {
  if (process.exitCode !== null) return;
  process.kill('SIGTERM');
  const exited = await Promise.race([
    new Promise((resolve) => process.once('exit', () => resolve(true))),
    sleep(2_000).then(() => false),
  ]);
  if (!exited && process.exitCode === null) {
    const forcedExit = new Promise((resolve) => process.once('exit', resolve));
    process.kill('SIGKILL');
    await Promise.race([forcedExit, sleep(2_000)]);
  }
}

function startProcess(command, args) {
  const process = spawn(command, args, { stdio: 'ignore' });
  process.startupError = null;
  process.once('error', (error) => { process.startupError = error; });
  return process;
}

async function waitFor(url, process, label, attempts = 100) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (process.startupError) throw process.startupError;
    if (process.exitCode !== null) throw new Error(`${label} exited before it became ready`);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) return;
    } catch {
      // The local process is still starting.
    }
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

class WebDriverClient {
  constructor(origin) {
    this.origin = origin;
    this.sessionId = '';
  }

  async request(method, pathname, body) {
    const response = await fetch(`${this.origin}${pathname}`, {
      method,
      signal: AbortSignal.timeout(15_000),
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = await response.json();
    if (!response.ok || payload.value?.error) {
      throw new Error(payload.value?.message || `${method} ${pathname} failed with ${response.status}`);
    }
    return payload.value;
  }

  async create(capabilities) {
    const value = await this.request('POST', '/session', { capabilities: { alwaysMatch: capabilities } });
    this.sessionId = value.sessionId;
  }

  command(method, pathname, body) {
    return this.request(method, `/session/${this.sessionId}${pathname}`, body);
  }

  execute(script, args = []) {
    return this.command('POST', '/execute/sync', { script, args });
  }

  async close() {
    if (!this.sessionId) return;
    await this.request('DELETE', `/session/${this.sessionId}`);
    this.sessionId = '';
  }
}

async function runBrowser(config, previewOrigin) {
  const driverPort = await getFreePort();
  const driver = startProcess(config.command, config.args(driverPort));
  const client = new WebDriverClient(`http://127.0.0.1:${driverPort}`);
  const results = [];

  try {
    await waitFor(`http://127.0.0.1:${driverPort}/status`, driver, `${config.name} driver`);
    await client.create(config.capabilities);
    for (const viewport of viewports) {
      await client.command('POST', '/window/rect', { width: viewport.width, height: viewport.height, x: 0, y: 0 });
      for (const route of routeCases) {
        await client.command('POST', '/url', { url: `${previewOrigin}${route.pathname}` });
        const page = await client.execute(`return (() => {
          const controlName = (node) => {
            const labelledBy = (node.getAttribute('aria-labelledby') || '').split(/\\s+/).filter(Boolean).map((id) => document.getElementById(id)?.textContent || '').join(' ');
            const labels = [...(node.labels || [])].map((label) => label.textContent || '').join(' ');
            return (node.getAttribute('aria-label') || labelledBy || labels || node.innerText || node.getAttribute('alt') || node.getAttribute('title') || '').trim();
          };
          const visibleControls = [...document.querySelectorAll('button,a[href],input,select,textarea,[contenteditable="true"],[tabindex]:not([tabindex="-1"])')]
            .filter((node) => node.checkVisibility({ visibilityProperty: true, opacityProperty: true }));
          return {
            pathname: location.pathname,
            heading: document.querySelector('h1')?.textContent?.trim() || '',
            overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
            skipLink: Boolean(document.querySelector('a[href="#main-content"]')),
            unnamedControls: visibleControls.filter((node) => !controlName(node)).length,
            width: window.innerWidth,
          };
        })();`);
        assert.equal(page.pathname, route.pathname, `${config.name} ${viewport.name} ${route.pathname} does not redirect`);
        assert.equal(page.heading, route.heading, `${config.name} ${viewport.name} ${route.pathname} has its expected H1`);
        assert.equal(page.overflow, false, `${config.name} ${viewport.name} ${route.pathname} has no horizontal overflow`);
        assert.equal(page.skipLink, true, `${config.name} ${viewport.name} ${route.pathname} has a skip link`);
        assert.equal(page.unnamedControls, 0, `${config.name} ${viewport.name} ${route.pathname} has no unnamed controls`);
        if (viewport.name === 'desktop') assert.ok(page.width >= 1_000, `${config.name} uses a desktop viewport`);
        else assert.ok(page.width <= 760, `${config.name} reaches the mobile breakpoint`);
        results.push({ viewport: viewport.name, pathname: route.pathname, heading: page.heading, width: page.width });
      }
    }

    await client.command('POST', '/window/rect', { width: 430, height: 844, x: 0, y: 0 });
    await client.command('POST', '/url', { url: previewOrigin });
    await client.execute(`document.querySelector('.nav-toggle').click();`);
    await sleep(100);
    const opened = await client.execute(`return { expanded: document.querySelector('.nav-toggle').getAttribute('aria-expanded'), focusInside: document.querySelector('#workshop-navigation').contains(document.activeElement) };`);
    assert.deepEqual(opened, { expanded: 'true', focusInside: true }, `${config.name} opens and focuses mobile navigation`);
    await client.command('POST', '/actions', { actions: [{ type: 'key', id: 'keyboard', actions: [{ type: 'keyDown', value: '\uE00C' }, { type: 'keyUp', value: '\uE00C' }] }] });
    await sleep(100);
    const closed = await client.execute(`return { expanded: document.querySelector('.nav-toggle').getAttribute('aria-expanded'), toggleFocused: document.activeElement === document.querySelector('.nav-toggle') };`);
    assert.deepEqual(closed, { expanded: 'false', toggleFocused: true }, `${config.name} closes mobile navigation and restores focus`);

    await client.command('POST', '/url', { url: `${previewOrigin}/blueprints` });
    const screenshot = await client.command('GET', '/screenshot');
    await writeFile(path.join(artifactRoot, `${config.name}-mobile-blueprints.png`), Buffer.from(screenshot, 'base64'));
    return results;
  } finally {
    await client.close().catch(() => {});
    await stopProcess(driver);
  }
}

async function main() {
  await mkdir(artifactRoot, { recursive: true });
  const requestedBrowsers = new Set((process.env.UAT_BROWSERS || 'firefox').split(',').map((item) => item.trim()).filter(Boolean));
  const supportedBrowsers = new Set(browserConfigs.map((config) => config.name));
  assert.ok(requestedBrowsers.size > 0, 'Select at least one UAT browser');
  assert.deepEqual([...requestedBrowsers].filter((name) => !supportedBrowsers.has(name)), [], 'UAT_BROWSERS contains only supported browser names');
  if (!process.env.UAT_BROWSERS) assert.ok(requestedBrowsers.has('firefox'), 'The default release UAT includes Firefox');
  const previewPort = await getFreePort();
  const previewOrigin = `http://127.0.0.1:${previewPort}`;
  const preview = startProcess(path.resolve('node_modules/.bin/vite'), ['preview', '--host', '127.0.0.1', '--port', String(previewPort), '--strictPort']);
  const summary = {};
  const failures = [];
  try {
    await waitFor(previewOrigin, preview, 'Vite preview');
    for (const config of browserConfigs.filter((item) => requestedBrowsers.has(item.name))) {
      try {
        summary[config.name] = await runBrowser(config, previewOrigin);
      } catch (error) {
        failures.push({ browser: config.name, error: error.message });
      }
    }
    await writeFile(path.join(artifactRoot, 'cross-browser-summary.json'), JSON.stringify({ summary, failures }, null, 2));
    console.log(JSON.stringify({ browsers: Object.fromEntries(Object.entries(summary).map(([browser, results]) => [browser, results.length])), failures, artifactRoot }, null, 2));
    assert.deepEqual(failures, [], `Cross-browser UAT failures: ${failures.map((failure) => `${failure.browser}: ${failure.error}`).join(' | ')}`);
  } finally {
    await stopProcess(preview);
  }
}

await main();
