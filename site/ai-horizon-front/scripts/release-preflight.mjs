import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { access, mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { blueprints } from '../src/blueprint-content.js';
import { connectors } from '../src/connector-content.js';
import { reportTemplates } from '../src/report-content.js';
import { skills } from '../src/skill-content.js';
import { REPORTS_KEY, WORKSPACES_KEY, withWorkspaceExpiration } from '../src/workshop-storage.js';

const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const artifactRoot = path.join(tmpdir(), 'opencode', `ai-horizon-sprint8-${Date.now()}`);

const routeCases = [
  { pathname: '/', heading: 'Build withCloudflare OS' },
  { pathname: '/workspaces', heading: 'Workspaces' },
  { pathname: '/workspaces/new?blueprint=account-audit', expectedPath: '/workspaces/new', expectedSearch: '?blueprint=account-audit', heading: 'Prepare the boundary before connecting data.', selectedText: 'Cloudflare Account Audit Report' },
  { pathname: '/workspaces/uat-account-audit', heading: 'UAT Cloudflare Account Audit Report' },
  { pathname: '/blueprints', heading: 'Blueprint Catalog' },
  ...blueprints.map((blueprint) => ({ pathname: `/blueprints/${blueprint.slug}`, heading: blueprint.title })),
  { pathname: '/connectors', heading: 'Connect evidence, not entire systems.' },
  ...connectors.map((connector) => ({ pathname: `/connectors/${connector.slug}`, heading: connector.brand })),
  { pathname: '/skills', heading: 'Super Skills' },
  ...skills.map((skill) => ({ pathname: `/skills/${skill.slug}`, heading: skill.title })),
  { pathname: '/outputs', heading: 'PDF report outputs' },
  { pathname: '/outputs/new?workspace=uat-account-audit', expectedPath: '/outputs/new', expectedSearch: '?workspace=uat-account-audit', heading: 'Create the report, not the transcript.', selectedValue: 'uat-account-audit' },
  ...reportTemplates.map((template) => ({ pathname: `/outputs/templates/${template.slug}`, heading: template.title })),
  ...reportTemplates.map((template) => ({ pathname: `/outputs/uat-report-${template.slug}`, heading: `UAT ${template.title}` })),
  { pathname: '/explore', heading: 'Explore' },
  { pathname: '/lessons', heading: 'Workspaces' },
  { pathname: '/lessons/installation', heading: 'Installation' },
  { pathname: '/lessons/workshop-setup', heading: 'Workspace Setup' },
  { pathname: '/exercises', heading: 'Blueprint practice' },
  { pathname: '/exercises/configure-workspace', heading: 'Configure the Workshop Workspace' },
  { pathname: '/resources', heading: 'Explore' },
  { pathname: '/resources/workshop-overview', heading: 'Workshop Overview' },
  { pathname: '/unknown-release-route', expectedPath: '/', heading: 'Build withCloudflare OS' },
  { pathname: '/blueprints/unknown-blueprint', expectedPath: '/blueprints', heading: 'Blueprint Catalog' },
  { pathname: '/workspaces/unknown-workspace', expectedPath: '/workspaces', heading: 'Workspaces' },
  { pathname: '/outputs/unknown-report', expectedPath: '/outputs', heading: 'PDF report outputs' },
];

const viewports = [
  { name: 'desktop', width: 1440, height: 900, mobile: false },
  { name: 'intermediate', width: 1024, height: 768, mobile: false },
  { name: 'mobile', width: 390, height: 844, mobile: true },
];

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function compactText(value) {
  return value.replace(/\s+/g, '');
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

async function waitFor(url, process, label, attempts = 80) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (process.startupError) throw process.startupError;
    if (process.exitCode !== null) throw new Error(`${label} exited before it became ready`);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) return response;
    } catch {
      // The local process is still starting.
    }
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

class CdpClient {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.sequence = 0;
    this.pending = new Map();
    this.listeners = new Map();
  }

  async connect() {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timed out connecting to Chrome DevTools')), 15_000);
      const complete = (callback) => (value) => {
        clearTimeout(timer);
        callback(value);
      };
      this.socket.addEventListener('open', complete(resolve), { once: true });
      this.socket.addEventListener('error', complete(reject), { once: true });
    });
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const request = this.pending.get(message.id);
        if (!request) return;
        this.pending.delete(message.id);
        if (message.error) request.reject(new Error(message.error.message));
        else request.resolve(message.result);
        return;
      }
      for (const listener of this.listeners.get(message.method) || []) listener(message.params);
    });
  }

  send(method, params = {}) {
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Timed out waiting for Chrome DevTools ${method}`));
      }, 30_000);
      this.pending.set(id, {
        resolve: (value) => { clearTimeout(timer); resolve(value); },
        reject: (error) => { clearTimeout(timer); reject(error); },
      });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, listener) {
    const listeners = this.listeners.get(method) || [];
    listeners.push(listener);
    this.listeners.set(method, listeners);
  }

  once(method, timeout = 5_000) {
    return new Promise((resolve, reject) => {
      const listener = (params) => {
        clearTimeout(timer);
        this.listeners.set(method, (this.listeners.get(method) || []).filter((item) => item !== listener));
        resolve(params);
      };
      const timer = setTimeout(() => {
        this.listeners.set(method, (this.listeners.get(method) || []).filter((item) => item !== listener));
        reject(new Error(`Timed out waiting for ${method}`));
      }, timeout);
      this.on(method, listener);
    });
  }

  close() {
    this.socket.close();
  }
}

async function evaluate(client, expression) {
  const result = await client.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Browser evaluation failed');
  return result.result.value;
}

async function navigate(client, origin, pathname, expected = {}) {
  const loaded = client.once('Page.loadEventFired');
  const navigation = await client.send('Page.navigate', { url: `${origin}${pathname}` });
  assert.equal(navigation.errorText, undefined, `Navigation to ${pathname} succeeded`);
  await loaded;
  await evaluate(client, 'document.fonts.ready');
  const expectedPath = expected.expectedPath || pathname.split('?')[0];
  const expectedSearch = expected.expectedSearch || '';
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const page = await evaluate(client, `({ pathname: location.pathname, search: location.search, heading: document.querySelector('h1')?.textContent?.trim() || '' })`);
    if (page.pathname === expectedPath && page.search === expectedSearch && page.heading && (!expected.heading || page.heading === expected.heading)) return;
    await sleep(20);
  }
  throw new Error(`Timed out waiting for the expected application content at ${pathname}`);
}

function createFixtureRecords() {
  const createdAt = new Date().toISOString();
  const workspaces = blueprints.map((blueprint) => withWorkspaceExpiration({
    id: `uat-${blueprint.slug}`,
    name: `UAT ${blueprint.title}`,
    owner: 'Workshop Security Owner',
    audience: 'Security leadership',
    blueprintSlug: blueprint.slug,
    createdAt,
    status: 'Charter created',
  }));
  const reports = reportTemplates.map((template) => ({
    id: `uat-report-${template.slug}`,
    workspaceId: `uat-${template.blueprintSlug}`,
    blueprintSlug: template.blueprintSlug,
    title: `UAT ${template.title}`,
    sections: Object.fromEntries(template.sections.map((section) => [section, `Validated synthetic content for ${section}. This statement contains no customer evidence.`])),
    findings: [{
      id: `finding-${template.slug}`,
      title: 'Synthetic control validation finding',
      severity: 'Medium',
      rationale: 'Synthetic evidence indicates a bounded workshop control gap requiring owner review.',
      source: 'Sprint 8 synthetic UAT fixture',
      retrievedAt: createdAt,
      affectedScope: 'Synthetic workshop scope',
      observedFact: 'The test fixture intentionally represents one unresolved control for layout validation.',
      confidence: 'Verified',
      action: 'Review the synthetic control and record the human decision.',
      owner: 'Workshop Security Owner',
      horizon: '30 days',
    }],
    assumptions: 'Synthetic UAT content only. No live customer systems or evidence were accessed.',
    createdAt,
  }));
  return { workspaces, reports };
}

async function main() {
  await access(chromePath);
  await mkdir(artifactRoot, { recursive: true });
  const profile = await mkdtemp(path.join(tmpdir(), 'ai-horizon-chrome-'));
  const previewPort = await getFreePort();
  const debuggingPort = await getFreePort();
  const previewOrigin = `http://127.0.0.1:${previewPort}`;
  const debuggingOrigin = `http://127.0.0.1:${debuggingPort}`;
  const preview = startProcess(path.resolve('node_modules/.bin/vite'), ['preview', '--host', '127.0.0.1', '--port', String(previewPort), '--strictPort']);
  const chrome = startProcess(chromePath, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    `--remote-debugging-port=${debuggingPort}`, `--user-data-dir=${profile}`, 'about:blank',
  ]);
  const browserErrors = [];

  try {
    await waitFor(previewOrigin, preview, 'Vite preview');
    await waitFor(`${debuggingOrigin}/json/version`, chrome, 'Google Chrome');
    const targets = await (await fetch(`${debuggingOrigin}/json/list`, { signal: AbortSignal.timeout(5_000) })).json();
    const target = targets.find((item) => item.type === 'page');
    assert.ok(target?.webSocketDebuggerUrl, 'Chrome page target is available');
    const client = new CdpClient(target.webSocketDebuggerUrl);
    await client.connect();
    client.on('Runtime.exceptionThrown', (event) => browserErrors.push(event.exceptionDetails?.text || 'Runtime exception'));
    client.on('Log.entryAdded', (event) => { if (event.entry.level === 'error') browserErrors.push(event.entry.text); });
    await Promise.all(['Page.enable', 'Runtime.enable', 'Log.enable', 'Accessibility.enable'].map((method) => client.send(method)));
    const fixtures = createFixtureRecords();
    await navigate(client, previewOrigin, '/');
    await evaluate(client, `localStorage.setItem(${JSON.stringify(WORKSPACES_KEY)}, ${JSON.stringify(JSON.stringify(fixtures.workspaces))}); sessionStorage.setItem(${JSON.stringify(REPORTS_KEY)}, ${JSON.stringify(JSON.stringify(fixtures.reports))});`);

    const routeResults = [];
    for (const viewport of viewports) {
      await client.send('Emulation.setDeviceMetricsOverride', {
        width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile,
      });
      for (const route of routeCases) {
        await navigate(client, previewOrigin, route.pathname, route);
        const page = await evaluate(client, `(() => ({
          pathname: location.pathname,
          search: location.search,
          title: document.title,
          heading: document.querySelector('h1')?.textContent?.trim() || '',
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          skipLink: Boolean(document.querySelector('a[href="#main-content"]')),
          selectedText: document.querySelector('.selected-blueprint strong')?.textContent?.trim() || '',
          selectedValue: document.querySelector('main select')?.value || ''
        }))()`);
        const expectedPath = route.expectedPath || route.pathname;
        assert.equal(page.pathname, expectedPath, `${viewport.name} ${route.pathname} does not redirect`);
        assert.equal(page.search, route.expectedSearch || '', `${viewport.name} ${route.pathname} preserves its expected query`);
        assert.equal(page.heading, route.heading, `${viewport.name} ${route.pathname} has its expected H1`);
        if (route.selectedText) assert.equal(page.selectedText, route.selectedText, `${viewport.name} ${route.pathname} loads its selected Blueprint`);
        if (route.selectedValue) assert.equal(page.selectedValue, route.selectedValue, `${viewport.name} ${route.pathname} loads its selected Workspace`);
        assert.equal(page.overflow, false, `${viewport.name} ${route.pathname} has no horizontal overflow`);
        assert.equal(page.skipLink, true, `${viewport.name} ${route.pathname} has a skip link`);
        const tree = await client.send('Accessibility.getFullAXTree');
        assert.ok(tree.nodes.some((node) => node.role?.value === 'heading' && compactText(node.name?.value || '') === compactText(route.heading)), `${viewport.name} ${route.pathname} exposes its AX heading`);
        const unnamedControls = tree.nodes.filter((node) => !node.ignored
          && node.properties?.some((property) => property.name === 'focusable' && property.value?.value === true)
          && !node.name?.value?.trim());
        assert.equal(unnamedControls.length, 0, `${viewport.name} ${route.pathname} has no unnamed AX controls`);
        routeResults.push({ viewport: viewport.name, pathname: expectedPath, heading: page.heading, title: page.title });
      }
    }

    await client.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await navigate(client, previewOrigin, '/');
    await evaluate(client, `document.querySelector('.nav-toggle').click()`);
    const openMenu = await evaluate(client, `({ expanded: document.querySelector('.nav-toggle').getAttribute('aria-expanded'), focusInside: document.querySelector('#workshop-navigation').contains(document.activeElement) })`);
    assert.deepEqual(openMenu, { expanded: 'true', focusInside: true });
    await client.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
    await client.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });
    await sleep(30);
    const closedMenu = await evaluate(client, `({ expanded: document.querySelector('.nav-toggle').getAttribute('aria-expanded'), toggleFocused: document.activeElement === document.querySelector('.nav-toggle') })`);
    assert.deepEqual(closedMenu, { expanded: 'false', toggleFocused: true });

    const pdfResults = [];
    for (const report of fixtures.reports) {
      await navigate(client, previewOrigin, `/outputs/${report.id}`, { heading: report.title });
      await client.send('Emulation.setEmulatedMedia', { media: 'print' });
      const printLayout = await evaluate(client, `({
        skipLinkHidden: getComputedStyle(document.querySelector('.skip-link')).display === 'none',
        gateLabelsFit: [...document.querySelectorAll('.report-release-gates > p span')].every((label) => label.scrollWidth <= label.clientWidth)
      })`);
      assert.deepEqual(printLayout, { skipLinkHidden: true, gateLabelsFit: true });
      const printed = await client.send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true, paperWidth: 8.27, paperHeight: 11.69 });
      const pdf = Buffer.from(printed.data, 'base64');
      assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
      assert.ok(pdf.length > 10_000, `${report.id} PDF contains rendered content`);
      const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length;
      assert.equal(pages, 4, `${report.id} PDF preserves the reviewed four-page layout`);
      const file = path.join(artifactRoot, `${report.blueprintSlug}.pdf`);
      await writeFile(file, pdf);
      pdfResults.push({ blueprint: report.blueprintSlug, pages, bytes: pdf.length, file });
      await client.send('Emulation.setEmulatedMedia', { media: 'screen' });
    }

    await navigate(client, previewOrigin, '/blueprints');
    const screenshot = await client.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(path.join(artifactRoot, 'mobile-blueprints.png'), Buffer.from(screenshot.data, 'base64'));
    assert.deepEqual(browserErrors, [], `No browser errors: ${browserErrors.join(' | ')}`);
    await writeFile(path.join(artifactRoot, 'preflight-summary.json'), JSON.stringify({ routeResults, pdfResults, browserErrors }, null, 2));
    client.close();
    console.log(JSON.stringify({ chrome: 'passed', routes: routeResults.length, pdfs: pdfResults, artifactRoot }, null, 2));
  } finally {
    await Promise.all([stopProcess(preview), stopProcess(chrome)]);
    await sleep(150);
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}

await main();
