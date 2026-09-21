import React, { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { getBlueprintSkills, getSkill, skills } from './skill-content';
import './skill-styles.css';

function workflowKey(workspaceId) {
  return `ai-horizon-workshop-v6-workflow-${workspaceId}`;
}

function qualityWorkflowKey(workspaceId, reportId) {
  return `${workflowKey(workspaceId)}-report-${reportId}`;
}

function readQualityPrepared(workspaceId, reportId) {
  try {
    return sessionStorage.getItem(qualityWorkflowKey(workspaceId, reportId)) === 'prepared';
  } catch {
    return false;
  }
}

function clearQualityWorkflow(workspaceId) {
  const prefix = `${workflowKey(workspaceId)}-report-`;
  Object.keys(sessionStorage).filter((key) => key.startsWith(prefix)).forEach((key) => sessionStorage.removeItem(key));
}

export function clearReportSkillWorkflow(workspaceId, reportId) {
  try {
    sessionStorage.removeItem(qualityWorkflowKey(workspaceId, reportId));
  } catch {
    // Report deletion remains authoritative if browser storage cleanup is unavailable.
  }
}

export function clearAllReportSkillWorkflows() {
  try {
    const prefix = 'ai-horizon-workshop-v6-workflow-';
    Object.keys(sessionStorage).filter((key) => key.startsWith(prefix) && key.includes('-report-')).forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // Report deletion remains authoritative if browser storage cleanup is unavailable.
  }
}

function readPreparedSkills(workspaceId, allowedSkills) {
  try {
    const saved = JSON.parse(localStorage.getItem(workflowKey(workspaceId)) || '[]');
    if (!Array.isArray(saved)) return [];
    if (saved.length > allowedSkills.length || saved.some((slug, index) => slug !== allowedSkills[index].slug)) return [];
    return [...saved];
  } catch {
    return [];
  }
}

export function SkillCatalog() {
  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState('All');
  const phases = ['All', ...skills.map((skill) => skill.phase)];
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = skills.filter((skill) => (phase === 'All' || skill.phase === phase)
    && (!normalizedQuery || `${skill.title} ${skill.summary} ${skill.outputs.join(' ')}`.toLowerCase().includes(normalizedQuery)));

  return <main className="skill-page"><section className="skill-hero"><div><p className="eyebrow">Reusable capability layer</p><h1>Super Skills</h1><p>Prepare repeatable evidence, analysis, communication, planning, and quality outputs without hiding human approval gates.</p></div><div className="skill-boundary"><span>Execution model</span><strong>Guided, not autonomous</strong><p>Prompts prepare draft outputs. People authorize every gate.</p></div></section><section className="catalog-controls" aria-label="Super Skill filters"><label className="catalog-search"><span>Search Skills</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by output or capability" /></label><div className="filter-row">{phases.map((item) => <button type="button" aria-pressed={phase === item} className={phase === item ? 'active' : ''} onClick={() => setPhase(item)} key={item}>{item}</button>)}</div></section><section className="skill-grid" aria-live="polite">{filtered.map((skill) => <Link className="skill-card" to={`/skills/${skill.slug}`} key={skill.slug}><div><span>{String(skill.order).padStart(2, '0')}</span><small>{skill.phase}</small></div><h2>{skill.title}</h2><p>{skill.summary}</p><footer><span>{skill.outputs.length} outputs</span><strong>Inspect contract →</strong></footer></Link>)}{filtered.length === 0 ? <div className="catalog-empty"><h2>No matching Super Skills</h2><p>Clear the search or select another phase.</p></div> : null}</section></main>;
}

export function SkillDetail() {
  const { slug } = useParams();
  const skill = getSkill(slug);
  const [copied, setCopied] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  if (!skill) return <Navigate to="/skills" replace />;

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(skill.prompt);
      setCopied(true);
      setCopyStatus('Prompt copied to clipboard.');
      window.setTimeout(() => { setCopied(false); setCopyStatus(''); }, 1200);
    } catch {
      setCopied(false);
      setCopyStatus('Clipboard access failed. Select the prompt text to copy it manually.');
    }
  }

  return <main className="skill-detail"><aside><Link className="back-link" to="/skills">← Super Skills</Link><p className="blueprint-category">{skill.phase}</p><div className="blueprint-detail-meta"><p><strong>Workflow step</strong><span>{String(skill.order).padStart(2, '0')}</span></p><p><strong>Outputs</strong><span>{skill.outputs.length}</span></p><p><strong>Approval gate</strong><span>Human required</span></p></div><Link className="button primary" to="/workspaces">Open Workspaces →</Link></aside><article><header><p className="eyebrow">Super Skill contract</p><h1>{skill.title}</h1><p>{skill.summary}</p></header><section className="skill-trigger"><span>Trigger</span><p>{skill.trigger}</p></section><SkillContractList title="Required inputs" items={skill.inputs} marker="IN" /><SkillContractList title="Draft outputs" items={skill.outputs} marker="OUT" /><SkillContractList title="Source requirements" items={skill.sourceRequirements} marker="REQ" /><SkillContractList title="Safety boundaries" items={skill.boundaries} marker="STOP" danger /><section className="skill-approval"><p className="section-label">Human approval gate</p><h2>{skill.approval}</h2><span>Cloudflare OS cannot close this gate.</span></section><section className="skill-prompt"><div><p className="section-label">Reusable prompt</p><p>{skill.prompt}</p></div><button type="button" onClick={copyPrompt}>{copied ? 'Copied' : 'Copy prompt'}</button><span className="skill-live-status" role="status" aria-live="polite">{copyStatus}</span></section></article></main>;
}

function SkillContractList({ title, items, marker, danger = false }) {
  return <section className={`skill-contract-list ${danger ? 'danger' : ''}`}><p className="section-label">{title}</p><ul>{items.map((item) => <li key={item}><span>{marker}</span>{item}</li>)}</ul></section>;
}

export function SkillLinks({ blueprint, compact = false }) {
  const linkedSkills = getBlueprintSkills(blueprint);
  return <section className={compact ? 'compact-skill-links' : 'blueprint-section'}><p className="section-label">Super Skills workflow</p>{!compact ? <p className="skill-links-intro">These capabilities prepare draft outputs in sequence. Each named approval remains human-owned.</p> : null}<div className="skill-links">{linkedSkills.map((skill) => <Link to={`/skills/${skill.slug}`} key={skill.slug}><span>{String(skill.order).padStart(2, '0')} · {skill.phase}</span><strong>{skill.title}</strong><small>{skill.gate}</small></Link>)}</div></section>;
}

export function SkillWorkflow({ workspace, blueprint, report }) {
  const workflowSkills = getBlueprintSkills(blueprint);
  const qualityStepIndex = workflowSkills.length - 1;
  const preparationSkills = workflowSkills.slice(0, qualityStepIndex);
  const [prepared, setPrepared] = useState(() => {
    const base = readPreparedSkills(workspace.id, preparationSkills);
    const qualityPrepared = report && base.length === preparationSkills.length
      && readQualityPrepared(workspace.id, report.id);
    return qualityPrepared ? [...base, workflowSkills[qualityStepIndex].slug] : base;
  });
  const [storageError, setStorageError] = useState('');
  const preReportPrepared = prepared.length >= qualityStepIndex;
  const allPrepared = Boolean(report) && prepared.length === workflowSkills.length;

  function togglePrepared(skill, index) {
    const next = prepared.includes(skill.slug)
      ? prepared.slice(0, index)
      : index === prepared.length ? [...prepared, skill.slug] : prepared;
    try {
      if (index === qualityStepIndex) {
        if (next.includes(skill.slug)) sessionStorage.setItem(qualityWorkflowKey(workspace.id, report.id), 'prepared');
        else sessionStorage.removeItem(qualityWorkflowKey(workspace.id, report.id));
      } else {
        localStorage.setItem(workflowKey(workspace.id), JSON.stringify(next.slice(0, qualityStepIndex)));
        if (report) sessionStorage.removeItem(qualityWorkflowKey(workspace.id, report.id));
      }
      setPrepared(next);
      setStorageError('');
    } catch {
      setStorageError('This browser could not save the workflow checklist. Check browser storage access and try again.');
    }
  }

  function resetWorkflow() {
    if (!window.confirm('Reset this Workspace workflow checklist?')) return;
    try {
      localStorage.removeItem(workflowKey(workspace.id));
      clearQualityWorkflow(workspace.id);
      setPrepared([]);
      setStorageError('');
    } catch {
      setStorageError('This browser could not reset the workflow checklist. Check browser storage access and try again.');
    }
  }

  return <section className="skill-workflow"><div className="skill-workflow-heading"><div><p className="section-label">Run workflow checklist</p><h2>{prepared.length}/{workflowSkills.length} draft outputs prepared</h2><p>Checklist state contains no customer evidence. A prepared output still requires its named human gate.</p></div>{prepared.length > 0 ? <button className="text-button compact" type="button" onClick={resetWorkflow}>Reset checklist</button> : null}</div>{storageError ? <p className="form-error" role="alert">{storageError}</p> : null}<div className="workflow-steps">{workflowSkills.map((skill, index) => { const isPrepared = prepared.includes(skill.slug); const reportRequired = index === qualityStepIndex && !report; const isAvailable = index <= prepared.length && !reportRequired; return <article className={`${isPrepared ? 'prepared' : ''} ${isAvailable ? '' : 'locked'}`} key={skill.slug}><div className="workflow-step-index">{String(index + 1).padStart(2, '0')}</div><div><Link to={`/skills/${skill.slug}`}><h3>{skill.title}</h3></Link><p>{skill.summary}</p><span>Human gate: {skill.gate}</span></div><div className="workflow-step-action"><strong>{isPrepared ? 'Output prepared' : reportRequired ? 'Report draft required' : isAvailable ? 'Ready' : 'Previous step required'}</strong><button type="button" disabled={!isAvailable} onClick={() => togglePrepared(skill, index)}>{isPrepared ? 'Reopen from here' : 'Mark output prepared'}</button></div></article>; })}</div>{preReportPrepared && !report ? <div className="workflow-complete"><div><strong>Analysis workflow prepared</strong><p>Create the PDF-ready draft before running the final quality audit.</p></div><Link className="button primary compact" to={`/outputs/new?workspace=${workspace.id}`}>Create report draft →</Link></div> : null}{report && !allPrepared ? <div className="workflow-complete"><div><strong>Report draft available</strong><p>Run the final quality audit. Human release gates remain open.</p></div><Link className="text-button compact" to={`/outputs/${report.id}`}>Review report draft →</Link></div> : null}{allPrepared ? <div className="workflow-complete"><div><strong>Draft workflow prepared</strong><p>All Skill outputs are prepared. Named human release gates remain open.</p></div><Link className="button primary compact" to={`/outputs/${report.id}`}>Review report draft →</Link></div> : null}</section>;
}
