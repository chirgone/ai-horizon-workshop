const REPORT_COMPOSER_DRAFT_PREFIX = 'ai-horizon-workshop-v7-report-composer-';
const findingFields = ['id', 'title', 'severity', 'rationale', 'source', 'retrievedAt', 'affectedScope', 'observedFact', 'confidence', 'action', 'owner', 'horizon'];

export function reportComposerDraftKey(workspaceId) {
  return `${REPORT_COMPOSER_DRAFT_PREFIX}${workspaceId}`;
}

export function readReportComposerDraft(storage, workspaceId) {
  try {
    const draft = JSON.parse(storage.getItem(reportComposerDraftKey(workspaceId)) || 'null');
    if (!draft || draft.workspaceId !== workspaceId || typeof draft.title !== 'string' || typeof draft.assumptions !== 'string' || typeof draft.confirmed !== 'boolean') return null;
    if (!draft.sections || Object.values(draft.sections).some((value) => typeof value !== 'string')) return null;
    if (!Array.isArray(draft.findings) || draft.findings.length < 1 || draft.findings.length > 5) return null;
    if (draft.findings.some((finding) => !finding || findingFields.some((field) => typeof finding[field] !== 'string'))) return null;
    return draft;
  } catch {
    return null;
  }
}

export function saveReportComposerDraft(storage, draft) {
  try {
    storage.setItem(reportComposerDraftKey(draft.workspaceId), JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function clearReportComposerDraft(storage, workspaceId) {
  try {
    storage.removeItem(reportComposerDraftKey(workspaceId));
    return true;
  } catch {
    return false;
  }
}
