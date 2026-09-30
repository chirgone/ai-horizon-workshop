import React, { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { blueprints, getBlueprint } from './blueprint-content';
import { connectors, getBlueprintConnectors, getConnector } from './connector-content';
import { OutputsPage, ReportCreate, ReportDetail, ReportTemplateDetail, WorkspaceReports } from './ReportPages';
import { getReportTemplateForBlueprint, reportBelongsToKnownBlueprint, reportConfidences, reportHorizons, reportSeverities } from './report-content';
import { clearReportComposerDraft } from './report-draft-storage';
import { SkillCatalog, SkillDetail, SkillLinks, SkillWorkflow } from './SkillPages';
import { controlGuides, exercises, lessons, resources, shellCopy, workshopJourney, workshopSequence } from './workshop-content';
import { getWorkspaceExpiration, isWorkspaceActive, REPORTS_KEY, resetWorkshopStorage, SETTINGS_KEY, withWorkspaceExpiration, WORKSPACES_KEY } from './workshop-storage';
import { clearAllReportSkillWorkflows, clearReportSkillWorkflow, clearWorkspaceSkillWorkflow } from './workflow-storage';
const routePrefixes = {
  lesson: 'lessons',
  exercise: 'exercises',
  resource: 'resources',
};

const legacyVisibleTextReplacements = {
  en: {
    'Super Seal': 'Cloudflare OS',
  },
  es: {
    'Super Seal': 'Cloudflare OS',
    '`New skill`': '`New skill`',
    '`Skill name`': '`Skill name`',
    '`Description`': '`Description`',
    '`Body`': '`Body`',
    '`Markdown content`': '`Markdown content`',
    '`shared/skills/.../SKILL.md`': '`shared/skills/.../SKILL.md`',
    '`shared/skills`': '`shared/skills`',
    'Build a Skill': 'Crear una habilidad',
    'Cross-workspace rules': 'Reglas entre espacios de trabajo',
    'Default sandbox model': 'Modelo predeterminado del entorno aislado',
    'Default Seal model': 'Modelo predeterminado de Seal',
    'MCP Servers': 'Servidores MCP',
    'Advanced Deployment': 'Despliegue avanzado',
    'Lessons': 'Lecciones',
    'Exercises': 'Ejercicios',
    'Guides': 'Guias',
    'Getting Started': 'Primeros pasos',
    'Tips': 'Consejos',
    'Cheatsheet': 'Guia rapida',
    'Glossary': 'Glosario',
    'Troubleshooting': 'Solucion de problemas',
    'Installation': 'Instalacion',
    'Home': 'Inicio',
    'Workspaces': 'Espacios de trabajo',
    'Outputs': 'Resultados',
    'Shared with me': 'Compartido conmigo',
    'Scheduled Tasks': 'Tareas programadas',
    'Context': 'Contexto',
    'Skills': 'Habilidades',
    'Search': 'Busqueda',
    'New workspace': 'Nuevo espacio de trabajo',
    'Integrations': 'Integraciones',
    'Settings': 'Configuracion',
    'slash commands directos': 'comandos directos',
    'All skills': 'Todas las habilidades',
    'Selected groups': 'Grupos seleccionados',
    'Approval needed': 'Aprobacion requerida',
    'Permission requested': 'Permiso solicitado',
    'Input needed': 'Entrada requerida',
    'MCP authorization required': 'Autorizacion MCP requerida',
    'Re-authentication required': 'Reautenticacion requerida',
    'Install GitHub App': 'Instalar aplicacion de GitHub',
    'Default uses high': 'El valor predeterminado usa razonamiento alto',
    'Default, None, Low, Medium, High, and Very High': 'Predeterminado, ninguno, bajo, medio, alto y muy alto',
    'Default, None, Low, Medium, High y Very High': 'Predeterminado, ninguno, bajo, medio, alto y muy alto',
    'workspace agents': 'agentes del espacio de trabajo',
    'workspace agent': 'agente del espacio de trabajo',
    'workspace conversations': 'conversaciones del espacio de trabajo',
    'workspace conversation': 'conversacion del espacio de trabajo',
    'workspaces': 'espacios de trabajo',
    'workspace': 'espacio de trabajo',
    'outputs': 'resultados',
    'output': 'resultado',
    'skills': 'habilidades',
    'skill': 'habilidad',
    'workflows': 'flujos de trabajo',
    'workflow': 'flujo de trabajo',
    'prompts': 'instrucciones',
    'prompting': 'redaccion de instrucciones',
    'prompt': 'instruccion',
    'briefs': 'resumenes',
    'brief': 'resumen',
    'follow-ups': 'seguimientos',
    'follow-up': 'seguimiento',
    'updates': 'actualizaciones',
    'handoffs': 'traspasos',
    'handoff': 'traspaso',
    'share de prueba': 'elemento compartido de prueba',
    'share real': 'elemento compartido real',
    'shares': 'elementos compartidos',
    'share': 'elemento compartido',
    'facts': 'datos',
    'fact': 'dato',
    'proof points': 'puntos de prueba',
    'proof': 'prueba',
    'messaging': 'mensaje aprobado',
    'browser notifications': 'notificaciones del navegador',
    'notification sound': 'sonido de notificacion',
    'timezone': 'zona horaria',
    'timestamps': 'marcas de tiempo',
    'settings': 'configuraciones',
    'defaults': 'valores predeterminados',
    'default': 'predeterminado',
    'inputs': 'entradas',
    'input': 'entrada',
    'items': 'elementos',
    'item': 'elemento',
    'customer-safe': 'seguro para compartir',
    'background': 'contexto',
    'chat turn': 'turno de conversacion',
    'picker': 'selector',
    'browsing': 'navegacion',
    'slash commands': 'comandos directos',
    'sandboxed code': 'codigo en entorno aislado',
    'sandbox model': 'modelo del entorno aislado',
    'sandbox': 'entorno aislado',
    'hosted path': 'ruta alojada',
    'hosted flow': 'flujo alojado',
    'demo': 'demostracion',
  },
  pt: {
    'Super Seal': 'Cloudflare OS',
    '`New skill`': '`New skill`',
    '`Skill name`': '`Skill name`',
    '`Description`': '`Description`',
    '`Body`': '`Body`',
    '`Markdown content`': '`Markdown content`',
    '`shared/skills/.../SKILL.md`': '`shared/skills/.../SKILL.md`',
    '`shared/skills`': '`shared/skills`',
    'Build a Skill': 'Criar uma habilidade',
    'Cross-workspace rules': 'Regras entre espacos de trabalho',
    'Default sandbox model': 'Modelo padrao do ambiente isolado',
    'Default Seal model': 'Modelo padrao do Seal',
    'MCP Servers': 'Servidores MCP',
    'Advanced Deployment': 'Implantacao avancada',
    'Lessons': 'Licoes',
    'Exercises': 'Exercicios',
    'Guides': 'Guias',
    'Getting Started': 'Primeiros passos',
    'Tips': 'Dicas',
    'Cheatsheet': 'Guia rapido',
    'Glossary': 'Glossario',
    'Troubleshooting': 'Solucao de problemas',
    'Installation': 'Instalacao',
    'Home': 'Inicio',
    'Workspaces': 'Espacos de trabalho',
    'Outputs': 'Resultados',
    'Shared with me': 'Compartilhado comigo',
    'Scheduled Tasks': 'Tarefas agendadas',
    'Context': 'Contexto',
    'Skills': 'Habilidades',
    'Search': 'Busca',
    'New workspace': 'Novo espaco de trabalho',
    'Integrations': 'Integracoes',
    'Settings': 'Configuracoes',
    'Slash commands diretos': 'Comandos diretos',
    'slash commands diretos': 'comandos diretos',
    'All skills': 'Todas as habilidades',
    'Selected groups': 'Grupos selecionados',
    'Approval needed': 'Aprovacao necessaria',
    'Permission requested': 'Permissao solicitada',
    'Input needed': 'Entrada necessaria',
    'MCP authorization required': 'Autorizacao MCP necessaria',
    'Re-authentication required': 'Reautenticacao necessaria',
    'Install GitHub App': 'Instalar aplicativo do GitHub',
    'Default uses high': 'O valor padrao usa raciocinio alto',
    'Default, None, Low, Medium, High, and Very High': 'Padrao, nenhum, baixo, medio, alto e muito alto',
    'Default, None, Low, Medium, High e Very High': 'Padrao, nenhum, baixo, medio, alto e muito alto',
    'workspace agents': 'agentes do espaco de trabalho',
    'workspace agent': 'agente do espaco de trabalho',
    'workspace conversations': 'conversas do espaco de trabalho',
    'workspace conversation': 'conversa do espaco de trabalho',
    'workspaces': 'espacos de trabalho',
    'workspace': 'espaco de trabalho',
    'outputs': 'resultados',
    'output': 'resultado',
    'skills': 'habilidades',
    'skill': 'habilidade',
    'workflows': 'fluxos de trabalho',
    'workflow': 'fluxo de trabalho',
    'prompts': 'instrucoes',
    'prompting': 'redacao de instrucoes',
    'prompt': 'instrucao',
    'briefs': 'resumos',
    'brief': 'resumo',
    'follow-ups': 'acompanhamentos',
    'follow-up': 'acompanhamento',
    'updates': 'atualizacoes',
    'handoffs': 'transferencias',
    'handoff': 'transferencia',
    'share de teste': 'item compartilhado de teste',
    'compartilhamento de teste': 'item compartilhado de teste',
    'shares': 'itens compartilhados',
    'share': 'item compartilhado',
    'facts': 'dados',
    'fact': 'dado',
    'proof points': 'pontos de prova',
    'proof': 'prova',
    'messaging': 'mensagem aprovada',
    'browser notifications': 'notificacoes do navegador',
    'notification sound': 'som de notificacao',
    'timezone': 'fuso horario',
    'timestamps': 'marcas de tempo',
    'settings': 'configuracoes',
    'defaults': 'valores padrao',
    'default': 'padrao',
    'inputs': 'entradas',
    'input': 'entrada',
    'items': 'itens',
    'item': 'item',
    'customer-safe': 'seguro para compartilhar',
    'background': 'contexto',
    'chat turn': 'turno de conversa',
    'picker': 'seletor',
    'browsing': 'navegacao',
    'slash commands': 'comandos diretos',
    'sandboxed code': 'codigo em ambiente isolado',
    'sandbox model': 'modelo do ambiente isolado',
    'sandbox': 'ambiente isolado',
    'hosted path': 'caminho hospedado',
    'hosted flow': 'fluxo hospedado',
    'demo': 'demonstracao',
  },
};

const visibleTextReplacements = {
  en: {
    'Super Seal': 'Cloudflare OS',
  },
};

const primaryNavigation = [
  { label: 'Home', path: '/' },
  { label: 'Workspaces', path: '/workspaces' },
  { label: 'Blueprints', path: '/blueprints' },
  { label: 'Outputs', path: '/outputs' },
  { label: 'Explore', path: '/explore' },
];

const navigationGuide = [
  { control: 'Home', purpose: 'Returns to the six-stage guided path and your next incomplete step.' },
  { control: 'Workspaces', purpose: 'Opens Workspace setup guidance and browser-local workshop records.' },
  { control: 'Blueprints', purpose: 'Opens reusable Blueprint packages, contracts, and practice checkpoints.' },
  { control: 'Outputs', purpose: 'Opens report templates and session-scoped PDF drafts.' },
  { control: 'Explore', purpose: 'Opens MCP, Skill, runbook, and advanced reference material.' },
  { control: 'Look & Feel', purpose: 'Opens the final deployment customization step under Explore.' },
  { control: 'Favorites', purpose: 'Reserved for Workspace shortcuts. It does not affect workshop progress.' },
  { control: 'Recent workspaces', purpose: 'Reopens the three most recent browser-local Workspace records.' },
];

const portalPages = {
  workspaces: {
    eyebrow: 'Cloudflare OS',
    title: 'Workspaces',
    intro: 'Start with a governed workspace, connect only the context it needs, and keep every customer outcome isolated and auditable.',
    items: [
      { label: 'Start here', title: 'Installation workspace', body: 'Deploy your Cloudflare OS workspace through the existing hosted installation flow.', path: '/lessons/installation', action: 'Start Installation' },
      { label: 'Step 2', title: 'MCP connections', body: 'Create the minimum read-only Gatekeeper connections before granting them to a Workspace.', path: '/lessons/mcp-servers', action: 'Configure MCPs' },
      { label: 'Step 3', title: 'Governed Workspace', body: 'Define the boundary, grant approved MCPs, and run one harmless activity.', path: '/lessons/workshop-setup', action: 'Create and test Workspace' },
    ],
  },
  explore: {
    eyebrow: 'Cloudflare OS catalog',
    title: 'Explore',
    intro: 'Find installation guidance, MCP connections, reusable skills, and the workshop material behind every Blueprint.',
    items: [
      { label: 'Canonical sequence', title: 'Start-to-Finish Workshop Runbook', body: 'Follow every installation, MCP, Workspace, Blueprint, output, customization, integrity, and cleanup step in one validated order.', path: '/resources/start-to-finish-runbook', action: 'Open full runbook' },
      { label: 'Foundation', title: 'Installation', body: 'Deploy the workspace used throughout the workshop.', path: '/lessons/installation', action: 'Start Installation' },
      { label: 'Connection', title: 'MCP Servers', body: 'Understand the governed connection layer for live tools and enterprise data.', path: '/lessons/mcp-servers', action: 'Open MCP guide' },
      { label: 'Test systems', title: 'Corporate Test Connectors', body: 'Inspect the workshop-safe CRM, HR, collaboration, wiki, and identity contracts.', path: '/connectors', action: 'Inspect connector contracts' },
      { label: 'Reusable capability', title: 'Super Skills', body: 'Inspect reusable evidence, analysis, planning, and quality contracts.', path: '/skills', action: 'Inspect Skill contracts' },
      { label: 'Final step', title: 'Look & Feel', body: 'Finalize site identity, theme, notices, and deployment-wide agent instructions after the workflow is validated.', path: '/lessons/customize-look-and-feel', action: 'Open customization guide' },
      { label: 'Documentation', title: 'Cloudflare Docs MCP', body: 'Review the official catalog, then connect the read-only endpoint at docs.mcp.cloudflare.com/mcp.', href: 'https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/', action: 'Open official MCP catalog' },
    ],
  },
};

function keyFor(type, audience) {
  return `ai-horizon-workshop-v2-progress-${type}-${audience}`;
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function readSessionJson(key, fallback) {
  try {
    return JSON.parse(sessionStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function readWorkspaceRecords() {
  const stored = readJson(WORKSPACES_KEY, []);
  if (!Array.isArray(stored)) return [];
  const valid = stored.filter((item) => item
    && ['id', 'name', 'owner', 'audience', 'blueprintSlug', 'createdAt'].every((key) => typeof item[key] === 'string' && item[key])
    && getBlueprint(item.blueprintSlug)
    && !Number.isNaN(Date.parse(item.createdAt)));
  const active = valid.filter((workspace) => {
    if (isWorkspaceActive(workspace)) return true;
    clearWorkspaceSkillWorkflow(localStorage, sessionStorage, workspace.id);
    return !clearReportComposerDraft(sessionStorage, workspace.id);
  }).map((workspace) => isWorkspaceActive(workspace) ? workspace : { ...workspace, status: 'Cleanup required' });
  if (active.length !== stored.length) {
    const activeIds = new Set(active.map((workspace) => workspace.id));
    stored.filter((workspace) => typeof workspace?.id === 'string' && !activeIds.has(workspace.id)).forEach((workspace) => {
      clearWorkspaceSkillWorkflow(localStorage, sessionStorage, workspace.id);
      clearReportComposerDraft(sessionStorage, workspace.id);
    });
    try {
      localStorage.setItem(WORKSPACES_KEY, JSON.stringify(active));
    } catch {
      // Expired records remain hidden if browser cleanup is unavailable.
    }
  }
  return active;
}

function readReportRecords() {
  const stored = readSessionJson(REPORTS_KEY, []);
  if (!Array.isArray(stored)) return [];
  const workspaces = readWorkspaceRecords();
  const findingFields = ['id', 'title', 'rationale', 'source', 'tool', 'parameters', 'retrievedAt', 'affectedScope', 'observedFact', 'action', 'owner'];

  const active = stored.filter((item) => {
    if (!item || !reportBelongsToKnownBlueprint(item)) return false;
    const workspace = workspaces.find((record) => record.id === item.workspaceId);
    const template = getReportTemplateForBlueprint(item.blueprintSlug);
    if (!workspace || workspace.blueprintSlug !== item.blueprintSlug || !template) return false;
    if (typeof item.id !== 'string' || !item.id || typeof item.title !== 'string' || !item.title || item.title.length > 120) return false;
    if (typeof item.assumptions !== 'string' || !item.assumptions || item.assumptions.length > 800 || Number.isNaN(Date.parse(item.createdAt))) return false;
    if (!item.sections || Object.keys(item.sections).length !== template.sections.length) return false;
    if (!template.sections.every((section) => typeof item.sections[section] === 'string' && item.sections[section] && item.sections[section].length <= 1600)) return false;
    if (!Array.isArray(item.findings) || item.findings.length < 1 || item.findings.length > 5) return false;
    return item.findings.every((finding) => finding
      && findingFields.every((key) => typeof finding[key] === 'string' && finding[key] && finding[key].length <= 800)
      && reportSeverities.includes(finding.severity)
      && reportHorizons.includes(finding.horizon)
      && reportConfidences.includes(finding.confidence)
      && template.evidenceClassifications.includes(finding.confidence)
      && !Number.isNaN(Date.parse(finding.retrievedAt)));
  });
  if (active.length !== stored.length) {
    try {
      sessionStorage.setItem(REPORTS_KEY, JSON.stringify(active));
    } catch {
      // Invalid drafts remain hidden if browser cleanup is unavailable.
    }
  }
  return active;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function translateVisibleText(text, locale) {
  if (typeof text !== 'string') return text;

  const replacements = visibleTextReplacements[locale] || visibleTextReplacements.en;
  const keys = Object.keys(replacements).sort((a, b) => b.length - a.length);
  const codeSpans = [];
  const protectedText = text.replace(/`[^`]+`/g, (match) => {
    const token = `__CODE_SPAN_${codeSpans.length}__`;
    codeSpans.push(match);
    return token;
  }).replace(/[A-Za-z0-9_-]+\/[A-Za-z0-9_./-]+/g, (match) => {
    const token = `__CODE_SPAN_${codeSpans.length}__`;
    codeSpans.push(match);
    return token;
  });

  const translated = keys.reduce((current, key) => current.replace(new RegExp(escapeRegExp(key), 'g'), replacements[key]), protectedText);

  return codeSpans.reduce((current, codeSpan, index) => current.replace(`__CODE_SPAN_${index}__`, codeSpan), translated);
}

function renderInlineText(text, locale) {
  const translated = translateVisibleText(text, locale);
  const parts = String(translated).split(/(\*\*[^*]+\*\*)/g).filter(Boolean);

  return parts.flatMap((part, partIndex) => {
    const strong = part.startsWith('**') && part.endsWith('**');
    const cleanPart = strong ? part.slice(2, -2) : part;
    const linkParts = cleanPart.split(/((?:https?:\/\/)?(?:os\.cloudflare\.app\/deploy|dash\.cloudflare\.com)(?:\/[^\s"')]+)?)/g).filter(Boolean);

    return linkParts.map((linkPart, linkIndex) => {
      const key = `${partIndex}-${linkIndex}`;
      const isLink = /^(?:https?:\/\/)?(?:os\.cloudflare\.app\/deploy|dash\.cloudflare\.com)/.test(linkPart);
      const node = isLink
        ? <a key={key} href={linkPart.startsWith('http') ? linkPart : `https://${linkPart}`} target="_blank" rel="noreferrer">{linkPart}</a>
        : linkPart;

      return strong ? <strong key={key}>{node}</strong> : node;
    });
  });
}

function getEntryPath(type, slug) {
  return `/${routePrefixes[type]}/${slug}`;
}

function getSectionPath(type) {
  if (type === 'lesson' || type === 'exercise') return '/';
  return '/explore';
}

function getEntryTitle(entry, locale) {
  return translateVisibleText(entry.content?.[locale]?.title || entry.title, locale);
}

function getPageTypeLabel(type, copy) {
  if (type === 'lesson') return 'Workshop step';
  if (type === 'exercise') return 'Workshop checkpoint';
  return 'Explore';
}

function formatDuration(entry, copy) {
  return entry.duration ? `${entry.duration} ${copy.duration}` : null;
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const saved = readJson(SETTINGS_KEY, {});
  const locale = 'en';
  const [audience, setAudience] = useState(saved.audience || 'customer');
  const [lessonProgress, setLessonProgress] = useState(() => readJson(keyFor('lessons', saved.audience || 'customer'), []));
  const [exerciseProgress, setExerciseProgress] = useState(() => readJson(keyFor('exercises', saved.audience || 'customer'), []));
  const [workspaces, setWorkspaces] = useState(readWorkspaceRecords);
  const [reports, setReports] = useState(readReportRecords);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    try {
      if (audience === 'customer') localStorage.removeItem(SETTINGS_KEY);
      else localStorage.setItem(SETTINGS_KEY, JSON.stringify({ locale, audience }));
    } catch {
      // Preferences are optional; governed records use explicit guarded writes below.
    }
  }, [audience]);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!navOpen) return undefined;
    const navigation = document.getElementById('workshop-navigation');
    const focusable = [...navigation.querySelectorAll('a[href],button:not([disabled])')];
    focusable[0]?.focus();
    function containNavigationFocus(event) {
      if (event.key === 'Escape') {
        setNavOpen(false);
        return;
      }
      if (event.key !== 'Tab' || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', containNavigationFocus);
    return () => {
      document.removeEventListener('keydown', containNavigationFocus);
      document.querySelector('.nav-toggle')?.focus();
    };
  }, [navOpen]);

  useEffect(() => {
    const expirableWorkspaces = workspaces.filter((workspace) => workspace.status !== 'Cleanup required');
    if (expirableWorkspaces.length === 0) return undefined;
    const nearestExpiration = Math.min(...expirableWorkspaces.map((workspace) => Date.parse(getWorkspaceExpiration(workspace))));
    const delay = Math.min(Math.max(nearestExpiration - Date.now() + 50, 0), 2_147_483_647);
    const timer = window.setTimeout(() => {
      const activeWorkspaces = readWorkspaceRecords();
      const activeIds = new Set(activeWorkspaces.map((workspace) => workspace.id));
      workspaces.filter((workspace) => !activeIds.has(workspace.id)).forEach((workspace) => {
        clearWorkspaceSkillWorkflow(localStorage, sessionStorage, workspace.id);
        clearReportComposerDraft(sessionStorage, workspace.id);
      });
      setWorkspaces(activeWorkspaces);
      setReports(readReportRecords());
    }, delay);
    return () => window.clearTimeout(timer);
  }, [workspaces]);

  useEffect(() => {
    setLessonProgress(readJson(keyFor('lessons', audience), []));
    setExerciseProgress(readJson(keyFor('exercises', audience), []));
  }, [audience]);

  useEffect(() => {
    function syncLocalRecords(event) {
      if (event.key === WORKSPACES_KEY) {
        setWorkspaces(readWorkspaceRecords());
        setReports(readReportRecords());
      }
    }

    window.addEventListener('storage', syncLocalRecords);
    return () => window.removeEventListener('storage', syncLocalRecords);
  }, []);

  const totalRequired = workshopSequence.length;
  const totalCompleted = lessonProgress.length + exerciseProgress.length;
  const nextStep = workshopSequence.find((item) => !(item.type === 'lesson' ? lessonProgress : exerciseProgress).includes(item.slug));
  const nextCollection = nextStep?.type === 'lesson' ? lessons : exercises;
  const nextEntry = nextStep ? nextCollection.find((item) => item.slug === nextStep.slug) : null;
  const nextRecommended = nextEntry ? { ...nextEntry, type: nextStep.type, action: nextStep.action } : null;

  const context = {
    locale,
    audience,
    setAudience,
    lessonProgress,
    exerciseProgress,
    totalRequired,
    totalCompleted,
    nextRecommended,
    toggleLesson: (slug) => toggleProgress(keyFor('lessons', audience), slug, setLessonProgress),
    toggleExercise: (slug) => toggleProgress(keyFor('exercises', audience), slug, setExerciseProgress),
    resetAll: () => {
      localStorage.removeItem(keyFor('lessons', audience));
      localStorage.removeItem(keyFor('exercises', audience));
      setLessonProgress([]);
      setExerciseProgress([]);
    },
    workspaces,
    reports,
    createWorkspace: (workspace) => {
      const latest = readWorkspaceRecords();
      const expiringWorkspace = withWorkspaceExpiration(workspace);
      const next = [expiringWorkspace, ...latest.filter((item) => item.id !== workspace.id)];
      try {
        localStorage.setItem(WORKSPACES_KEY, JSON.stringify(next));
        setWorkspaces(next);
        return true;
      } catch {
        return false;
      }
    },
    createReport: (report) => {
      const latest = readReportRecords();
      const next = [report, ...latest.filter((item) => item.id !== report.id)];
      try {
        sessionStorage.setItem(REPORTS_KEY, JSON.stringify(next));
        setReports(next);
        return true;
      } catch {
        return false;
      }
    },
    deleteReport: (reportId) => {
      const current = readReportRecords();
      const deleted = current.find((report) => report.id === reportId);
      const next = current.filter((report) => report.id !== reportId);
      sessionStorage.setItem(REPORTS_KEY, JSON.stringify(next));
      if (deleted) clearReportSkillWorkflow(sessionStorage, deleted.workspaceId, deleted.id);
      setReports(next);
    },
    clearReports: () => {
      sessionStorage.removeItem(REPORTS_KEY);
      clearAllReportSkillWorkflows(sessionStorage);
      setReports([]);
    },
    deleteWorkspace: (workspaceId) => {
      const nextWorkspaces = readWorkspaceRecords().filter((workspace) => workspace.id !== workspaceId);
      const nextReports = readReportRecords().filter((report) => report.workspaceId !== workspaceId);
      try {
        sessionStorage.setItem(REPORTS_KEY, JSON.stringify(nextReports));
        if (!clearReportComposerDraft(sessionStorage, workspaceId)) return false;
        setReports(nextReports);
      } catch {
        return false;
      }
      clearWorkspaceSkillWorkflow(localStorage, sessionStorage, workspaceId);
      try {
        localStorage.setItem(WORKSPACES_KEY, JSON.stringify(nextWorkspaces));
        setWorkspaces(nextWorkspaces);
        return true;
      } catch {
        return false;
      }
    },
    resetWorkshopData: () => {
      const result = resetWorkshopStorage(localStorage, sessionStorage);
      if (result.ok) {
        setAudience('customer');
        setLessonProgress([]);
        setExerciseProgress([]);
        setWorkspaces([]);
        setReports([]);
        navigate('/');
        return true;
      }
      setWorkspaces(readWorkspaceRecords());
      setReports(readReportRecords());
      const retained = readJson(SETTINGS_KEY, {});
      const retainedAudience = retained.audience || 'customer';
      setAudience(retainedAudience);
      setLessonProgress(readJson(keyFor('lessons', retainedAudience), []));
      setExerciseProgress(readJson(keyFor('exercises', retainedAudience), []));
      return false;
    },
  };

  return (
    <div className="layout-shell">
      <a className="skip-link" href="#main-content" tabIndex={navOpen ? -1 : undefined}>Skip to main content</a>
      <Sidebar
        navOpen={navOpen}
        onNavigate={() => setNavOpen(false)}
        workspaces={workspaces}
      />
      {navOpen ? <button className="nav-backdrop" type="button" aria-label="Close navigation" onClick={() => setNavOpen(false)} /> : null}
      <div className="main-area">
        <TopBar {...context} navOpen={navOpen} onToggleNav={() => setNavOpen((value) => !value)} />
        <RouteEffects />
        <div id="main-content" className="route-view" inert={navOpen ? true : undefined}>
        <Routes>
          <Route path="/" element={<Home {...context} />} />
          <Route path="/workspaces" element={<HubPage page={portalPages.workspaces}><WorkspaceLibrary workspaces={workspaces} /></HubPage>} />
          <Route path="/blueprints" element={<BlueprintCatalog />} />
          <Route path="/blueprints/:slug" element={<BlueprintDetail />} />
          <Route path="/connectors" element={<ConnectorCatalog />} />
          <Route path="/connectors/:slug" element={<ConnectorDetail />} />
          <Route path="/skills" element={<SkillCatalog />} />
          <Route path="/skills/:slug" element={<SkillDetail />} />
          <Route path="/workspaces/new" element={<WorkspaceCreate createWorkspace={context.createWorkspace} />} />
          <Route path="/workspaces/:workspaceId" element={<WorkspaceDetail workspaces={workspaces} reports={reports} deleteWorkspace={context.deleteWorkspace} />} />
          <Route path="/outputs" element={<OutputsPage reports={reports} workspaces={workspaces} deleteReport={context.deleteReport} clearReports={context.clearReports} />} />
          <Route path="/outputs/new" element={<ReportCreate workspaces={workspaces} createReport={context.createReport} />} />
          <Route path="/outputs/templates/:slug" element={<ReportTemplateDetail workspaces={workspaces} />} />
          <Route path="/outputs/:reportId" element={<ReportDetail reports={reports} workspaces={workspaces} deleteReport={context.deleteReport} />} />
          <Route path="/explore" element={<HubPage page={portalPages.explore} />} />
          <Route path="/lessons" element={<SectionPage type="lesson" {...context} />} />
          <Route path="/exercises" element={<SectionPage type="exercise" {...context} />} />
          <Route path="/resources" element={<SectionPage type="resource" {...context} />} />
          <Route path="/lessons/:slug" element={<EntryPage type="lesson" {...context} />} />
          <Route path="/exercises/:slug" element={<EntryPage type="exercise" {...context} />} />
          <Route path="/resources/:slug" element={<EntryPage type="resource" {...context} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </div>
      </div>
    </div>
  );
}

function toggleProgress(storageKey, slug, setter) {
  setter((current) => {
    const next = current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug];
    localStorage.setItem(storageKey, JSON.stringify(next));
    return next;
  });
}

function Sidebar({ navOpen, onNavigate, workspaces }) {
  const location = useLocation();
  const lookAndFeelActive = location.pathname === '/lessons/customize-look-and-feel';
  const activePath = lookAndFeelActive
    ? '/explore'
    : location.pathname.startsWith('/lessons') || location.pathname.startsWith('/exercises')
      ? '/'
      : location.pathname.startsWith('/resources')
        ? '/explore'
        : location.pathname.startsWith('/connectors')
          ? '/explore'
          : location.pathname.startsWith('/skills')
            ? '/explore'
        : location.pathname;

  return (
    <nav id="workshop-navigation" aria-label="Workshop navigation" className={`app-sidebar ${navOpen ? 'open' : ''}`}>
      <Link className="sidebar-brand" to="/" onClick={onNavigate}>
        <span className="brand-mark">CF</span>
        <span><strong>Cloudflare OS</strong><small>MCP Blueprint Workshop</small></span>
      </Link>

      <div className="sidebar-group">
        <p className="sidebar-label">Navigate</p>
        <ul className="sidebar-list primary-navigation">
          {primaryNavigation.map((item) => {
            const active = item.path === '/' ? activePath === '/' : activePath.startsWith(item.path);
            const current = active && !lookAndFeelActive;
            return (
              <li key={item.path}>
                <Link aria-current={current ? 'page' : undefined} className={`sidebar-link ${active ? 'active' : ''}`} to={item.path} onClick={onNavigate}>
                  <span className="nav-glyph" aria-hidden="true">{item.label.slice(0, 1)}</span>
                  <span>{item.label}</span>
                </Link>
                {item.path === '/explore' ? <Link aria-current={lookAndFeelActive ? 'page' : undefined} className={`sidebar-sublink ${lookAndFeelActive ? 'active' : ''}`} to="/lessons/customize-look-and-feel" onClick={onNavigate}>Look &amp; Feel</Link> : null}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="sidebar-group bordered">
        <p className="sidebar-label">Favorites</p>
      </div>

      <div className="sidebar-group bordered">
        <p className="sidebar-label">Recent workspaces</p>
        <div className="recent-workspaces">
          {workspaces.length > 0 ? workspaces.slice(0, 3).map((workspace) => (
            <Link to={`/workspaces/${workspace.id}`} onClick={onNavigate} key={workspace.id}>{workspace.name}</Link>
          )) : (
            <p className="recent-empty">Created Workspace records appear here.</p>
          )}
        </div>
      </div>
    </nav>
  );
}

function TopBar({ navOpen, onToggleNav, resetWorkshopData }) {
  const [resetError, setResetError] = useState('');

  function resetWorkshop() {
    if (!window.confirm('Reset all workshop data in this browser? Workspaces, report drafts, workflow checklists, and progress will be deleted.')) return;
    setResetError(resetWorkshopData() ? '' : 'This browser could not reset all workshop data. Check browser storage access and try again.');
  }

  return (
    <header className="top-bar">
      <button className={`nav-toggle ${navOpen ? 'active' : ''}`} onClick={onToggleNav} aria-label="Menu" aria-expanded={navOpen} aria-controls="workshop-navigation">
        <span />
        <span />
        <span />
      </button>
      <p className="topbar-context">MCP Blueprint Workshop <span>Customer edition</span></p>
      <button className="workshop-reset" type="button" onClick={resetWorkshop} disabled={navOpen}>Reset workshop data</button>
      {resetError ? <p className="topbar-error" role="alert">{resetError}</p> : null}
    </header>
  );
}

function RouteEffects() {
  const location = useLocation();

  useEffect(() => {
    const routeLabel = location.pathname.split('/').filter(Boolean)[0] || 'Home';
    const reportDetail = /^\/outputs\/(?!new$|templates\/)[^/]+$/.test(location.pathname);
    if (!reportDetail) document.title = `${routeLabel.charAt(0).toUpperCase()}${routeLabel.slice(1)} | Cloudflare OS`;
    window.requestAnimationFrame(() => {
      const heading = document.querySelector('.route-view h1');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus();
      }
    });
  }, [location.pathname]);

  return null;
}

function Home({ locale, lessonProgress, exerciseProgress, totalCompleted, totalRequired, nextRecommended }) {
  const copy = shellCopy[locale];
  const allComplete = totalCompleted >= totalRequired;
  const startTarget = allComplete ? '/resources/start-to-finish-runbook' : nextRecommended ? getEntryPath(nextRecommended.type, nextRecommended.slug) : getEntryPath('lesson', lessons[0].slug);

  return (
    <main>
      <section className="hero school-hero landing-hero">
        <div className="hero-layout single-column">
          <div className="hero-main">
            <p className="eyebrow">{copy.studentId}</p>
            <h1>
              <span>{copy.heroTitleTop}</span><br />
              {copy.heroTitleBottom}
            </h1>
            <p className="hero-copy">{copy.hero}</p>
            <p className="hero-support">{copy.heroSupport}</p>
        <div className="hero-actions">
          <Link className="button primary" to={startTarget}>{allComplete ? 'Review completed workshop' : totalCompleted === 0 ? copy.start : nextRecommended?.action || copy.resumeWhereYouLeftOff} <span>→</span></Link>
          <Link className="button secondary" to="/explore">Explore</Link>
            </div>
          </div>
        </div>
        <p className="landing-hint">{copy.courseProgress}: {totalCompleted}/{totalRequired}. {copy.browseHint}</p>
      </section>

      <WorkshopJourney lessonProgress={lessonProgress} exerciseProgress={exerciseProgress} />
      <NavigationGuide />

      <SectionSummary
        type="lesson"
        locale={locale}
        progress={lessonProgress}
        heading="Detailed workshop steps"
        intro="Use these ten lessons in numeric order. Each lesson explains the controls, the action, and the evidence required before continuing."
        collection={lessons}
      />
      <SectionSummary
        type="exercise"
        locale={locale}
        progress={exerciseProgress}
        heading="Validation checkpoints"
        intro="The main Resume action interleaves these short exercises whenever a stage needs proof."
        collection={exercises}
        variant="dark"
      />
      <SectionSummary
        type="resource"
        locale={locale}
        progress={[]}
        heading="Explore"
        intro="Open practical references, operating guidance, and workshop support material."
        collection={resources}
      />
    </main>
  );
}

function WorkshopJourney({ lessonProgress, exerciseProgress }) {
  return (
    <section className="journey-section" aria-labelledby="journey-heading">
      <div className="journey-heading">
        <p className="eyebrow">Start here</p>
        <h2 id="journey-heading">One path. Six stages. No guessing.</h2>
        <p>Complete each stage from left to right. The result shown on each card is the evidence you need before moving on.</p>
      </div>
      <div className="journey-grid">
        {workshopJourney.map((stage) => {
          const done = stage.required.every((item) => (item.type === 'lesson' ? lessonProgress : exerciseProgress).includes(item.slug));
          return (
            <article className={`journey-card ${done ? 'done' : ''}`} key={stage.number}>
              <div className="journey-card-top"><span>{stage.number}</span><strong>{done ? 'Complete' : 'Required'}</strong></div>
              <h3>{stage.title}</h3>
              <p>{stage.summary}</p>
              <div className="journey-result"><span>Stage result</span><strong>{stage.result}</strong></div>
              <Link className="text-button compact" to={stage.path}>{done ? 'Review stage' : stage.action} →</Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function NavigationGuide() {
  return (
    <section className="navigation-guide" aria-labelledby="navigation-guide-heading">
      <div><p className="eyebrow">Navigation key</p><h2 id="navigation-guide-heading">What every navigation item opens</h2><p>These destinations organize the workshop. They do not grant access, run a tool, or approve an output by themselves.</p></div>
      <dl>{navigationGuide.map((item) => <div key={item.control}><dt>{item.control}</dt><dd>{item.purpose}</dd></div>)}</dl>
    </section>
  );
}

function HubPage({ page, children }) {
  return (
    <main className="hub-page">
      <section className="hub-hero">
        <p className="eyebrow">{page.eyebrow}</p>
        <h1>{page.title}</h1>
        <p>{page.intro}</p>
      </section>
      <section className="hub-grid" aria-label={`${page.title} catalog`}>
        {page.items.map((item) => {
          const content = (
            <>
              <span className="hub-card-label">{item.label}</span>
              <h2>{item.title}</h2>
              <p>{item.body}</p>
              {item.path || item.href ? <span className="hub-card-action">{item.action || 'Open details'} <span aria-hidden="true">→</span></span> : <span className="hub-card-action muted">{item.status || 'Catalog preview'}</span>}
            </>
          );

          if (item.path) return <Link className="hub-card" to={item.path} key={item.title}>{content}</Link>;
          if (item.href) return <a className="hub-card" href={item.href} target="_blank" rel="noreferrer" key={item.title}>{content}</a>;
          return <article className="hub-card" key={item.title}>{content}</article>;
        })}
      </section>
      {children}
    </main>
  );
}

function WorkspaceLibrary({ workspaces }) {
  return (
    <section className="workspace-library">
      <div className="workspace-library-heading"><div><p className="eyebrow">Browser-local records</p><h2>Your workshop workspaces</h2></div><Link className="button primary compact" to="/blueprints">Start from a Blueprint →</Link></div>
      {workspaces.length > 0 ? <div className="workspace-library-grid">{workspaces.map((workspace) => {
        const blueprint = getBlueprint(workspace.blueprintSlug);
         return <Link className="workspace-library-card" to={`/workspaces/${workspace.id}`} key={workspace.id}><span>{workspace.status || 'Checklist created'}</span><h3>{workspace.name}</h3><p>{blueprint?.title || 'Blueprint unavailable'}</p><small>{workspace.owner} · Expires {new Date(getWorkspaceExpiration(workspace)).toLocaleString('en-US')}</small></Link>;
      })}</div> : <div className="workspace-library-empty"><p>No local Blueprint checklists yet.</p><span>Select a Blueprint to save a browser-local setup checklist for owner, audience, and scope.</span></div>}
    </section>
  );
}

function BlueprintCatalog() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const categories = ['All', ...new Set(blueprints.map((blueprint) => blueprint.category))];
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = blueprints.filter((blueprint) => {
    const matchesCategory = category === 'All' || blueprint.category === category;
    const matchesQuery = !normalizedQuery || `${blueprint.title} ${blueprint.summary} ${blueprint.decision} ${blueprint.outcome}`.toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });

  return (
    <main className="blueprint-page">
      <section className="blueprint-hero">
        <div>
          <p className="eyebrow">Installable operating models</p>
          <h1>Blueprint Catalog</h1>
          <p>Choose a governed package of inputs, read-only MCP connections, evidence requirements, and a decision-ready PDF outcome.</p>
        </div>
        <div className="blueprint-count"><strong>{blueprints.length}</strong><span>Blueprints in catalog</span></div>
      </section>

      <section className="catalog-controls" aria-label="Blueprint filters">
        <label className="catalog-search">
          <span>Search Blueprints</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by decision or outcome" type="search" />
        </label>
        <div className="filter-row">
          {categories.map((item) => <button type="button" aria-pressed={category === item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)} key={item}>{item}</button>)}
        </div>
      </section>

      <section className="blueprint-grid" aria-live="polite">
        {filtered.map((blueprint, index) => (
          <Link className="blueprint-card" to={`/blueprints/${blueprint.slug}`} key={blueprint.slug}>
            <div className="blueprint-card-top">
              <span className="blueprint-index">{String(index + 1).padStart(2, '0')}</span>
              <span className="status-pill">{blueprint.maturity}</span>
            </div>
            <p className="blueprint-category">{blueprint.category}</p>
            <h2>{blueprint.title}</h2>
            <p>{blueprint.summary}</p>
            <div className="blueprint-card-footer"><span>{blueprint.connections.length} MCP sources</span><span>{blueprint.duration}</span><strong>View Blueprint →</strong></div>
          </Link>
        ))}
        {filtered.length === 0 ? <div className="catalog-empty"><h2>No matching Blueprints</h2><p>Clear the search or select another category.</p></div> : null}
      </section>

      <section className="catalog-skills-callout">
        <div><p className="eyebrow">Reusable capability layer</p><h2>Blueprints are powered by Super Skills.</h2></div>
        <Link className="button primary compact" to="/skills">Explore Super Skills →</Link>
      </section>
    </main>
  );
}

function BlueprintDetail() {
  const { slug } = useParams();
  const blueprint = getBlueprint(slug);

  if (!blueprint) return <Navigate to="/blueprints" replace />;

  return (
    <main className="blueprint-detail">
      <aside className="blueprint-detail-aside">
        <Link className="back-link" to="/blueprints">← Blueprint Catalog</Link>
        <p className="blueprint-category">{blueprint.category}</p>
        <div className="blueprint-detail-meta"><p><strong>Status</strong><span>{blueprint.maturity}</span></p><p><strong>Workshop time</strong><span>{blueprint.duration}</span></p><p><strong>Cloudflare sources</strong><span>{blueprint.connections.length}</span></p><p><strong>Optional test connectors</strong><span>{blueprint.connectorSlugs.length}</span></p></div>
        {blueprint.archive ? <a className="button primary" href={blueprint.archive.publicUrl} target="_blank" rel="noreferrer">Download .gadget package →</a> : null}
        <p className="aside-note">Use this page to download the package, open Blueprints in Cloudflare OS, upload the .gadget file, reconnect the required MCP sources, and validate one harmless read.</p>
      </aside>

      <article className="blueprint-detail-content">
        <header className="blueprint-detail-hero"><p className="eyebrow">MCP Blueprint</p><h1>{blueprint.title}</h1><p>{blueprint.summary}</p></header>
        <section className="decision-panel"><span>Decision this Blueprint supports</span><p>{blueprint.decision}</p></section>
        <BlueprintListSection title="Step-by-step installation" items={blueprint.installSteps} />
        <BlueprintInstallPromptSection prompt={blueprint.installPrompt} />
        <BlueprintListSection title="Required inputs" items={blueprint.inputs} />
        <section className="blueprint-section"><p className="section-label">MCP connection plan</p><div className="connection-list">{blueprint.connections.map((connection) => <div className="connection-card" key={connection.binding}><div><h3>{connection.name}</h3><p>{connection.purpose}</p><p><strong>Binding:</strong> <code>{connection.binding}</code></p><p><strong>Endpoint:</strong> <code>{connection.endpoint}</code></p></div><span>{connection.access}</span></div>)}</div></section>
        {blueprint.archive
          ? <section className="blueprint-section"><p className="section-label">Published Blueprint package</p><div className="decision-panel"><span>Archive</span><p><code>{blueprint.archive.file}</code></p><span>Blueprint ID</span><p><code>{blueprint.archive.id}</code></p><a href={blueprint.archive.publicUrl} target="_blank" rel="noreferrer">Download published Blueprint package →</a></div></section>
          : <section className="blueprint-section"><p className="section-label">Published Blueprint package</p><div className="decision-panel"><span>Package status</span><p>Archive not published yet.</p><span>Blueprint ID</span><p>Assigned at publication time.</p></div></section>}
        <ConnectorLinksSection blueprint={blueprint} />
        <SkillLinks blueprint={blueprint} />
        <BlueprintListSection title="Evidence requirements" items={blueprint.evidence} />
        <section className="blueprint-section report-preview"><div><p className="section-label">PDF outcome</p><h2>{blueprint.outcome}</h2></div><ol>{blueprint.reportSections.map((section) => <li key={section}>{section}</li>)}</ol></section>
        <BlueprintListSection title="Non-negotiable guardrails" items={blueprint.guardrails} guardrails />
      </article>
    </main>
  );
}

function BlueprintInstallPromptSection({ prompt }) {
  return (
    <section className="blueprint-section">
      <p className="section-label">Copyable install prompt</p>
      <PromptBox locale="en" prompt={prompt} />
    </section>
  );
}

function BlueprintListSection({ title, items, guardrails = false }) {
  return <section className={`blueprint-section ${guardrails ? 'guardrail-panel' : ''}`}><p className="section-label">{title}</p><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></section>;
}

function ConnectorLinksSection({ blueprint, compact = false }) {
  const linkedConnectors = getBlueprintConnectors(blueprint);

  if (linkedConnectors.length === 0) return null;

  return (
    <section className={compact ? 'workspace-connectors' : 'blueprint-section'}>
      <p className="section-label">Optional Corporate Test Connectors</p>
      {!compact ? <p className="connector-links-intro">Use these only for isolated workshop scenarios. They supplement, and do not replace, the required Cloudflare evidence sources above.</p> : null}
      <div className="connector-links">{linkedConnectors.map((connector) => <Link to={`/connectors/${connector.slug}`} key={connector.slug}><span>{connector.system}</span><strong>{connector.brand}</strong><small>{blueprint.connectorPurposes?.[connector.slug] || connector.scope}</small></Link>)}</div>
    </section>
  );
}

function WorkspaceCreate({ createWorkspace }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const blueprint = getBlueprint(searchParams.get('blueprint'));
  const [name, setName] = useState(blueprint ? `${blueprint.title.replace(' Report', '')} Workspace` : '');
  const [owner, setOwner] = useState('');
  const [audience, setAudience] = useState('Security leadership');
  const [formError, setFormError] = useState('');

  if (!blueprint) return <Navigate to="/blueprints" replace />;

  function handleSubmit(event) {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanOwner = owner.trim();
    if (!cleanName || !cleanOwner) {
      setFormError('Enter a workspace name and accountable owner.');
      return;
    }
    const id = `${blueprint.slug}-${Date.now()}`;
    const saved = createWorkspace({ id, name: cleanName, owner: cleanOwner, audience, blueprintSlug: blueprint.slug, createdAt: new Date().toISOString(), status: 'Checklist created' });
    if (!saved) {
      setFormError('This browser could not save the workspace. Check local storage access and try again.');
      return;
    }
    navigate(`/workspaces/${id}`);
  }

  return (
    <main className="workspace-create-page">
      <section className="workspace-create-copy"><Link className="back-link" to={`/blueprints/${blueprint.slug}`}>← {blueprint.title}</Link><p className="eyebrow">Optional local checklist</p><h1>Track owner, audience, and scope before connecting data.</h1><p>This is only a browser-local setup checklist. It helps the facilitator remember who owns the run, who the report is for, and what boundary was approved. It does not upload the Blueprint, authorize MCP access, or make account changes.</p><div className="selected-blueprint"><span>Selected Blueprint</span><strong>{blueprint.title}</strong><p>{blueprint.outcome}</p></div></section>
      <form className="workspace-form" onSubmit={handleSubmit}>
        <div><p className="eyebrow">Local setup checklist</p><h2>Name this Blueprint run</h2></div>
        <label>Checklist name<input required maxLength="80" value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label>Accountable owner<input required maxLength="80" value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="Name or role" /></label>
        <label>Report audience<select value={audience} onChange={(event) => setAudience(event.target.value)}><option>Security leadership</option><option>Executive leadership</option><option>Technical operations</option><option>Governance committee</option></select></label>
        <div className="form-boundary"><strong>Default boundary</strong><span>Read-only MCP access</span><span>Human-reviewed findings</span><span>No account changes</span></div>
        {formError ? <p className="form-error" role="alert">{formError}</p> : null}
        <button className="button primary" type="submit">Save local setup checklist →</button>
      </form>
    </main>
  );
}

function WorkspaceDetail({ workspaces, reports, deleteWorkspace }) {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [deleteError, setDeleteError] = useState('');
  const workspace = workspaces.find((item) => item.id === workspaceId);
  const blueprint = workspace ? getBlueprint(workspace.blueprintSlug) : null;
  const workspaceReport = reports.find((report) => report.workspaceId === workspaceId);

  if (!workspace || !blueprint) return <Navigate to="/workspaces" replace />;

  function removeWorkspace() {
    if (!window.confirm('Delete this Workspace, its session report drafts, and its workflow checklist? This cannot be undone.')) return;
    if (deleteWorkspace(workspace.id)) navigate('/workspaces');
    else setDeleteError('This browser could not delete the complete Workspace record. Check browser storage access and try again.');
  }

  return (
    <main className="workspace-record-page">
      <header className="workspace-record-hero"><div><p className="eyebrow">Workspace record</p><h1>{workspace.name}</h1><p>{blueprint.summary}</p><small className="workspace-expiry">Browser-local record expires {new Date(getWorkspaceExpiration(workspace)).toLocaleString('en-US')}.</small></div><span className="status-pill">{workspace.status}</span></header>
      <section className="workspace-record-grid">
        <div className="workspace-record-main"><p className="section-label">Preparation sequence</p><ol><li className="complete">Blueprint selected: {blueprint.title}</li><li className="complete">Owner assigned: {workspace.owner}</li><li className="complete">Audience defined: {workspace.audience}</li><li>Confirm account and data scope</li><li>Authorize minimum read-only MCP connections</li><li>Run one harmless retrieval per source</li></ol><div className="workspace-record-actions"><Link className="button primary" to="/lessons/workshop-setup">Define scope and connections →</Link><Link className="text-button" to={blueprint.nextPath}>Preview Blueprint run</Link><Link className="text-button" to={`/blueprints/${blueprint.slug}`}>Review Blueprint</Link></div></div>
        <aside className="workspace-record-aside"><p className="section-label">Operating boundary</p>{blueprint.guardrails.map((item) => <p key={item}>{item}</p>)}<Link to="/lessons/mcp-servers">Review connection guidance →</Link><ConnectorLinksSection blueprint={blueprint} compact /><SkillLinks blueprint={blueprint} compact /></aside>
      </section>
      <SkillWorkflow key={workspace.id} workspace={workspace} blueprint={blueprint} report={workspaceReport} />
      <WorkspaceReports workspace={workspace} reports={reports} />
      <section className="workspace-danger-zone"><div><p className="section-label">Local data lifecycle</p><h2>Remove this workshop record</h2><p>Deletes this Workspace, its report drafts in the current session, and its workflow checklist from this browser.</p></div><button className="text-button compact" type="button" onClick={removeWorkspace}>Delete Workspace</button>{deleteError ? <p className="form-error" role="alert">{deleteError}</p> : null}</section>
    </main>
  );
}

function ConnectorCatalog() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const categories = ['All', ...new Set(connectors.map((connector) => connector.category))];
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = connectors.filter((connector) => {
    const matchesCategory = category === 'All' || connector.category === category;
    const matchesQuery = !normalizedQuery || `${connector.brand} ${connector.system} ${connector.summary} ${connector.evidence.join(' ')}`.toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });

  return (
    <main className="connector-page">
      <section className="connector-hero"><div><p className="eyebrow">Corporate Test Connector Pack</p><h1>Connect evidence, not entire systems.</h1><p>Use identity-bound, least-privilege contracts for CRM, HR, collaboration, wiki, and identity evidence.</p></div><div className="connector-boundary"><span>Default boundary</span><strong>Read-only</strong><p>No request is sent during catalog preflight.</p></div></section>
      <section className="catalog-controls" aria-label="Connector filters"><label className="catalog-search"><span>Search connectors</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by system or evidence" type="search" /></label><div className="filter-row">{categories.map((item) => <button type="button" aria-pressed={category === item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div></section>
      <section className="connector-grid" aria-live="polite">{filtered.map((connector) => <Link className="connector-card" to={`/connectors/${connector.slug}`} key={connector.slug}><div className="connector-card-head"><span>{connector.category}</span><small>{connector.protocol}</small></div><p className="connector-system">{connector.system}</p><h2>{connector.brand}</h2><p>{connector.summary}</p><div className="connector-card-meta"><span>{connector.readOnlyTools.length} safe capabilities</span><span>{connector.scope}</span><strong>Inspect contract →</strong></div></Link>)}{filtered.length === 0 ? <div className="catalog-empty"><h2>No matching connectors</h2><p>Clear the search or select another category.</p></div> : null}</section>
    </main>
  );
}

function ConnectorDetail() {
  const { slug } = useParams();
  const connector = getConnector(slug);

  if (!connector) return <Navigate to="/connectors" replace />;

  return (
    <main className="blueprint-detail connector-detail">
      <aside className="blueprint-detail-aside"><Link className="back-link" to="/connectors">← Connector Catalog</Link><p className="blueprint-category">{connector.category}</p><div className="blueprint-detail-meta"><p><strong>System</strong><span>{connector.system}</span></p><p><strong>Protocol</strong><span>{connector.protocol}</span></p><p><strong>Scope</strong><span>{connector.scope}</span></p><p><strong>Owner</strong><span>{connector.owner}</span></p></div><p className="aside-note">Contract verified against the sample application source. Authorization remains a separate user action.</p></aside>
      <article className="blueprint-detail-content"><header className="blueprint-detail-hero connector-detail-hero"><p className="eyebrow">{connector.system} test connector</p><h1>{connector.brand}</h1><p>{connector.summary}</p></header><section className="decision-panel"><span>Evidence boundary</span><p>{connector.evidence.join('. ')}.</p></section><BlueprintListSection title="Read-only evidence" items={connector.evidence} /><ToolContract connector={connector} /><SafePreflight connector={connector} /></article>
    </main>
  );
}

function ToolContract({ connector }) {
  return (
    <section className="blueprint-section tool-contract"><div><p className="section-label">Allowed capabilities</p><div className="tool-chip-list">{connector.readOnlyTools.map((tool) => <code key={tool}>{tool}</code>)}</div></div><div className="blocked-contract"><p className="section-label">Excluded from this workshop</p>{connector.blockedTools.length > 0 ? <div className="tool-chip-list blocked">{connector.blockedTools.map((tool) => <code key={tool}>{tool}</code>)}</div> : <p>No write tool is registered by this connector.</p>}</div></section>
  );
}

function SafePreflight({ connector }) {
  const [endpoint, setEndpoint] = useState('');
  const [result, setResult] = useState(null);

  function handlePreflight(event) {
    event.preventDefault();
    const checks = [];
    try {
      const url = new URL(endpoint.trim());
      checks.push({ label: 'HTTPS endpoint', passed: url.protocol === 'https:' });
      checks.push({ label: 'No embedded credentials', passed: !url.username && !url.password });
      checks.push({ label: 'Standard HTTPS port', passed: !url.port });
      checks.push({ label: 'Exact approved workshop origin', passed: connector.allowedOrigins.includes(url.origin.toLowerCase()) });
      checks.push({ label: `Expected path ${connector.endpointPath}`, passed: url.pathname.replace(/\/$/, '') === connector.endpointPath.replace(/\/$/, '') });
      checks.push({ label: 'No query parameters or fragments', passed: !url.search && !url.hash });
    } catch {
      checks.push({ label: 'Valid absolute URL', passed: false });
    }
    checks.push({ label: 'Read-only scope contract', passed: connector.protocol === 'OpenID Connect' || connector.scope.endsWith(':read') });
    checks.push({ label: `Harmless validation action: ${connector.validationAction}`, passed: true });
    checks.push({ label: 'Write capabilities excluded', passed: connector.blockedTools.every((tool) => !connector.readOnlyTools.includes(tool)) });
    setResult({ checks, passed: checks.every((check) => check.passed) });
  }

  return (
    <section className="safe-preflight"><div><p className="section-label">Safe connection preflight</p><h2>Check catalog configuration before authorization.</h2><p>This local format check does not contact the endpoint, verify its live identity, start OAuth, or store a credential.</p></div><form onSubmit={handlePreflight}><label>Validation endpoint<input required type="url" value={endpoint} onChange={(event) => { setEndpoint(event.target.value); setResult(null); }} placeholder={`${connector.allowedOrigins[0]}${connector.endpointPath}`} /></label><button className="button primary" type="submit">Check catalog URL</button></form>{result ? <div className={`preflight-result ${result.passed ? 'passed' : 'failed'}`} role="status"><strong>{result.passed ? 'Approved catalog URL format' : 'Configuration needs attention'}</strong>{result.checks.map((check) => <p key={check.label}><span>{check.passed ? 'PASS' : 'FIX'}</span>{check.label}</p>)}{result.passed ? <small>A facilitator must verify the live endpoint before authorization. First authorized action: {connector.validationAction}. Expected: {connector.expectedResult}</small> : null}</div> : null}</section>
  );
}

function SectionPage({ type, locale, lessonProgress, exerciseProgress }) {
  const copy = shellCopy[locale];
  const collection = type === 'lesson' ? lessons : type === 'exercise' ? exercises : resources;
  const progress = type === 'lesson' ? lessonProgress : type === 'exercise' ? exerciseProgress : [];
  const heading = type === 'lesson' ? copy.lessons : type === 'exercise' ? copy.exercises : copy.resources;
  const intro = type === 'lesson' ? copy.lessonsIntro : type === 'exercise' ? copy.exercisesIntro : copy.aboutIntro;
  const note = type === 'resource' ? copy.optionalGuides : null;

  return (
    <main>
      <section className="school-section">
        <div className="school-section-inner">
          <div className="school-heading">
            <p className="eyebrow">{getPageTypeLabel(type, copy)}</p>
            <h1>{heading}</h1>
            <p>{intro}</p>
            {note ? <p className="section-note">{note}</p> : null}
          </div>
          <SectionRows type={type} locale={locale} progress={progress} collection={collection} />
        </div>
      </section>
    </main>
  );
}

function SectionSummary({ type, locale, progress, heading, intro, collection, note, variant = '' }) {
  return (
    <section className={`school-section ${variant}`}>
      <div className="school-section-inner">
        <div className="school-heading">
          <h2>{heading}</h2>
          <p>{intro}</p>
          {note ? <p className="section-note">{note}</p> : null}
        </div>
        <SectionRows type={type} locale={locale} progress={progress} collection={collection} />
      </div>
    </section>
  );
}

function SectionRows({ type, locale, progress, collection }) {
  const copy = shellCopy[locale];

  return (
    <div className={`school-list ${type === 'resource' ? 'resource-row' : ''}`}>
      {collection.map((entry, index) => {
        const done = progress.includes(entry.slug);
        const title = getEntryTitle(entry, locale);
        const summary = translateVisibleText(entry.content[locale].summary, locale);
        const href = getEntryPath(type, entry.slug);
        const prefix = entry.number || String(index + 1).padStart(2, '0');
        const duration = formatDuration(entry, copy);

        return (
          <div className={`school-row ${done ? 'done' : ''}`} key={entry.slug}>
            <div className="school-row-prefix">{prefix}</div>
            <div className="school-row-main">
              <Link className="school-row-link" to={href}><h3>{title}</h3></Link>
              <p>{summary}</p>
            </div>
            <div className="school-row-actions">
              {duration ? <span>{duration}</span> : null}
              <Link className="text-button compact" to={href}>{done ? `Review ${title}` : workshopSequence.find((item) => item.type === type && item.slug === entry.slug)?.action || `Open ${title}`}</Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EntryPage(props) {
  const { slug } = useParams();
  const { locale, lessonProgress, exerciseProgress, toggleLesson, toggleExercise } = props;
  const copy = shellCopy[locale];
  const collection = props.type === 'lesson' ? lessons : props.type === 'exercise' ? exercises : resources;
  const entry = collection.find((item) => item.slug === slug);
  const progress = props.type === 'lesson' ? lessonProgress : props.type === 'exercise' ? exerciseProgress : [];
  const toggle = props.type === 'lesson' ? toggleLesson : toggleExercise;

  if (!entry) return <Navigate to="/" replace />;

  const content = entry.content[locale];
  const completed = progress.includes(slug);
  const sequencedEntries = workshopSequence.map((item) => {
    const source = item.type === 'lesson' ? lessons : exercises;
    return { ...source.find((candidate) => candidate.slug === item.slug), type: item.type, action: item.action, label: item.label };
  });
  const navigationEntries = props.type === 'resource' ? collection.map((item) => ({ ...item, type: 'resource' })) : sequencedEntries;
  const currentIndex = navigationEntries.findIndex((item) => item.type === props.type && item.slug === slug);
  const previous = navigationEntries[currentIndex - 1];
  const next = navigationEntries[currentIndex + 1];
  const pageTypeLabel = getPageTypeLabel(props.type, copy);
  const customization = props.type === 'lesson' && slug === 'customize-look-and-feel';
  const backLabel = props.type === 'resource' || customization ? 'Explore' : 'Workshop Home';
  const backPath = customization ? '/explore' : getSectionPath(props.type);
  const title = getEntryTitle(entry, locale);
  const duration = formatDuration(entry, copy);

  return (
    <main className="entry-layout">
      <aside className="entry-sidebar">
        <Link className="back-link" to={backPath}>← {backLabel}</Link>
        <div className="entry-meta-list">
          {entry.number ? <p><strong>{copy.sectionNumber}</strong> {entry.number}</p> : null}
          {duration ? <p><strong>{copy.sectionDuration}</strong> {duration}</p> : null}
          {props.type !== 'resource' ? <p><strong>{copy.sectionStatus}</strong> {completed ? copy.completed : copy.workshopMode}</p> : null}
        </div>
        <div className="entry-nav-links">
          {previous ? <Link className="text-button compact" to={getEntryPath(previous.type, previous.slug)}>Previous: {previous.label || getEntryTitle(previous, locale)}</Link> : null}
          {next ? <Link className="text-button compact" to={getEntryPath(next.type, next.slug)}>Next: {next.label || getEntryTitle(next, locale)}</Link> : null}
        </div>
      </aside>

      <article className="entry-content">
        <p className="eyebrow">{pageTypeLabel}</p>
        <h1>{title}</h1>
        <p className="lead">{renderInlineText(content.summary, locale)}</p>

        {'objective' in content ? <section className="content-section"><h2>{copy.objective}</h2><p>{renderInlineText(content.objective, locale)}</p></section> : null}

        {'purpose' in content ? <section className="content-section"><h2>{copy.purposeLabel}</h2><p>{translateVisibleText(content.purpose, locale)}</p></section> : null}

        {'howToUse' in content ? <section className="content-section"><h2>{copy.howToUseLabel}</h2><p>{translateVisibleText(content.howToUse, locale)}</p></section> : null}

        {'benefit' in content ? <section className="content-section"><h2>{copy.benefitLabel}</h2><p>{translateVisibleText(content.benefit, locale)}</p></section> : null}

        {'prerequisites' in content ? <PrerequisitesSection title={copy.prerequisites} items={content.prerequisites} locale={locale} /> : null}

        {'elements' in content ? <ElementsSection items={content.elements} copy={copy} locale={locale} /> : null}

        {'reference' in content ? <ReferenceSection title={copy.reference} items={content.reference} locale={locale} /> : null}

        {controlGuides[entry.slug] ? <ControlGuideSection title={copy.controlsLabel} items={controlGuides[entry.slug]} /> : null}

        {'steps' in content ? <section className="content-section"><h2>{copy.steps}</h2><ol>{content.steps.map((step) => <li key={step}>{renderInlineText(step, locale)}</li>)}</ol></section> : null}

        {'advancedPath' in content ? <AdvancedPathSection title={copy.advancedLabel} data={content.advancedPath} locale={locale} /> : null}

        {'commands' in content ? <CommandsSection title={copy.commandsLabel} copyLabel={copy.copy} copiedLabel={copy.copied} items={content.commands} locale={locale} /> : null}

        {'body' in content ? <section className="content-section">{content.body.map((paragraph) => <p key={paragraph}>{translateVisibleText(paragraph, locale)}</p>)}</section> : null}

        {'prompt' in content ? <PromptBox locale={locale} prompt={translateVisibleText(content.prompt, locale)} /> : null}

        {'outputs' in content ? <section className="content-section"><h2>{copy.outputs}</h2><ul>{content.outputs.map((item) => <li key={item}>{translateVisibleText(item, locale)}</li>)}</ul></section> : null}

        {'troubleshooting' in content ? <TroubleshootingSection title={copy.troubleshootingLabel} causeLabel={copy.causeLabel} fixLabel={copy.fixLabel} items={content.troubleshooting} locale={locale} /> : null}

        <div className="entry-actions">
          {props.type !== 'resource' ? <button className={`complete-button ${completed ? 'done' : ''}`} aria-pressed={completed} onClick={() => toggle(slug)}>{completed ? 'Reopen this step' : 'Complete this step'}</button> : <span />}
          <div className="pager-links">
            {previous ? <Link className="text-button" to={getEntryPath(previous.type, previous.slug)}>Previous: {previous.label || getEntryTitle(previous, locale)}</Link> : null}
            {next ? <Link className="button primary compact" to={getEntryPath(next.type, next.slug)}>Next: {next.label || getEntryTitle(next, locale)}</Link> : null}
          </div>
        </div>
      </article>
    </main>
  );
}

function ControlGuideSection({ title, items }) {
  return (
    <section className="content-section control-guide">
      <h2>{title}</h2>
      <p className="control-guide-intro">Read this before clicking. A control is complete only when its expected result appears.</p>
      <div className="control-guide-list">
        {items.map((item) => (
          <article key={item.control}>
            <h3>{item.control}</h3>
            <p><strong>Use it to:</strong> {item.purpose}</p>
            <p><strong>Expected result:</strong> {item.result}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function PromptBox({ locale, prompt }) {
  const copy = shellCopy[locale];
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <section className="prompt-box">
      <div>
        <p className="card-kicker">{copy.prompt}</p>
        <p>{prompt}</p>
      </div>
      <button onClick={handleCopy}>{copied ? copy.copied : copy.copy}</button>
    </section>
  );
}

function ReferenceSection({ title, items, locale }) {
  return (
    <section className="content-section">
      <h2>{title}</h2>
      <div className="reference-list">
        {items.map((item) => (
          <div className="reference-card" key={item}>
            <p>{renderInlineText(item, locale)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PrerequisitesSection({ title, items, locale }) {
  return (
    <section className="content-section">
      <h2>{title}</h2>
      <ul className="prereq-list">
        {items.map((item) => (
          <li key={item.text}>
            <span>{translateVisibleText(item.text, locale)}</span>
            {item.url ? <a href={item.url} target="_blank" rel="noreferrer">{item.url.replace('https://', '')}</a> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function CommandsSection({ title, copyLabel, copiedLabel, items, locale }) {
  return (
    <section className="content-section">
      <h2>{title}</h2>
      <div className="command-list">
        {items.map((item) => (
          <CommandBlock key={item.title} title={translateVisibleText(item.title, locale)} code={item.code} copyLabel={copyLabel} copiedLabel={copiedLabel} />
        ))}
      </div>
    </section>
  );
}

function CommandBlock({ title, code, copyLabel, copiedLabel }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="command-block">
      <div className="command-block-head">
        <p>{title}</p>
        <button onClick={handleCopy}>{copied ? copiedLabel : copyLabel}</button>
      </div>
      <pre><code>{code}</code></pre>
    </div>
  );
}

function ElementsSection({ items, copy, locale }) {
  return (
    <section className="content-section elements-section">
      {items.map((item, index) => (
        <div className="element-card" key={item.name}>
          <div className="element-index">{String(index + 1).padStart(2, '0')}</div>
          <div>
            <h3>{translateVisibleText(item.name, locale)}</h3>
            <p>{translateVisibleText(item.description, locale)}</p>
            {'purpose' in item ? <p className="element-meta"><strong>{copy.purposeLabel}:</strong> {translateVisibleText(item.purpose, locale)}</p> : null}
            {'howToUse' in item ? <p className="element-meta"><strong>{copy.howToUseLabel}:</strong> {translateVisibleText(item.howToUse, locale)}</p> : null}
            {'benefit' in item ? <p className="element-meta"><strong>{copy.benefitLabel}:</strong> {translateVisibleText(item.benefit, locale)}</p> : null}
          </div>
        </div>
      ))}
    </section>
  );
}

function AdvancedPathSection({ title, data, locale }) {
  return (
    <section className="content-section">
      <h2>{title}</h2>
      <div className="advanced-callout">
        <p>{translateVisibleText(data.intro, locale)}</p>
        <ol>
          {data.steps.map((step) => <li key={step}>{translateVisibleText(step, locale)}</li>)}
        </ol>
      </div>
    </section>
  );
}

function TroubleshootingSection({ title, causeLabel, fixLabel, items, locale }) {
  return (
    <section className="content-section">
      <h2>{title}</h2>
      <div className="trouble-list">
        {items.map((item) => (
          <div className="trouble-card" key={item.issue}>
            <p className="trouble-issue">{renderInlineText(item.issue, locale)}</p>
            <p><strong>{causeLabel}:</strong> {renderInlineText(item.cause, locale)}</p>
            <p><strong>{fixLabel}:</strong> {renderInlineText(item.fix, locale)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
