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
    'Cloudflare OS': 'Super Seal',
    'live workshop': 'live course',
    'workshop': 'course',
  },
  es: {
    'Cloudflare OS': 'Super Seal',
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
    'Cloudflare OS': 'Super Seal',
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
  return `/${routePrefixes[type]}`;
}

function getEntryTitle(entry, locale) {
  return translateVisibleText(entry.content?.[locale]?.title || entry.title, locale);
}

function getPageTypeLabel(type, copy) {
  if (type === 'lesson') return copy.lessonType;
  if (type === 'exercise') return copy.exerciseType;
  return copy.guideType;
}

function getNextIncomplete(collection, progress) {
  return collection.find((item) => !progress.includes(item.slug)) || null;
}

function formatDuration(entry, copy) {
  return entry.duration ? `${entry.duration} ${copy.duration}` : null;
}

export default function App() {
  const saved = readJson(SETTINGS_KEY, {});
  const [locale, setLocale] = useState(saved.locale || 'es');
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
        locale={locale}
        lessonProgress={lessonProgress}
        exerciseProgress={exerciseProgress}
        navOpen={navOpen}
        onNavigate={() => setNavOpen(false)}
      />
      <div className="main-area">
        <TopBar {...context} navOpen={navOpen} onToggleNav={() => setNavOpen((value) => !value)} />
        <Routes>
          <Route path="/" element={<Home {...context} />} />
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

function Sidebar({ locale, lessonProgress, exerciseProgress, navOpen, onNavigate }) {
  const copy = shellCopy[locale];
  const location = useLocation();

  return (
    <nav className={`app-sidebar ${navOpen ? 'open' : ''}`}>
      <Link className="sidebar-brand" to="/" onClick={onNavigate}>
        <span className="brand-mark">AI</span>
        <span><strong>Horizon</strong> School<small>{copy.powered}</small></span>
      </Link>

      <div className="sidebar-group">
        <Link className="sidebar-label-link" to="/lessons" onClick={onNavigate}>{copy.lessons}</Link>
        <ol className="sidebar-list">
          {lessons.map((entry) => {
            const href = getEntryPath('lesson', entry.slug);
            const active = location.pathname === href;
            const done = lessonProgress.includes(entry.slug);
            return (
              <li key={entry.slug}>
                <Link className={`sidebar-link ${active ? 'active' : ''}`} to={href} onClick={onNavigate}>
                  <span><span className="sidebar-index">{entry.number}.</span> {getEntryTitle(entry, locale)}</span>
                  {done ? <span className="sidebar-check">✓</span> : null}
                </Link>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="sidebar-group bordered">
        <Link className="sidebar-label-link" to="/exercises" onClick={onNavigate}>{copy.exercises}</Link>
        <ol className="sidebar-list">
          {exercises.map((entry) => {
            const href = getEntryPath('exercise', entry.slug);
            const active = location.pathname === href;
            const done = exerciseProgress.includes(entry.slug);
            return (
              <li key={entry.slug}>
                <Link className={`sidebar-link ${active ? 'active' : ''}`} to={href} onClick={onNavigate}>
                  <span>{getEntryTitle(entry, locale)}</span>
                  {done ? <span className="sidebar-check">✓</span> : null}
                </Link>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="sidebar-group bordered">
        <Link className="sidebar-label-link" to="/resources" onClick={onNavigate}>{copy.resources}</Link>
        <ol className="sidebar-list">
          {resources.map((entry) => {
            const href = getEntryPath('resource', entry.slug);
            const active = location.pathname === href;
            return (
              <li key={entry.slug}>
                <Link className={`sidebar-link ${active ? 'active' : ''}`} to={href} onClick={onNavigate}>
                  <span>{getEntryTitle(entry, locale)}</span>
                </Link>
              </li>
            );
          })}
        </ol>
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
          <Link className="button secondary" to="/resources">{copy.resources}</Link>
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
        heading={copy.lessons}
        intro={copy.lessonsIntro}
        collection={lessons}
      />
      <SectionSummary
        type="exercise"
        locale={locale}
        progress={exerciseProgress}
        heading={copy.exercises}
        intro={copy.exercisesIntro}
        collection={exercises}
      />
      <SectionSummary
        type="resource"
        locale={locale}
        progress={[]}
        heading={copy.resources}
        intro={copy.aboutIntro}
        collection={resources}
        note={copy.optionalGuides}
      />
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
  const backLabel = props.type === 'lesson' ? copy.allLessons : props.type === 'exercise' ? copy.exercises : copy.resources;
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
        <div className="certificate-badge" aria-label={`${copy.certificate}: Super Seal Operator`}>
          <div className="certificate-badge-core">
            <CloudflareLogo />
            <span className="certificate-ribbon">Completed</span>
            <h1>Super Seal</h1>
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
