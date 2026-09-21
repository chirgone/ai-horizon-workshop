import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { blueprints } from '../src/blueprint-content.js';
import { connectors } from '../src/connector-content.js';
import { installationLesson } from '../src/installation.js';
import { reportConfidences, reportHorizons, reportSeverities, reportTemplates } from '../src/report-content.js';
import { skills } from '../src/skill-content.js';

test('Blueprint dependencies resolve in canonical order', () => {
  assert.deepEqual(blueprints.map(({ slug }) => slug), ['account-audit', 'attack-surface-risk', 'ai-governance-readiness']);
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
  assert.deepEqual(reportConfidences, ['Verified', 'High', 'Medium', 'Low']);
});

test('Installation content remains byte-for-byte equivalent at the object boundary', () => {
  const digest = createHash('sha256').update(JSON.stringify(installationLesson)).digest('hex');
  assert.equal(digest, 'c54363f2afaee8154c95ecfec49a50f0d39ce11a0b4fbcb10a7c02f5c496691b');
});
