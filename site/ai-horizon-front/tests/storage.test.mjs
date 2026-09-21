import assert from 'node:assert/strict';
import test from 'node:test';
import { getWorkspaceExpiration, isWorkspaceActive, resetWorkshopStorage, withWorkspaceExpiration } from '../src/workshop-storage.js';
import { clearAllReportSkillWorkflows, clearReportSkillWorkflow, clearWorkspaceSkillWorkflow, qualityWorkflowKey, readPreparedSkills, readQualityPrepared, workflowKey } from '../src/workflow-storage.js';
import { clearReportComposerDraft, readReportComposerDraft, reportComposerDraftKey, saveReportComposerDraft } from '../src/report-draft-storage.js';
import { MemoryStorage } from './helpers.mjs';

const orderedSkills = [{ slug: 'evidence' }, { slug: 'severity' }, { slug: 'summary' }];

test('Workspace records expire after 24 hours', () => {
  const workspace = withWorkspaceExpiration({ createdAt: '2026-09-21T12:00:00.000Z' });
  assert.equal(getWorkspaceExpiration(workspace), '2026-09-22T12:00:00.000Z');
  assert.equal(isWorkspaceActive(workspace, Date.parse('2026-09-22T11:59:59.000Z')), true);
  assert.equal(isWorkspaceActive(workspace, Date.parse('2026-09-22T12:00:00.000Z')), false);
});

test('Reset removes only AI Horizon data from both storage scopes', () => {
  const local = new MemoryStorage({ 'ai-horizon-workspaces': '[]', unrelated: 'keep' });
  const session = new MemoryStorage({ 'ai-horizon-reports': '[]', other: 'keep' });
  resetWorkshopStorage(local, session);
  assert.equal(local.getItem('ai-horizon-workspaces'), null);
  assert.equal(session.getItem('ai-horizon-reports'), null);
  assert.equal(local.getItem('unrelated'), 'keep');
  assert.equal(session.getItem('other'), 'keep');
});

test('Workflow hydration accepts only an exact ordered prefix', () => {
  const storage = new MemoryStorage();
  storage.setItem(workflowKey('workspace-1'), JSON.stringify(['evidence', 'severity']));
  assert.deepEqual(readPreparedSkills(storage, 'workspace-1', orderedSkills), ['evidence', 'severity']);
  storage.setItem(workflowKey('workspace-1'), JSON.stringify(['severity', 'evidence']));
  assert.deepEqual(readPreparedSkills(storage, 'workspace-1', orderedSkills), []);
  storage.setItem(workflowKey('workspace-1'), JSON.stringify(['evidence', 'unknown']));
  assert.deepEqual(readPreparedSkills(storage, 'workspace-1', orderedSkills), []);
});

test('Quality state is report-specific and cleanup preserves unrelated records', () => {
  const local = new MemoryStorage({ [workflowKey('workspace-1')]: JSON.stringify(['evidence']) });
  const session = new MemoryStorage({
    [qualityWorkflowKey('workspace-1', 'report-1')]: 'prepared',
    [qualityWorkflowKey('workspace-1', 'report-2')]: 'prepared',
    [qualityWorkflowKey('workspace-2', 'report-3')]: 'prepared',
  });
  assert.equal(readQualityPrepared(session, 'workspace-1', 'report-1'), true);
  assert.equal(readQualityPrepared(session, 'workspace-1', 'report-3'), false);
  clearReportSkillWorkflow(session, 'workspace-1', 'report-1');
  assert.equal(readQualityPrepared(session, 'workspace-1', 'report-1'), false);
  assert.equal(readQualityPrepared(session, 'workspace-1', 'report-2'), true);
  clearWorkspaceSkillWorkflow(local, session, 'workspace-1');
  assert.equal(local.getItem(workflowKey('workspace-1')), null);
  assert.equal(readQualityPrepared(session, 'workspace-1', 'report-2'), false);
  assert.equal(readQualityPrepared(session, 'workspace-2', 'report-3'), true);
  clearAllReportSkillWorkflows(session);
  assert.equal(readQualityPrepared(session, 'workspace-2', 'report-3'), false);
});

test('Storage read failures return a safe empty state', () => {
  const broken = { getItem() { throw new Error('blocked'); } };
  assert.deepEqual(readPreparedSkills(broken, 'workspace-1', orderedSkills), []);
  assert.equal(readQualityPrepared(broken, 'workspace-1', 'report-1'), false);
});

test('Report composer drafts remain session-scoped and structurally validated', () => {
  const session = new MemoryStorage();
  const draft = {
    workspaceId: 'workspace-1', title: 'Draft', assumptions: '', confirmed: false, sections: { Summary: 'Observed fact' },
    findings: [{ id: 'finding-1', title: '', severity: 'High', rationale: '', source: '', retrievedAt: '', affectedScope: '', observedFact: '', confidence: 'Verified', action: '', owner: '', horizon: '30 days' }],
  };
  assert.equal(saveReportComposerDraft(session, draft), true);
  assert.deepEqual(readReportComposerDraft(session, 'workspace-1'), draft);
  assert.equal(readReportComposerDraft(session, 'workspace-2'), null);
  const secondDraft = { ...draft, workspaceId: 'workspace-2', title: 'Second draft' };
  assert.equal(saveReportComposerDraft(session, secondDraft), true);
  assert.deepEqual(readReportComposerDraft(session, 'workspace-2'), secondDraft);
  assert.deepEqual(readReportComposerDraft(session, 'workspace-1'), draft);
  session.setItem(reportComposerDraftKey('workspace-1'), JSON.stringify({ ...draft, findings: 'invalid' }));
  assert.equal(readReportComposerDraft(session, 'workspace-1'), null);
  assert.equal(clearReportComposerDraft(session, 'workspace-1'), true);
  assert.equal(session.getItem(reportComposerDraftKey('workspace-1')), null);
});

test('Report composer autosave reports storage failures', () => {
  const blocked = new MemoryStorage();
  blocked.setItem = () => { throw new Error('quota'); };
  assert.equal(saveReportComposerDraft(blocked, { workspaceId: 'workspace-1' }), false);
});

test('Reset attempts both storage scopes when one removal fails', () => {
  const local = new MemoryStorage({ 'ai-horizon-workspaces': '[]' });
  const session = new MemoryStorage({ 'ai-horizon-reports': 'private evidence' });
  local.removeItem = () => { throw new Error('blocked'); };
  const result = resetWorkshopStorage(local, session);
  assert.equal(result.ok, false);
  assert.equal(session.getItem('ai-horizon-reports'), null);
  assert.deepEqual(result.failures, ['local:ai-horizon-workspaces']);
});
