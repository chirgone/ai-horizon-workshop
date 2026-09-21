import { installationLesson } from './installation';

export const shellCopy = {
  en: {
    studentId: 'Cloudflare OS Workshop',
    hero: 'Connect governed enterprise context, install MCP Blueprints, and turn live evidence into decision-ready security reports.',
    heroTitleTop: 'Build with',
    heroTitleBottom: 'Cloudflare OS',
    heroSupport: 'Cloudflare OS is the door. AI is the hook. MCP Blueprints are the operating model. PDF reports are the outcome.',
    lessons: 'Workspaces',
    exercises: 'Blueprint practice',
    resources: 'Explore',
    continue: 'Continue',
    completed: 'Completed',
    prompt: 'Prompt for Cloudflare OS',
    copy: 'Copy',
    copied: 'Copied',
    duration: 'min',
    objective: 'Objective',
    steps: 'Steps',
    outputs: 'Expected outputs',
    purposeLabel: 'Why it exists',
    howToUseLabel: 'How to use it',
    benefitLabel: 'Why it helps',
    reference: 'Embedded reference',
    prerequisites: 'Before you start',
    commandsLabel: 'Copy-paste commands',
    troubleshootingLabel: 'Troubleshooting',
    causeLabel: 'Why it happens',
    fixLabel: 'Fix',
    advancedLabel: 'Advanced path',
    workshopMode: 'In progress',
    sectionNumber: 'Section',
    sectionDuration: 'Duration',
    sectionStatus: 'Status',
    resumeWhereYouLeftOff: 'Resume workshop',
    courseProgress: 'Workshop progress',
    lessonsIntro: 'Move from workspace setup to connected evidence, a reviewed PDF report, and a remediation roadmap.',
    exercisesIntro: 'Apply the operating model to a realistic customer security outcome.',
    aboutIntro: 'Use these references to keep delivery, evidence, reports, and governance consistent.',
    optionalGuides: 'Reference material supports the workshop but does not replace evidence or human review.',
    start: 'Start with Installation',
    browseHint: 'Start with Installation, then define the workspace and connect only the evidence your Blueprint needs.',
    viewAll: 'Open',
  },
};

const sources = {
  official: [
    { label: 'Cloudflare Developer Platform', href: 'https://developers.cloudflare.com/' },
    { label: 'Cloudflare Agents documentation', href: 'https://developers.cloudflare.com/agents/' },
  ],
  policy: [
    { label: 'Cloudflare Trust Hub', href: 'https://www.cloudflare.com/trust-hub/' },
    { label: 'Cloudflare AI documentation', href: 'https://developers.cloudflare.com/ai/' },
  ],
  mcp: [
    { label: 'Cloudflare managed MCP servers', href: 'https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/' },
    { label: 'Cloudflare Documentation MCP', href: 'https://docs.mcp.cloudflare.com/mcp' },
  ],
  deployment: [
    { label: 'Cloudflare Workers documentation', href: 'https://developers.cloudflare.com/workers/' },
    { label: 'Cloudflare Access documentation', href: 'https://developers.cloudflare.com/cloudflare-one/access-controls/' },
  ],
};

function entry(type, slug, title, duration, sourceSet, content, number) {
  return {
    type,
    slug,
    title,
    ...(number ? { number } : {}),
    ...(duration ? { duration } : {}),
    sources: sourceSet,
    content: { en: content },
  };
}

const workspace = (number, slug, title, duration, sourceSet, content) => entry('lesson', slug, title, duration, sourceSet, content, number);
const practice = (slug, title, duration, sourceSet, content) => entry('exercise', slug, title, duration, sourceSet, content);
const guide = (slug, title, sourceSet, content) => entry('resource', slug, title, null, sourceSet, content);

export const lessons = [
  installationLesson,
  workspace('02', 'workshop-setup', 'Workspace Setup', 10, sources.official, {
    summary: 'Turn the deployed Cloudflare OS instance into a governed workspace with a clear customer outcome, scope, and owner.',
    objective: 'Create the operating boundary before connecting data or running analysis.',
    steps: ['Name the workspace after the customer outcome.', 'Record the executive sponsor, technical owner, reviewer, and decision audience.', 'Define one security question and one report outcome.', 'Set approved systems, prohibited data, retention expectations, and approval points.', 'Confirm that the workshop remains read-only.'],
    outputs: ['Workspace charter', 'Named owners and reviewers', 'Approved data boundary', 'One report outcome'],
    reference: ['One workspace should answer one decision question.', 'Read-only access is the default.', 'Every report needs a named owner and reviewer.'],
    prompt: 'Create a one-page workspace charter for this Cloudflare OS workshop. Include the customer outcome, security question, report audience, approved data sources, prohibited data, owners, and approval boundaries.',
  }),
  workspace('03', 'mcp-servers', 'Connect Corporate Systems', 12, sources.mcp, {
    summary: 'Connect only the MCP servers and Corporate Test Connectors needed to answer the workshop security question.',
    objective: 'Build a least-privilege evidence layer without turning the workshop into an integration project.',
    steps: ['Start with Documentation MCP as the read-only reference source.', 'Select account-specific servers only when the Blueprint needs live evidence.', 'Map CRM, HR, wiki, collaboration, or identity connectors to exact evidence.', 'Authorize minimum scopes and record who granted access.', 'Run one harmless retrieval from each source.', 'Disconnect every source that does not contribute to the report.'],
    outputs: ['MCP connection map', 'Scope and owner register', 'Successful read-only retrieval', 'Excluded-source list'],
    reference: ['A connection is justified by evidence, not availability.', 'Underlying user entitlements still apply.', 'Write access requires separate approval.'],
    prompt: 'Build an MCP connection plan for this workshop. For each system state the evidence needed, server or connector, authentication owner, minimum read-only scope, validation query, and reason it is required.',
  }),
  workspace('04', 'blueprint-selection', 'Select a Blueprint', 8, [...sources.mcp, ...sources.policy], {
    summary: 'Choose the report Blueprint that best matches the customer decision and available evidence.',
    objective: 'Align the Blueprint, audience, sources, and decision deadline before analysis starts.',
    steps: ['Choose Account Audit for configuration posture and prioritized remediation.', 'Choose Attack Surface and Risk for exposed services and control coverage.', 'Choose AI Governance Readiness for AI usage, policy, observability, and maturity.', 'Confirm required evidence is inside the approved boundary.', 'Define report depth, audience, appendix needs, and deadline.', 'Record evidence gaps before the Blueprint runs.'],
    outputs: ['Selected Blueprint', 'Audience and decision statement', 'Required evidence list', 'Known evidence gaps'],
    reference: ['Select one primary Blueprint per run.', 'Narrow and evidence-backed beats broad and speculative.', 'State gaps before analysis begins.'],
    prompt: 'Recommend the best Blueprint for this customer question. Compare Account Audit, Attack Surface and Risk, and AI Governance Readiness against audience, available evidence, urgency, and expected decision.',
  }),
  workspace('05', 'evidence-collection', 'Collect Evidence', 15, sources.mcp, {
    summary: 'Run the selected Blueprint against approved sources and preserve traceable evidence for every material claim.',
    objective: 'Separate observed facts from inference and missing data.',
    steps: ['Run discovery questions against each approved source.', 'Capture source, query, timestamp, scope, and returned fact.', 'Normalize duplicates without losing attribution.', 'Classify each item as verified, inferred, or unverified.', 'Flag stale, contradictory, incomplete, or permission-limited evidence.', 'Stop when evidence is sufficient for the decision.'],
    outputs: ['Evidence register', 'Source citations', 'Trust classification', 'Explicit evidence gaps'],
    reference: ['No material claim without a source.', 'Do not hide permission failures.', 'Collection ends when the decision can be supported.'],
    prompt: 'Create an evidence register for this Blueprint run. For every fact include source, retrieval time, scope, confidence, affected asset, and the report claim it supports.',
  }),
  workspace('06', 'report-generation', 'Generate the PDF Report', 15, sources.official, {
    summary: 'Transform the evidence set into a concise report for executives, security owners, and technical operators.',
    objective: 'Produce a decision-ready artifact with findings, severity, evidence, ownership, and next actions.',
    steps: ['Write the executive summary around exposure and the decision required.', 'Group findings by severity and control domain.', 'Attach evidence and confidence to every finding.', 'Assign an owner, action, effort range, and target horizon.', 'Include assumptions, gaps, and methodology.', 'Render the branded PDF and inspect every page.'],
    outputs: ['Executive summary', 'Prioritized findings', 'Remediation table', 'Branded PDF report'],
    reference: ['Lead with the decision.', 'Severity combines impact, likelihood, exposure, and control strength.', 'The PDF is the outcome, not a workspace transcript.'],
    prompt: 'Generate an executive security report from this evidence register. Include the decision required, top risks, severity rationale, citations, affected assets, owners, remediation horizons, assumptions, and a technical appendix. Do not invent missing facts.',
  }),
  workspace('07', 'security-review', 'Review Security Findings', 12, sources.policy, {
    summary: 'Challenge every high-impact finding before the report is accepted or shared.',
    objective: 'Make severity, evidence quality, and recommendations defensible with security stakeholders.',
    steps: ['Review critical and high findings with system and security owners.', 'Confirm affected assets, exposure, controls, and impact.', 'Downgrade or remove unsupported, duplicate, or mitigated findings.', 'Escalate contradictory evidence instead of assuming.', 'Check recommendations remain inside the approved boundary.', 'Record decisions and severity changes.'],
    outputs: ['Reviewed findings', 'Severity decisions', 'Accepted risk notes', 'Final approval record'],
    reference: ['High severity requires high-quality evidence.', 'Preserve disagreement when needed.', 'Human review owns final risk acceptance.'],
    prompt: 'Act as a security review board. Challenge each finding for evidence quality, impact, existing controls, severity, ownership, and remediation. Return accepted, revised, rejected, and unresolved findings.',
  }),
  workspace('08', 'remediation-roadmap', 'Build the Remediation Roadmap', 10, sources.official, {
    summary: 'Convert accepted findings into a plan balancing risk reduction, effort, dependencies, and ownership.',
    objective: 'Leave the workshop with a practical 30, 60, and 90-day roadmap.',
    steps: ['Identify immediate containment or validation actions.', 'Group related findings into workstreams.', 'Sequence by risk reduction, dependency, effort, and change control.', 'Assign one owner and completion signal per action.', 'Separate quick wins, architecture changes, and accepted risk.', 'Schedule the next report review.'],
    outputs: ['30-day actions', '60-day control improvements', '90-day architectural work', 'Owners and success measures'],
    reference: ['Every action needs an owner and completion evidence.', 'Do not confuse activity with risk reduction.', 'Repeat the Blueprint after material change.'],
    prompt: 'Turn these accepted findings into a 30, 60, and 90-day remediation roadmap. Show dependencies, owners, completion evidence, and accepted risks.',
  }),
  workspace('09', 'super-skills', 'Super Skills', 8, sources.official, {
    summary: 'Package repeated Blueprint behaviors as reusable Super Skills without hiding evidence or approval boundaries.',
    objective: 'Identify analysis and report behaviors that should become governed reusable capabilities.',
    steps: ['Separate retrieval, analysis, severity scoring, report writing, and planning.', 'Define trigger, inputs, output, and prohibited actions.', 'Keep customer facts in the workspace.', 'Require citations and confidence labels.', 'Version skills when methodology changes.', 'Publish only skills another facilitator can run safely.'],
    outputs: ['Super Skill shortlist', 'Input and output contracts', 'Safety boundaries', 'Publication criteria'],
    reference: ['A skill packages behavior, not customer data.', 'Reusable does not mean autonomous.', 'Skills must expose evidence and uncertainty.'],
    prompt: 'Design the Super Skills required by this Blueprint. For each provide its trigger, inputs, outputs, source requirements, safety boundaries, approval points, and owner.',
  }),
];

export const exercises = [
  practice('configure-workspace', 'Configure the Workshop Workspace', 12, sources.official, {
    summary: 'Create the workspace charter, decision question, owners, and read-only trust boundary.',
    objective: 'Prove the workshop begins with governance and a specific outcome.',
    steps: ['Choose a customer scenario.', 'Write the decision question and audience.', 'Define allowed and prohibited data.', 'Assign sponsor, operator, reviewer, and approver.', 'Confirm the read-only boundary.'],
    outputs: ['Workspace charter', 'Approval map', 'Data boundary'],
    prompt: 'Guide me through a governed workspace setup. Do not continue until the decision, audience, owners, approved data, and read-only boundary are explicit.',
  }),
  practice('connect-mcp', 'Connect Read-Only MCP Sources', 15, sources.mcp, {
    summary: 'Build and validate the minimum MCP connection set for the chosen report.',
    objective: 'Demonstrate least-privilege connectivity with traceable validation evidence.',
    steps: ['List required evidence.', 'Map each type to one MCP server or sample connector.', 'Define minimum scopes.', 'Run a harmless validation query.', 'Remove unnecessary connections.'],
    outputs: ['Connection matrix', 'Scope register', 'Validation results'],
    prompt: 'Create the minimum read-only MCP connection plan and one harmless validation query per source.',
  }),
  practice('run-account-audit', 'Run the Account Audit Blueprint', 20, [...sources.mcp, ...sources.policy], {
    summary: 'Execute the first recommended Blueprint and produce a cited finding register.',
    objective: 'Move from live account evidence to prioritized security findings.',
    steps: ['Confirm account scope.', 'Collect configuration and audit evidence.', 'Classify confidence.', 'Draft findings with severity rationale.', 'Identify missing evidence.'],
    outputs: ['Cited evidence register', 'Prioritized findings', 'Gap list'],
    prompt: 'Run a Cloudflare Account Audit using only approved evidence. Produce findings with severity, affected scope, citation, confidence, and owner. Mark unsupported claims as unverified.',
  }),
  practice('generate-report', 'Produce the Executive PDF', 20, sources.official, {
    summary: 'Convert reviewed findings into a customer-ready executive report.',
    objective: 'Produce an artifact supporting a decision and remediation commitment.',
    steps: ['Write the executive summary.', 'Prioritize findings.', 'Add citations and confidence.', 'Assign owners and horizons.', 'Render and inspect the PDF.'],
    outputs: ['Branded PDF', 'Executive decision statement', 'Remediation table'],
    prompt: 'Turn this finding register into a customer-ready report. Preserve citations, include a 30/60/90-day table, and place technical detail in the appendix.',
  }),
  practice('review-roadmap', 'Approve the Security Roadmap', 15, sources.policy, {
    summary: 'Run a final security and executive review of the report and roadmap.',
    objective: 'Leave with accepted findings, owners, deadlines, and unresolved questions.',
    steps: ['Challenge high-severity findings.', 'Confirm owners and dependencies.', 'Record accepted risk.', 'Preserve unresolved disagreements.', 'Approve the next review date.'],
    outputs: ['Approved roadmap', 'Decision log', 'Unresolved questions', 'Next review date'],
    prompt: 'Review this report as an approval board. Return approved actions, rejected findings, accepted risks, unresolved questions, owners, deadlines, and the next Blueprint run date.',
  }),
];

export const resources = [
  guide('workshop-overview', 'Workshop Overview', sources.official, {
    summary: 'Understand the customer journey from Cloudflare OS installation to an approved security roadmap.',
    objective: 'Align participants on the workshop outcome, sequence, and decision gates.',
    steps: ['Define one decision question.', 'Connect minimum evidence.', 'Run one Blueprint.', 'Review one PDF.', 'Close on owners and next actions.'],
    outputs: ['Shared workshop objective', 'Expected report', 'Definition of done'],
    prompt: 'Summarize this workshop for an executive customer, including the outcome, sequence, controls, and definition of done.',
  }),
  guide('mcp-source-catalog', 'MCP Source Catalog', sources.mcp, {
    summary: 'Select Cloudflare managed MCP servers and Corporate Test Connectors by evidence need.',
    objective: 'Match each report claim to the smallest trustworthy source set.',
    steps: ['Start with Documentation MCP.', 'Use Audit Logs for change evidence.', 'Use CASB for SaaS posture.', 'Use AI Gateway for AI usage.', 'Add GraphQL, Radar, DNS Analytics, Observability, or Builds only when required.'],
    outputs: ['Source-to-evidence map', 'Read-only default', 'Authorization owner'],
    prompt: 'Recommend the minimum MCP set for this report and explain evidence, authorization, and action capability for each server.',
  }),
  guide('blueprint-selection-guide', 'Blueprint Selection Guide', sources.policy, {
    summary: 'Choose Account Audit, Attack Surface and Risk, or AI Governance Readiness.',
    objective: 'Select the report producing the strongest decision with available evidence.',
    steps: ['Identify the decision.', 'Identify the risk domain.', 'Confirm evidence.', 'Choose depth and deadline.', 'Record gaps and alternatives.'],
    outputs: ['Blueprint decision', 'Rationale', 'Alternative path'],
    prompt: 'Compare the three recommended Blueprints using decision relevance, evidence availability, urgency, and remediation ownership.',
  }),
  guide('report-quality-checklist', 'Report Quality Checklist', sources.official, {
    summary: 'Apply a release gate to every evidence-backed customer PDF.',
    objective: 'Prevent unsupported findings, unclear severity, missing owners, and unusable advice.',
    steps: ['Verify citations.', 'Confirm severity rationale.', 'Check scope and dates.', 'Require owners and horizons.', 'Inspect PDF layout and links.', 'Remove internal-only language.'],
    outputs: ['Release decision', 'Defect list', 'Approved PDF'],
    prompt: 'Audit this report for evidence, severity, customer-safe language, ownership, remediation clarity, and PDF presentation. Return blocking and non-blocking issues.',
  }),
  guide('security-guardrails', 'Security and Governance Guardrails', sources.policy, {
    summary: 'Apply non-negotiable controls for data, MCP authorization, approval, and report sharing.',
    objective: 'Keep the workshop useful without bypassing identity, privacy, or change control.',
    steps: ['Use least privilege and read-only access.', 'Never treat MCP as an entitlement bypass.', 'Keep secrets out of prompts and reports.', 'Require approval for writes and risk acceptance.', 'Record uncertainty and access failures.', 'Share only with the approved audience.'],
    outputs: ['Guardrail checklist', 'Approval gates', 'Escalation path'],
    prompt: 'Evaluate this workshop against least privilege, minimization, traceability, approval, risk acceptance, retention, and report-sharing controls.',
  }),
  guide('advanced-deployment', 'Advanced Deployment', sources.deployment, {
    summary: 'Use the custom deployment path only when the hosted workers.dev workspace cannot meet a confirmed requirement.',
    objective: 'Scope a custom domain, custom Gatekeeper, and named Worker deployment without attempting it during the live workshop.',
    steps: ['Confirm the hosted path is insufficient.', 'Document the custom domain and identity requirements.', 'Assign an engineering owner.', 'Review the cloudflare-os-starter deployment configuration.', 'Plan Access, secrets, rollback, and validation.', 'Execute after the workshop through normal change control.'],
    outputs: ['Confirmed custom requirement', 'Engineering owner', 'Deployment and rollback plan'],
    prompt: 'Create an advanced Cloudflare OS deployment plan for a custom domain and Gatekeeper. Include prerequisites, ownership, Access, secrets, validation, rollback, and change-control gates.',
  }),
];
