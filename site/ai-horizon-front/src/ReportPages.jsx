import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getBlueprint } from './blueprint-content';
import { getReportTemplate, getReportTemplateForBlueprint, reportConfidences, reportHorizons, reportSeverities, reportTemplates } from './report-content';
import './report-styles.css';

const DRAFT_STATUS = 'Draft, review required';

function newFinding() {
  return {
    id: `finding-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: '',
    severity: 'High',
    rationale: '',
    source: '',
    retrievedAt: new Date().toISOString().slice(0, 16),
    affectedScope: '',
    observedFact: '',
    confidence: 'Verified',
    action: '',
    owner: '',
    horizon: '30 days',
  };
}

export function OutputsPage({ reports, workspaces, deleteReport, clearReports }) {
  return (
    <main className="outputs-page">
      <section className="outputs-hero"><div><p className="eyebrow">Decision-ready evidence</p><h1>PDF report outputs</h1><p>Turn a governed Workspace into a cited draft with accountable owners, remediation horizons, and visible release gates.</p></div><div className="output-principle"><span>Release authority</span><strong>Human reviewer</strong><p>Cloudflare OS prepares the artifact. Evidence owners approve it.</p></div></section>
      <section className="report-privacy-note"><strong>Session-only evidence</strong><p>Report drafts remain only in this browser tab and are removed when the tab closes. Print the required PDF, then delete the draft before leaving a shared device.</p></section>
      <section className="report-template-section"><div className="report-section-heading"><div><p className="eyebrow">Report catalog</p><h2>Choose the decision artifact.</h2></div><span>{reportTemplates.length} Blueprint templates</span></div><div className="report-template-grid">{reportTemplates.map((template, index) => <Link className="report-template-card" to={`/outputs/templates/${template.slug}`} key={template.slug}><div><span>{String(index + 1).padStart(2, '0')}</span><small>{template.accent}</small></div><h3>{template.title}</h3><p>{template.summary}</p><strong>Inspect template →</strong></Link>)}</div></section>
      <section className="report-library"><div className="report-section-heading"><div><p className="eyebrow">Session drafts</p><h2>Workspace reports</h2></div><div className="report-library-actions">{reports.length > 0 ? <button className="text-button compact" type="button" onClick={() => { if (window.confirm('Delete all session report drafts? This cannot be undone.')) clearReports(); }}>Delete all drafts</button> : null}{workspaces.length > 0 ? <Link className="button primary compact" to="/outputs/new">Create report draft →</Link> : <Link className="button primary compact" to="/blueprints">Create a Workspace first →</Link>}</div></div>{reports.length > 0 ? <div className="report-library-list">{reports.map((report) => <ReportLibraryCard report={report} workspaces={workspaces} deleteReport={deleteReport} key={report.id} />)}</div> : <div className="workspace-library-empty"><p>No report drafts in this session.</p><span>Start from a governed Workspace after evidence collection.</span></div>}</section>
    </main>
  );
}

function ReportLibraryCard({ report, workspaces, deleteReport }) {
  const workspace = workspaces.find((item) => item.id === report.workspaceId);
  return <article className="report-library-card"><span className="report-status">{DRAFT_STATUS}</span><div><Link to={`/outputs/${report.id}`}><h3>{report.title}</h3></Link><p>{workspace?.name || 'Workspace unavailable'} · {workspace?.audience || 'Audience unavailable'}</p></div><small>{new Date(report.createdAt).toLocaleDateString('en-US')}</small><div className="report-card-actions"><Link to={`/outputs/${report.id}`}>Open →</Link><button type="button" onClick={() => { if (window.confirm('Delete this session report draft?')) deleteReport(report.id); }}>Delete</button></div></article>;
}

export function ReportTemplateDetail({ workspaces }) {
  const { slug } = useParams();
  const template = getReportTemplate(slug);
  const blueprint = template ? getBlueprint(template.blueprintSlug) : null;
  if (!template || !blueprint) return <Navigate to="/outputs" replace />;
  const matchingWorkspaces = workspaces.filter((workspace) => workspace.blueprintSlug === blueprint.slug);

  return <main className="report-template-detail"><aside><Link className="back-link" to="/outputs">← Outputs</Link><p className="blueprint-category">{template.accent}</p><div className="blueprint-detail-meta"><p><strong>Blueprint</strong><span>{blueprint.title}</span></p><p><strong>Sections</strong><span>{template.sections.length}</span></p><p><strong>Release gates</strong><span>{template.qualityGates.length}</span></p></div>{matchingWorkspaces.length > 0 ? <Link className="button primary" to={`/outputs/new?blueprint=${blueprint.slug}`}>Create report draft →</Link> : <Link className="button primary" to={`/workspaces/new?blueprint=${blueprint.slug}`}>Create matching Workspace →</Link>}</aside><article><header><p className="eyebrow">PDF-ready template</p><h1>{template.title}</h1><p>{template.summary}</p></header><section className="report-template-method"><span>Methodology</span><p>{template.methodology}</p></section><TemplateList title="Report structure" items={template.sections} numbered /><TemplateList title="Required evidence" items={template.requiredEvidence} /><TemplateList title="Release gates" items={template.qualityGates} gates /></article></main>;
}

function TemplateList({ title, items, numbered = false, gates = false }) {
  return <section className={`template-list ${gates ? 'gate-list' : ''}`}><p className="section-label">{title}</p><ol>{items.map((item, index) => <li key={item}><span>{numbered ? String(index + 1).padStart(2, '0') : gates ? 'GATE' : 'REQ'}</span>{item}</li>)}</ol></section>;
}

export function ReportCreate({ workspaces, createReport }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const requestedWorkspace = searchParams.get('workspace');
  const requestedBlueprint = searchParams.get('blueprint');
  const candidates = requestedBlueprint ? workspaces.filter((item) => item.blueprintSlug === requestedBlueprint) : workspaces;
  const [workspaceId, setWorkspaceId] = useState('');
  const workspace = candidates.find((item) => item.id === workspaceId);
  const blueprint = workspace ? getBlueprint(workspace.blueprintSlug) : null;
  const template = blueprint ? getReportTemplateForBlueprint(blueprint.slug) : null;
  const [title, setTitle] = useState('');
  const [sections, setSections] = useState({});
  const [findings, setFindings] = useState([newFinding()]);
  const [assumptions, setAssumptions] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const scoped = requestedBlueprint ? workspaces.filter((item) => item.blueprintSlug === requestedBlueprint) : workspaces;
    const requested = scoped.find((item) => item.id === requestedWorkspace);
    setWorkspaceId((current) => requested?.id || (scoped.some((item) => item.id === current) ? current : scoped[0]?.id || ''));
  }, [requestedWorkspace, requestedBlueprint, workspaces]);

  useEffect(() => {
    if (workspace && template) setTitle(`${workspace.name}: ${template.title}`);
  }, [workspace?.id, workspace?.name, template?.title]);

  useEffect(() => {
    if (template) setSections(Object.fromEntries(template.sections.map((section) => [section, ''])));
  }, [template?.slug, workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    setFindings([newFinding()]);
    setAssumptions('');
    setConfirmed(false);
    setError('');
  }, [workspaceId]);

  if (workspaces.length === 0) return <Navigate to="/blueprints" replace />;
  if (requestedBlueprint && candidates.length === 0) return <Navigate to={`/workspaces/new?blueprint=${requestedBlueprint}`} replace />;

  function updateFinding(id, field, value) {
    setFindings((current) => current.map((finding) => finding.id === id ? { ...finding, [field]: value } : finding));
    setError('');
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!workspace || !blueprint || !template || !confirmed) {
      setError('Select a Workspace and confirm the session evidence boundary.');
      return;
    }
    const cleanSections = Object.fromEntries(template.sections.map((section) => [section, sections[section]?.trim() || '']));
    const cleanFindings = findings.map((finding) => Object.fromEntries(Object.entries(finding).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])));
    const findingFields = ['title', 'rationale', 'source', 'retrievedAt', 'affectedScope', 'observedFact', 'action', 'owner'];
    if (!title.trim() || !assumptions.trim() || Object.values(cleanSections).some((value) => !value) || cleanFindings.some((finding) => findingFields.some((field) => !finding[field]))) {
      setError('Complete every section and structured evidence field.');
      return;
    }
    const id = `${blueprint.slug}-report-${Date.now()}`;
    const saved = createReport({ id, workspaceId: workspace.id, blueprintSlug: blueprint.slug, title: title.trim(), sections: cleanSections, findings: cleanFindings, assumptions: assumptions.trim(), createdAt: new Date().toISOString() });
    if (!saved) {
      setError('This browser could not save the session draft. Check session storage access and try again.');
      return;
    }
    navigate(`/outputs/${id}`);
  }

  return <main className="report-create-page"><section className="report-create-intro"><Link className="back-link" to="/outputs">← Outputs</Link><p className="eyebrow">Evidence-backed draft</p><h1>Create the report, not the transcript.</h1><p>Use reviewed facts only. Draft evidence remains in this browser tab until it closes or you delete it.</p>{template ? <div className="selected-blueprint"><span>Selected template</span><strong>{template.title}</strong><p>{template.methodology}</p></div> : null}</section><form className="report-form" onSubmit={handleSubmit}><label>Workspace<select required value={workspaceId} onChange={(event) => { const hasEvidence = Object.values(sections).some(Boolean) || assumptions || findings.some((finding) => finding.title || finding.source || finding.observedFact); if (!hasEvidence || window.confirm('Switch Workspace and discard the current report evidence?')) setWorkspaceId(event.target.value); }}>{candidates.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>Report title<input required maxLength="120" value={title} onChange={(event) => setTitle(event.target.value)} /></label>{template?.sections.map((section, index) => <label key={section}>{section}<textarea required maxLength="1600" value={sections[section] || ''} onChange={(event) => setSections((current) => ({ ...current, [section]: event.target.value }))} placeholder={template.sectionPrompts[index]} /></label>)}<div className="report-form-divider"><span>Evidence-backed findings</span></div>{findings.map((finding, index) => <FindingForm finding={finding} index={index} canRemove={findings.length > 1} onChange={updateFinding} onRemove={() => setFindings((current) => current.filter((item) => item.id !== finding.id))} key={finding.id} />)}{findings.length < 5 ? <button className="text-button compact" type="button" onClick={() => setFindings((current) => [...current, newFinding()])}>Add another finding</button> : null}<label>Assumptions and evidence gaps<textarea required maxLength="800" value={assumptions} onChange={(event) => setAssumptions(event.target.value)} placeholder="Use 'None identified' only after review." /></label><label className="report-confirm"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>I understand this session draft contains customer evidence, is not approved, and should be printed then deleted on shared devices.</span></label>{error ? <p className="form-error" role="alert">{error}</p> : null}<button className="button primary" type="submit">Generate PDF-ready draft →</button></form></main>;
}

function FindingForm({ finding, index, canRemove, onChange, onRemove }) {
  return <fieldset className="finding-form"><legend>Finding {String(index + 1).padStart(2, '0')}</legend>{canRemove ? <button type="button" onClick={onRemove}>Remove</button> : null}<label>Finding title<input required maxLength="140" value={finding.title} onChange={(event) => onChange(finding.id, 'title', event.target.value)} /></label><div className="report-form-row"><label>Severity<select value={finding.severity} onChange={(event) => onChange(finding.id, 'severity', event.target.value)}>{reportSeverities.map((item) => <option key={item}>{item}</option>)}</select></label><label>Confidence<select value={finding.confidence} onChange={(event) => onChange(finding.id, 'confidence', event.target.value)}>{reportConfidences.map((item) => <option key={item}>{item}</option>)}</select></label></div><label>Severity rationale<textarea required maxLength="800" value={finding.rationale} onChange={(event) => onChange(finding.id, 'rationale', event.target.value)} /></label><label>Evidence source<input required maxLength="200" value={finding.source} onChange={(event) => onChange(finding.id, 'source', event.target.value)} placeholder="System, query, control, or document" /></label><div className="report-form-row"><label>Retrieved at<input required type="datetime-local" value={finding.retrievedAt} onChange={(event) => onChange(finding.id, 'retrievedAt', event.target.value)} /></label><label>Affected scope<input required maxLength="200" value={finding.affectedScope} onChange={(event) => onChange(finding.id, 'affectedScope', event.target.value)} /></label></div><label>Observed fact<textarea required maxLength="800" value={finding.observedFact} onChange={(event) => onChange(finding.id, 'observedFact', event.target.value)} /></label><label>Recommended action<textarea required maxLength="800" value={finding.action} onChange={(event) => onChange(finding.id, 'action', event.target.value)} /></label><div className="report-form-row"><label>Action owner<input required maxLength="100" value={finding.owner} onChange={(event) => onChange(finding.id, 'owner', event.target.value)} /></label><label>Target horizon<select value={finding.horizon} onChange={(event) => onChange(finding.id, 'horizon', event.target.value)}>{reportHorizons.map((item) => <option key={item}>{item}</option>)}</select></label></div></fieldset>;
}

export function ReportDetail({ reports, workspaces, deleteReport }) {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const report = reports.find((item) => item.id === reportId);
  const workspace = report ? workspaces.find((item) => item.id === report.workspaceId) : null;
  const blueprint = report ? getBlueprint(report.blueprintSlug) : null;
  const template = report ? getReportTemplateForBlueprint(report.blueprintSlug) : null;

  useEffect(() => {
    if (!report) return undefined;
    const previousTitle = document.title;
    document.title = `${report.title} | Cloudflare OS`;
    return () => { document.title = previousTitle; };
  }, [report?.title]);

  if (!report || !workspace || workspace.blueprintSlug !== report.blueprintSlug || !blueprint || !template) return <Navigate to="/outputs" replace />;

  function removeDraft() {
    if (!window.confirm('Delete this session report draft? This cannot be undone.')) return;
    deleteReport(report.id);
    navigate('/outputs');
  }

  return <main className="report-output-page"><div className="report-output-toolbar"><Link className="back-link" to="/outputs">← Outputs</Link><div><span>Draft only. Review before sharing.</span><button className="text-button compact" type="button" onClick={removeDraft}>Delete draft</button><button className="button primary compact" onClick={() => window.print()}>Print / Save as PDF</button></div></div><article className="report-document"><header className="report-cover"><div className="report-brand"><span className="brand-mark">CF</span><strong>Cloudflare OS</strong></div><p className="eyebrow">{template.accent}</p><h1>{report.title}</h1><p>{template.summary}</p><div className="report-cover-meta"><span><strong>Status</strong>{DRAFT_STATUS}</span><span><strong>Workspace</strong>{workspace.name}</span><span><strong>Audience</strong>{workspace.audience}</span><span><strong>Date</strong>{new Date(report.createdAt).toLocaleDateString('en-US')}</span></div></header><section className="report-decision"><span>{template.sections[0]}</span><p>{report.sections[template.sections[0]]}</p></section>{template.sections.slice(1).map((section, index) => <ReportSection number={String(index + 2).padStart(2, '0')} title={section} key={section}><p>{report.sections[section]}</p>{section === template.findingsSection ? <Findings findings={report.findings} /> : null}</ReportSection>)}<ReportSection number={String(template.sections.length + 1).padStart(2, '0')} title="Assumptions and evidence gaps"><p>{report.assumptions}</p></ReportSection><section className="report-release-gates"><p className="section-label">Release gates</p><h2>Review required before sharing</h2>{template.qualityGates.map((gate, index) => <p key={gate}><span>{index === 0 ? 'INPUT' : 'PENDING'}</span>{gate}</p>)}</section><footer><strong>Cloudflare OS</strong><span>Session draft generated from user-supplied evidence. Not a final risk acceptance record.</span></footer></article></main>;
}

function Findings({ findings }) {
  return <div className="report-findings">{findings.map((finding, index) => <article key={finding.id}><div className="finding-heading"><span className={`severity ${finding.severity.toLowerCase()}`}>{finding.severity}</span><div><small>Finding {String(index + 1).padStart(2, '0')} · {finding.confidence} confidence</small><h3>{finding.title}</h3></div></div><p>{finding.rationale}</p><div className="evidence-block"><strong>Evidence record</strong><p><b>Source:</b> {finding.source}</p><p><b>Retrieved:</b> {new Date(finding.retrievedAt).toLocaleString('en-US')}</p><p><b>Scope:</b> {finding.affectedScope}</p><p><b>Observed fact:</b> {finding.observedFact}</p></div><div className="remediation-table"><div><span>Action</span><p>{finding.action}</p></div><div><span>Owner</span><p>{finding.owner}</p></div><div><span>Target</span><p>{finding.horizon}</p></div></div></article>)}</div>;
}

function ReportSection({ number, title, children }) {
  return <section className="report-section"><div className="report-section-title"><span>{number}</span><h2>{title}</h2></div>{children}</section>;
}

export function WorkspaceReports({ workspace, reports }) {
  const workspaceReports = reports.filter((report) => report.workspaceId === workspace.id);
  return <section className="workspace-report-panel"><div><p className="section-label">Session report outputs</p><h2>{workspaceReports.length > 0 ? `${workspaceReports.length} draft report${workspaceReports.length === 1 ? '' : 's'}` : 'No report draft yet'}</h2></div>{workspaceReports.length > 0 ? <div>{workspaceReports.map((report) => <Link to={`/outputs/${report.id}`} key={report.id}>{report.title}<span>{DRAFT_STATUS}</span></Link>)}</div> : <p>Complete evidence collection before creating the decision artifact.</p>}<Link className="button primary compact" to={`/outputs/new?workspace=${workspace.id}`}>Create PDF-ready draft →</Link></section>;
}
