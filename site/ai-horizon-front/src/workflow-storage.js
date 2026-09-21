const WORKFLOW_PREFIX = 'ai-horizon-workshop-v6-workflow-';

export function workflowKey(workspaceId) {
  return `${WORKFLOW_PREFIX}${workspaceId}`;
}

export function qualityWorkflowKey(workspaceId, reportId) {
  return `${workflowKey(workspaceId)}-report-${reportId}`;
}

export function readPreparedSkills(storage, workspaceId, allowedSkills) {
  try {
    const saved = JSON.parse(storage.getItem(workflowKey(workspaceId)) || '[]');
    if (!Array.isArray(saved)) return [];
    if (saved.length > allowedSkills.length || saved.some((slug, index) => slug !== allowedSkills[index].slug)) return [];
    return [...saved];
  } catch {
    return [];
  }
}

export function readQualityPrepared(storage, workspaceId, reportId) {
  try {
    return storage.getItem(qualityWorkflowKey(workspaceId, reportId)) === 'prepared';
  } catch {
    return false;
  }
}

export function clearWorkspaceQualityWorkflows(storage, workspaceId) {
  const prefix = `${workflowKey(workspaceId)}-report-`;
  Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter((key) => key?.startsWith(prefix)).forEach((key) => storage.removeItem(key));
}

export function clearWorkspaceSkillWorkflow(local, session, workspaceId) {
  try {
    local.removeItem(workflowKey(workspaceId));
  } catch {
    // The Workspace record remains authoritative if checklist cleanup is unavailable.
  }
  try {
    clearWorkspaceQualityWorkflows(session, workspaceId);
  } catch {
    // The Workspace record remains authoritative if checklist cleanup is unavailable.
  }
}

export function clearReportSkillWorkflow(storage, workspaceId, reportId) {
  try {
    storage.removeItem(qualityWorkflowKey(workspaceId, reportId));
  } catch {
    // Report deletion remains authoritative if browser storage cleanup is unavailable.
  }
}

export function clearAllReportSkillWorkflows(storage) {
  try {
    Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter((key) => key?.startsWith(WORKFLOW_PREFIX) && key.includes('-report-')).forEach((key) => storage.removeItem(key));
  } catch {
    // Report deletion remains authoritative if browser storage cleanup is unavailable.
  }
}
