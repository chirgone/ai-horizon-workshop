import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { exercises, languageOptions, lessons, resources, shellCopy } from './content';

const SETTINGS_KEY = 'ai-horizon-school-settings';
const routePrefixes = {
  lesson: 'lessons',
  exercise: 'exercises',
  resource: 'resources',
};

const visibleTextReplacements = {
  en: {
    'Super Seal': 'Cloudflare OS',
    'live workshop': 'live course',
    'workshop': 'course',
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
    'live workshop': 'curso en vivo',
    'workshops': 'cursos',
    'workshop': 'curso',
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
    'live workshop': 'curso ao vivo',
    'workshops': 'cursos',
    'workshop': 'curso',
    'demo': 'demonstracao',
  },
};

const primaryNavigation = [
  { label: 'Home', path: '/' },
  { label: 'Workspaces', path: '/workspaces' },
  { label: 'Blueprints', path: '/blueprints' },
  { label: 'Outputs', path: '/outputs' },
  { label: 'Explore', path: '/explore' },
];

const portalPages = {
  workspaces: {
    eyebrow: 'Cloudflare OS',
    title: 'Workspaces',
    intro: 'Start with a governed workspace, connect only the context it needs, and keep every customer outcome isolated and auditable.',
    items: [
      { label: 'Start here', title: 'Installation workspace', body: 'Deploy your Cloudflare OS workspace through the existing hosted installation flow.', path: '/lessons/installation' },
      { label: 'Product tour', title: 'Cloudflare OS interface', body: 'Learn how Home, Workspaces, Outputs, Skills, and shared controls fit together.', path: '/lessons/home' },
      { label: 'Connector lab', title: 'MCP server workspace', body: 'Prepare the governed tool layer used by Blueprints and corporate test connectors.', path: '/lessons/mcp-servers' },
    ],
  },
  blueprints: {
    eyebrow: 'Installable operating models',
    title: 'Blueprints',
    intro: 'Blueprints package trusted MCP sources, analysis instructions, and an executive-ready report outcome.',
    items: [
      { label: 'Recommended', title: 'Cloudflare Account Audit Report', body: 'Assess account posture, surface configuration risk, and prioritize remediation.' },
      { label: 'Recommended', title: 'Attack Surface and Risk Report', body: 'Map exposed services, risk signals, and the controls that reduce external attack paths.' },
      { label: 'Recommended', title: 'AI Governance Readiness Report', body: 'Evaluate AI usage, policy coverage, observability, and governance gaps.' },
      { label: 'Reusable capability', title: 'Super Skills', body: 'Explore reusable analysis and report-generation behaviors used by Blueprints.', path: '/lessons/skills' },
    ],
  },
  outputs: {
    eyebrow: 'Decision-ready evidence',
    title: 'Outputs',
    intro: 'Turn connected evidence into concise PDF reports with findings, severity, ownership, and a remediation roadmap.',
    items: [
      { label: 'PDF report', title: 'Security posture brief', body: 'Executive summary, prioritized findings, evidence, and recommended controls.' },
      { label: 'PDF report', title: 'Attack surface review', body: 'Exposure inventory, risk narrative, and a sequenced reduction plan.' },
      { label: 'PDF report', title: 'AI governance assessment', body: 'Governance maturity, control gaps, and an adoption-ready action plan.' },
      { label: 'Workshop exercise', title: 'Build an output', body: 'Practice converting a governed workspace into a finished artifact.', path: '/exercises/exercise-outputs' },
    ],
  },
  explore: {
    eyebrow: 'Cloudflare OS catalog',
    title: 'Explore',
    intro: 'Find installation guidance, MCP connections, reusable skills, and the workshop material behind every Blueprint.',
    items: [
      { label: 'Foundation', title: 'Installation', body: 'Deploy the workspace used throughout the workshop.', path: '/lessons/installation' },
      { label: 'Connection', title: 'MCP Servers', body: 'Understand the governed connection layer for live tools and enterprise data.', path: '/lessons/mcp-servers' },
      { label: 'Reusable capability', title: 'Super Skills', body: 'Package repeated analysis and report workflows as reusable capabilities.', path: '/lessons/skills' },
      { label: 'Documentation', title: 'Cloudflare Docs MCP', body: 'Review the official catalog, then connect the read-only endpoint at docs.mcp.cloudflare.com/mcp.', href: 'https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/' },
    ],
  },
};

function keyFor(type, audience) {
  return `ai-horizon-school-progress-${type}-${audience}`;
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
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
  if (type === 'lesson') return '/workspaces';
  if (type === 'exercise') return '/blueprints';
  return '/explore';
}

function getEntryTitle(entry, locale) {
  return translateVisibleText(entry.content?.[locale]?.title || entry.title, locale);
}

function getPageTypeLabel(type, copy) {
  if (type === 'lesson') return 'Workspace';
  if (type === 'exercise') return 'Blueprint practice';
  return 'Explore';
}

function getNextIncomplete(collection, progress) {
  return collection.find((item) => !progress.includes(item.slug)) || null;
}

function formatDuration(entry, copy) {
  return entry.duration ? `${entry.duration} ${copy.duration}` : null;
}

export default function App() {
  const saved = readJson(SETTINGS_KEY, {});
  const [locale, setLocale] = useState(saved.locale || 'en');
  const [audience, setAudience] = useState(saved.audience || 'customer');
  const [studentName, setStudentName] = useState(saved.studentName || '');
  const [lessonProgress, setLessonProgress] = useState(() => readJson(keyFor('lessons', saved.audience || 'customer'), []));
  const [exerciseProgress, setExerciseProgress] = useState(() => readJson(keyFor('exercises', saved.audience || 'customer'), []));
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ locale, audience, studentName }));
  }, [locale, audience, studentName]);

  useEffect(() => {
    setLessonProgress(readJson(keyFor('lessons', audience), []));
    setExerciseProgress(readJson(keyFor('exercises', audience), []));
  }, [audience]);

  const totalRequired = lessons.length + exercises.length;
  const totalCompleted = lessonProgress.length + exerciseProgress.length;
  const courseCompleted = lessonProgress.length === lessons.length && exerciseProgress.length === exercises.length;
  const nextLesson = getNextIncomplete(lessons, lessonProgress);
  const nextExercise = getNextIncomplete(exercises, exerciseProgress);
  const nextRecommended = nextLesson ? { ...nextLesson, type: 'lesson' } : nextExercise ? { ...nextExercise, type: 'exercise' } : null;

  const context = {
    locale,
    setLocale,
    audience,
    setAudience,
    studentName,
    setStudentName,
    lessonProgress,
    exerciseProgress,
    courseCompleted,
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
  };

  return (
    <div className="layout-shell">
      <Sidebar
        navOpen={navOpen}
        onNavigate={() => setNavOpen(false)}
      />
      <div className="main-area">
        <TopBar {...context} navOpen={navOpen} onToggleNav={() => setNavOpen((value) => !value)} />
        <Routes>
          <Route path="/" element={<Home {...context} />} />
          <Route path="/workspaces" element={<HubPage page={portalPages.workspaces} />} />
          <Route path="/blueprints" element={<HubPage page={portalPages.blueprints} />} />
          <Route path="/outputs" element={<HubPage page={portalPages.outputs} />} />
          <Route path="/explore" element={<HubPage page={portalPages.explore} />} />
          <Route path="/lessons" element={<SectionPage type="lesson" {...context} />} />
          <Route path="/exercises" element={<SectionPage type="exercise" {...context} />} />
          <Route path="/resources" element={<SectionPage type="resource" {...context} />} />
          <Route path="/certificate" element={<CertificatePage {...context} />} />
          <Route path="/lessons/:slug" element={<EntryPage type="lesson" {...context} />} />
          <Route path="/exercises/:slug" element={<EntryPage type="exercise" {...context} />} />
          <Route path="/resources/:slug" element={<EntryPage type="resource" {...context} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
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

function Sidebar({ navOpen, onNavigate }) {
  const location = useLocation();
  const activePath = location.pathname.startsWith('/lessons')
    ? '/workspaces'
    : location.pathname.startsWith('/exercises')
      ? '/blueprints'
      : location.pathname.startsWith('/resources')
        ? '/explore'
        : location.pathname.startsWith('/certificate')
          ? '/outputs'
          : location.pathname;

  return (
    <nav className={`app-sidebar ${navOpen ? 'open' : ''}`}>
      <Link className="sidebar-brand" to="/" onClick={onNavigate}>
        <span className="brand-mark">CF</span>
        <span><strong>Cloudflare OS</strong><small>AI Horizon Workshop</small></span>
      </Link>

      <div className="sidebar-group">
        <p className="sidebar-label">Navigate</p>
        <ul className="sidebar-list primary-navigation">
          {primaryNavigation.map((item) => {
            const active = item.path === '/' ? activePath === '/' : activePath.startsWith(item.path);
            return (
              <li key={item.path}>
                <Link className={`sidebar-link ${active ? 'active' : ''}`} to={item.path} onClick={onNavigate}>
                  <span className="nav-glyph" aria-hidden="true">{item.label.slice(0, 1)}</span>
                  <span>{item.label}</span>
                </Link>
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
          <Link to="/lessons/installation" onClick={onNavigate}>Installation workspace</Link>
          <Link to="/blueprints" onClick={onNavigate}>Account audit blueprint</Link>
          <Link to="/lessons/mcp-servers" onClick={onNavigate}>MCP connector lab</Link>
        </div>
      </div>
    </nav>
  );
}

function TopBar({ locale, setLocale, courseCompleted, navOpen, onToggleNav }) {
  const copy = shellCopy[locale];
  return (
    <header className="top-bar">
      <button className={`nav-toggle ${navOpen ? 'active' : ''}`} onClick={onToggleNav} aria-label="Menu">
        <span />
        <span />
        <span />
      </button>
      <div className="header-controls">
        {courseCompleted ? <Link className="text-button compact" to="/certificate">{copy.viewCertificate}</Link> : null}
        <label className="select-label"><span>{copy.language}</span><select value={locale} onChange={(event) => setLocale(event.target.value)}>{languageOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      </div>
    </header>
  );
}

function Home({ locale, lessonProgress, exerciseProgress, totalCompleted, totalRequired, nextRecommended, courseCompleted }) {
  const copy = shellCopy[locale];
  const startTarget = nextRecommended ? getEntryPath(nextRecommended.type, nextRecommended.slug) : getEntryPath('lesson', lessons[0].slug);

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
          <Link className="button primary" to={startTarget}>{totalCompleted === 0 ? copy.start : copy.resumeWhereYouLeftOff} <span>→</span></Link>
          <Link className="button secondary" to="/explore">Explore</Link>
              {courseCompleted ? <Link className="button secondary" to="/certificate">{copy.viewCertificate}</Link> : null}
            </div>
          </div>
        </div>
        <p className="landing-hint">{copy.courseProgress}: {totalCompleted}/{totalRequired}. {courseCompleted ? copy.certificateUnlocked : copy.browseHint}</p>
        {courseCompleted ? (
          <div className="completion-banner">
            <p className="card-kicker">{copy.certificate}</p>
            <h2>{copy.courseCompletedTitle}</h2>
            <p>{copy.certificateUnlocked}</p>
          </div>
        ) : null}
      </section>

      <SectionSummary
        type="lesson"
        locale={locale}
        progress={lessonProgress}
        heading="Workspaces"
        intro="Follow the governed path from installation to connected Cloudflare OS operations."
        collection={lessons}
      />
      <SectionSummary
        type="exercise"
        locale={locale}
        progress={exerciseProgress}
        heading="Blueprint practice"
        intro="Practice the reusable actions that turn connected context into consistent outcomes."
        collection={exercises}
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

function HubPage({ page }) {
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
              {item.path || item.href ? <span className="hub-card-action">Open <span aria-hidden="true">→</span></span> : <span className="hub-card-action muted">Catalog preview</span>}
            </>
          );

          if (item.path) return <Link className="hub-card" to={item.path} key={item.title}>{content}</Link>;
          if (item.href) return <a className="hub-card" href={item.href} target="_blank" rel="noreferrer" key={item.title}>{content}</a>;
          return <article className="hub-card" key={item.title}>{content}</article>;
        })}
      </section>
    </main>
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
            <h2>{heading}</h2>
            <p>{intro}</p>
            {note ? <p className="section-note">{note}</p> : null}
          </div>
          <SectionRows type={type} locale={locale} progress={progress} collection={collection} />
        </div>
      </section>
    </main>
  );
}

function SectionSummary({ type, locale, progress, heading, intro, collection, note }) {
  return (
    <section className="school-section">
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
              <Link className="text-button compact" to={href}>{done ? copy.completed : copy.viewAll}</Link>
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
  const currentIndex = collection.findIndex((item) => item.slug === slug);
  const previous = collection[currentIndex - 1];
  const next = collection[currentIndex + 1];
  const pageTypeLabel = getPageTypeLabel(props.type, copy);
  const backLabel = props.type === 'lesson' ? 'Workspaces' : props.type === 'exercise' ? 'Blueprints' : 'Explore';
  const backPath = getSectionPath(props.type);
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
          {previous ? <Link className="text-button compact" to={getEntryPath(props.type, previous.slug)}>← {getEntryTitle(previous, locale)}</Link> : null}
          {next ? <Link className="text-button compact" to={getEntryPath(props.type, next.slug)}>{getEntryTitle(next, locale)} →</Link> : null}
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

        {'steps' in content ? <section className="content-section"><h2>{copy.steps}</h2><ol>{content.steps.map((step) => <li key={step}>{renderInlineText(step, locale)}</li>)}</ol></section> : null}

        {'advancedPath' in content ? <AdvancedPathSection title={copy.advancedLabel} data={content.advancedPath} locale={locale} /> : null}

        {'commands' in content ? <CommandsSection title={copy.commandsLabel} copyLabel={copy.copy} copiedLabel={copy.copied} items={content.commands} locale={locale} /> : null}

        {'body' in content ? <section className="content-section">{content.body.map((paragraph) => <p key={paragraph}>{translateVisibleText(paragraph, locale)}</p>)}</section> : null}

        {'prompt' in content ? <PromptBox locale={locale} prompt={translateVisibleText(content.prompt, locale)} /> : null}

        {'outputs' in content ? <section className="content-section"><h2>{copy.outputs}</h2><ul>{content.outputs.map((item) => <li key={item}>{translateVisibleText(item, locale)}</li>)}</ul></section> : null}

        {'troubleshooting' in content ? <TroubleshootingSection title={copy.troubleshootingLabel} causeLabel={copy.causeLabel} fixLabel={copy.fixLabel} items={content.troubleshooting} locale={locale} /> : null}

        <div className="entry-actions">
          {props.type !== 'resource' ? <button className={`complete-button ${completed ? 'done' : ''}`} onClick={() => toggle(slug)}>{completed ? '✓ ' : ''}{copy.completed}</button> : <span />}
          <div className="pager-links">
            {previous ? <Link className="text-button" to={getEntryPath(props.type, previous.slug)}>← {getEntryTitle(previous, locale)}</Link> : null}
            {next ? <Link className="button primary compact" to={getEntryPath(props.type, next.slug)}>{getEntryTitle(next, locale)} →</Link> : null}
          </div>
        </div>
      </article>
    </main>
  );
}

function CertificatePage({ locale, courseCompleted, studentName, setStudentName }) {
  const copy = shellCopy[locale];
  const location = useLocation();
  const sampleMode = new URLSearchParams(location.search).has('sample');
  const completedOn = useMemo(
    () => new Intl.DateTimeFormat(locale === 'pt' ? 'pt-BR' : locale === 'es' ? 'es-MX' : 'en-US', { dateStyle: 'long' }).format(new Date()),
    [locale],
  );

  if (!courseCompleted && !sampleMode) {
    return (
      <main className="certificate-page">
        <div className="certificate-shell locked">
          <p className="eyebrow">{copy.certificate}</p>
          <h1>{copy.certificateLocked}</h1>
          <p>{copy.completionRule}</p>
          <Link className="button primary" to="/">{copy.backToHome}</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="certificate-page">
      <div className="certificate-toolbar">
        <label className="certificate-field">
          <span>{copy.studentName}</span>
          <input value={studentName} onChange={(event) => setStudentName(event.target.value)} placeholder={copy.studentNamePlaceholder} />
        </label>
        <button className="button primary" onClick={() => window.print()}>{copy.printCertificate}</button>
      </div>
      <section className="certificate-shell badge-certificate-shell">
        <div className="certificate-badge" aria-label={`${copy.certificate}: Cloudflare OS Operator`}>
          <div className="certificate-badge-core">
            <CloudflareLogo />
            <span className="certificate-ribbon">Completed</span>
            <h1>Cloudflare OS</h1>
            <p>OPERATOR</p>
            <div className="certificate-badge-footer">
              <strong>{studentName || copy.studentNamePlaceholder}</strong>
              <span>{copy.completedOn} {completedOn}</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function CloudflareLogo() {
  return (
    <svg className="cloudflare-logo" viewBox="0 0 470 96" role="img" aria-label="Cloudflare">
      <path fill="#F48120" d="M118.3 68.7c3.1-10.7-3.4-20.6-14.8-22.6l-2.7-.5-1.4-2.4c-5.5-9.3-15.7-15.1-26.7-15.1-14.4 0-26.8 9.6-30.1 23.2l-.6 2.6-2.6.2C27.7 55 18.8 64.5 18.8 76.1c0 1.1.1 2.1.2 3.2h94.8c1.9-3.1 3.4-6.6 4.5-10.6Z" />
      <path fill="#FAAD3F" d="M132.7 79.3c8.7 0 15.8-7 15.8-15.6S141.4 48 132.7 48c-2.2 0-4.3.4-6.2 1.2l-2.7 1.1-1.6-2.4c-3.7-5.5-9.8-8.8-16.5-8.8-1.5 0-3 .2-4.4.5 8.2 4.3 13.5 12.7 13.5 22.3 0 2.3-.3 4.7-1 7l-3 10.4h21.9Z" />
      <text x="174" y="64" fill="#111111" fontFamily="Inter, Arial, sans-serif" fontSize="40" fontWeight="800" letterSpacing="3.5">CLOUDFLARE</text>
    </svg>
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
            <p>{translateVisibleText(item, locale)}</p>
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
