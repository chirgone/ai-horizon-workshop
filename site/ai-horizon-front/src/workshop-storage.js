export const SETTINGS_KEY = 'ai-horizon-school-settings';
export const WORKSPACES_KEY = 'ai-horizon-workshop-v3-workspaces';
export const REPORTS_KEY = 'ai-horizon-workshop-v5-reports';
export const WORKSPACE_RETENTION_MS = 24 * 60 * 60 * 1000;

export function getWorkspaceExpiration(workspace) {
  if (typeof workspace?.expiresAt === 'string' && !Number.isNaN(Date.parse(workspace.expiresAt))) return workspace.expiresAt;
  if (typeof workspace?.createdAt !== 'string' || Number.isNaN(Date.parse(workspace.createdAt))) return null;
  return new Date(Date.parse(workspace.createdAt) + WORKSPACE_RETENTION_MS).toISOString();
}

export function withWorkspaceExpiration(workspace) {
  return { ...workspace, expiresAt: getWorkspaceExpiration(workspace) };
}

export function isWorkspaceActive(workspace, now = Date.now()) {
  const expiresAt = getWorkspaceExpiration(workspace);
  return Boolean(expiresAt) && Date.parse(expiresAt) > now;
}

export function removeNamespacedData(storage) {
  const failures = [];
  let keys = [];
  try {
    keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter((key) => key?.startsWith('ai-horizon-'));
  } catch {
    return { ok: false, failures: ['storage-enumeration'] };
  }
  for (const key of keys) {
    try {
      storage.removeItem(key);
    } catch {
      failures.push(key);
    }
  }
  return { ok: failures.length === 0, failures };
}

export function resetWorkshopStorage(local, session) {
  const sessionResult = removeNamespacedData(session);
  const localResult = removeNamespacedData(local);
  return {
    ok: sessionResult.ok && localResult.ok,
    failures: [...sessionResult.failures.map((key) => `session:${key}`), ...localResult.failures.map((key) => `local:${key}`)],
  };
}
