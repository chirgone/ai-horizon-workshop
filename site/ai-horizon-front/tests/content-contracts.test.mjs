import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { blueprints } from '../src/blueprint-content.js';
import { connectors } from '../src/connector-content.js';
import { installationLesson } from '../src/installation.js';
import { reportConfidences, reportHorizons, reportSeverities, reportTemplates } from '../src/report-content.js';
import { skills } from '../src/skill-content.js';
import { controlGuides, exercises, lessons, resources, workshopJourney, workshopSequence } from '../src/workshop-content.js';

test('Blueprint dependencies resolve in canonical order', () => {
  assert.deepEqual(blueprints.map(({ slug }) => slug), ['account-audit', 'attack-surface-risk', 'security-misconfiguration', 'ai-governance-readiness', 'waf-bot-effectiveness', 'zero-trust-readiness', 'ai-gateway-usage-cost', 'workers-observability-reliability', 'dns-internet-performance', 'compliance-evidence-pack', 'radar-intelligence']);
  const connectorSlugs = new Set(connectors.map(({ slug }) => slug));
  const skillSlugs = skills.map(({ slug }) => slug);
  assert.deepEqual(skills.map(({ order }) => order), [1, 2, 3, 4, 5]);
  for (const blueprint of blueprints) {
    assert.ok(blueprint.connectorSlugs.every((slug) => connectorSlugs.has(slug)));
    assert.deepEqual(blueprint.skillSlugs, skillSlugs);
    assert.equal(new Set(blueprint.reportSections).size, blueprint.reportSections.length);
  }
});

test('Connector catalog remains read-only and HTTPS-only', () => {
  for (const connector of connectors) {
    assert.ok(connector.scope.endsWith(':read') || connector.protocol === 'OpenID Connect');
    assert.equal(connector.readOnlyTools.some((tool) => connector.blockedTools.includes(tool)), false);
    for (const origin of connector.allowedOrigins) {
      const url = new URL(origin);
      assert.equal(url.protocol, 'https:');
      assert.equal(url.username || url.password || url.port || url.search || url.hash, '');
    }
  }
});

test('Report templates preserve closed schemas and release gates', () => {
  assert.equal(reportTemplates.length, blueprints.length);
  for (const template of reportTemplates) {
    assert.equal(template.sections.length, template.sectionPrompts.length);
    assert.ok(template.sections.includes(template.findingsSection));
    assert.equal(new Set(template.qualityGates).size, template.qualityGates.length);
  }
  assert.deepEqual(reportSeverities, ['Critical', 'High', 'Medium', 'Low', 'Informational']);
  assert.deepEqual(reportHorizons, ['Immediate', '30 days', '60 days', '90 days', 'Accepted risk']);
  assert.deepEqual(reportConfidences, ['Verified', 'High', 'Medium', 'Low', 'Direct evidence', 'Evidence gap', 'Tool error', 'Not evaluated']);
});

test('Installation content remains byte-for-byte equivalent at the object boundary', () => {
  const digest = createHash('sha256').update(JSON.stringify(installationLesson)).digest('hex');
  assert.equal(digest, 'c54363f2afaee8154c95ecfec49a50f0d39ce11a0b4fbcb10a7c02f5c496691b');
  assert.equal(lessons[0], installationLesson);
});

test('Beginner path follows MCP, Workspace, Blueprint, output, and customization order', () => {
  const expectedSequence = [
    ['lesson', 'installation'],
    ['lesson', 'mcp-servers'],
    ['exercise', 'connect-mcp'],
    ['lesson', 'workshop-setup'],
    ['exercise', 'configure-workspace'],
    ['lesson', 'blueprint-selection'],
    ['exercise', 'run-account-audit'],
    ['lesson', 'evidence-collection'],
    ['lesson', 'report-generation'],
    ['exercise', 'generate-report'],
    ['lesson', 'security-review'],
    ['lesson', 'remediation-roadmap'],
    ['exercise', 'review-roadmap'],
    ['lesson', 'super-skills'],
    ['lesson', 'customize-look-and-feel'],
  ];
  assert.deepEqual(lessons.slice(0, 4).map(({ slug }) => slug), ['installation', 'mcp-servers', 'workshop-setup', 'blueprint-selection']);
  assert.deepEqual(workshopJourney.map(({ number }) => number), ['01', '02', '03', '04', '05', '06']);
  assert.deepEqual(workshopSequence.map(({ type, slug }) => [type, slug]), expectedSequence);
  assert.equal(workshopSequence.length, lessons.length + exercises.length);
  assert.equal(new Set(workshopSequence.map(({ type, slug }) => `${type}:${slug}`)).size, workshopSequence.length);
  assert.ok(workshopSequence.every(({ action, label }) => action && label));
  assert.deepEqual(workshopJourney.flatMap(({ required }) => required.map(({ type, slug }) => [type, slug])), expectedSequence);
});

test('Every detailed lesson explains each control and expected result', () => {
  assert.equal(controlGuides.installation, undefined);
  assert.deepEqual(Object.keys(controlGuides), lessons.slice(1).map(({ slug }) => slug));
  for (const lesson of lessons.slice(1)) {
    assert.ok(controlGuides[lesson.slug].length >= 3, `${lesson.slug} needs at least three documented controls`);
    for (const item of controlGuides[lesson.slug]) {
      assert.ok(item.control && item.purpose && item.result, `${lesson.slug} has an incomplete control guide`);
    }
  }
});

test('Look-and-feel customization closes the course with deployment guardrails', () => {
  const customization = lessons.at(-1);
  assert.equal(customization.number, '10');
  assert.equal(customization.slug, 'customize-look-and-feel');
  const content = JSON.stringify(customization.content.en);
  for (const required of ['**Site name**', '**Logo**', '**Theme**', '**Banner**', '**Top-bar notice**', '**Agent instructions**', '**2,000-character limit**', '**8,000-character limit**', '**next connection**']) {
    assert.match(content, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(content, /never include credentials, tokens, customer secrets/);
});

test('Hands-on MCP lab preserves its HTTPS and read-only boundary', () => {
  const lab = resources.find(({ slug }) => slug === 'hands-on-mcp-lab');
  assert.ok(lab);
  assert.deepEqual(
    lab.content.en.prerequisites.filter(({ url }) => url).map(({ url }) => new URL(url).protocol),
    ['https:'],
  );
  const content = JSON.stringify(lab.content.en);
  assert.match(content, /https:\/\/docs\.mcp\.cloudflare\.com\/mcp/);
  assert.match(content, /search_cloudflare_documentation/);
  assert.match(content, /migrate_pages_to_workers_guide/);
  assert.match(content, /Do not select All tools/);
  assert.ok(lab.content.en.prerequisites.every((item) => typeof item.text === 'string' && item.text));
  assert.ok(lab.content.en.troubleshooting.every((item) => item.issue && item.cause && item.fix));
});

test('Published Blueprint bindings match the archive manifest', async () => {
  const manifest = JSON.parse(await readFile(new URL('../../../blueprints/manifest.json', import.meta.url), 'utf8'));
  const publishedBlueprints = blueprints.filter(({ archive }) => archive);
  assert.equal(manifest.blueprints.length, publishedBlueprints.length);
  for (const blueprint of publishedBlueprints) {
    const archive = manifest.blueprints.find(({ id }) => id === blueprint.archive.id);
    assert.ok(archive, `Missing manifest entry for ${blueprint.slug}`);
    assert.equal(archive.file, blueprint.archive.file);
    assert.equal(archive.publicUrl, blueprint.archive.publicUrl);
    assert.deepEqual(archive.requiredBindings, blueprint.connections.map(({ binding }) => binding));
    assert.deepEqual(archive.expectedEndpoints, Object.fromEntries(blueprint.connections.map(({ binding, endpoint }) => [binding, endpoint])));
    const bytes = await readFile(new URL(`../../../blueprints/${archive.file}`, import.meta.url));
    assert.equal(bytes.length, archive.sizeBytes);
    assert.equal(bytes.subarray(0, 8).toString('hex'), manifest.archiveFormat.magic);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), archive.sha256);
  }
});

test('Create-with-AI templates exist and align with manifest and blueprint catalog', async () => {
  const manifest = JSON.parse(await readFile(new URL('../../../blueprints/manifest.json', import.meta.url), 'utf8'));
  const index = JSON.parse(await readFile(new URL('../../../blueprints/templates/index.json', import.meta.url), 'utf8'));
  assert.ok(Array.isArray(manifest.templates), 'manifest.templates must be an array');
  assert.equal(manifest.templates.length, blueprints.length, 'manifest.templates must have one entry per Blueprint');
  assert.equal(index.templates.length, blueprints.length, 'template index must have one entry per Blueprint');

  const indexSlugs = index.templates.map(({ slug }) => slug).sort();
  const blueprintSlugs = blueprints.map(({ slug }) => slug).sort();
  assert.deepEqual(indexSlugs, blueprintSlugs);

  const manifestSlugs = manifest.templates.map(({ slug }) => slug).sort();
  assert.deepEqual(manifestSlugs, blueprintSlugs);

  const officialEndpointPrefix = 'https://';
  for (const template of index.templates) {
    assert.match(template.publicUrl, /^https:\/\/github\.com\/chirgone\/ai-horizon-workshop\/blob\/main\/blueprints\/templates\//);
    assert.match(template.rawUrl, /^https:\/\/raw\.githubusercontent\.com\/chirgone\/ai-horizon-workshop\/main\/blueprints\/templates\//);
    assert.ok(template.requiredBindings.length > 0, `${template.slug} must declare required bindings`);
    for (const [binding, endpoint] of Object.entries(template.requiredEndpoints)) {
      assert.ok(template.requiredBindings.includes(binding));
      assert.ok(endpoint.startsWith(officialEndpointPrefix));
      assert.match(endpoint, /mcp\.cloudflare\.com\/mcp$/);
    }
    for (const endpoint of Object.values(template.optionalEndpoints)) {
      assert.match(endpoint, /mcp\.cloudflare\.com\/mcp$/);
    }
    assert.ok(template.createWithAIPrompt.includes(template.title), `${template.slug} prompt must mention the Blueprint title`);
    assert.ok(template.createWithAIPrompt.includes('Required MCP bindings'));
    assert.ok(template.installPrompt.includes('Cloudflare OS'));
    assert.ok(template.installPrompt.includes('read only'));
    const markdown = await readFile(new URL(`../../../${template.file}`, import.meta.url), 'utf8');
    assert.ok(markdown.includes('## Create with AI prompt'));
    assert.ok(markdown.includes('## Operator install prompt'));
    assert.ok(!markdown.includes('—'), `${template.slug} must not contain em dashes`);
  }
});

test('Start-to-finish runbook covers the blocking workshop gates', () => {
  const runbook = resources.find(({ slug }) => slug === 'start-to-finish-runbook');
  assert.ok(runbook);
  const content = JSON.stringify(runbook.content.en);
  for (const required of ['MCP_CLOUDFLARE', 'MCP_AUDITLOGS', 'MCP_OBSERVABILITY', 'MCP_RADAR', 'create_url_scan', 'Draft, review required', 'Download archive', 'SHA-256', 'Reset workshop data']) {
    assert.match(content, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
