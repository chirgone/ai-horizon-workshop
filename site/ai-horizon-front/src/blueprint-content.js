const coreAccountConnections = [
  { name: 'Cloudflare API MCP', binding: 'MCP_CLOUDFLARE', endpoint: 'https://mcp.cloudflare.com/mcp', purpose: 'GET-only account, zone, Workers, D1, KV, and R2 inventory', access: 'Required, sandbox read-only OAuth' },
  { name: 'Audit Logs MCP', binding: 'MCP_AUDITLOGS', endpoint: 'https://auditlogs.mcp.cloudflare.com/mcp', purpose: 'Actor and configuration-change evidence', access: 'Required, approval-gated query' },
  { name: 'Workers Observability MCP', binding: 'MCP_OBSERVABILITY', endpoint: 'https://observability.mcp.cloudflare.com/mcp', purpose: 'Worker inventory, code, logs, and metrics', access: 'Required, read-only and approval-gated queries' },
];

import templateIndex from '../../../blueprints/templates/index.json' with { type: 'json' };

const blueprintArchiveUrl = (file) => `https://raw.githubusercontent.com/chirgone/ai-horizon-workshop/main/blueprints/${file}`;
export const blueprintTemplateUrl = (slug) => `https://github.com/chirgone/ai-horizon-workshop/blob/main/blueprints/templates/${slug}.md`;
export const blueprintTemplateRawUrl = (slug) => `https://raw.githubusercontent.com/chirgone/ai-horizon-workshop/main/blueprints/templates/${slug}.md`;

const templateBySlug = Object.fromEntries(templateIndex.templates.map((template) => [template.slug, template]));

export function getBlueprintTemplate(slug) {
  return templateBySlug[slug] || null;
}
const planningConnection = (name, binding, purpose) => ({
  name,
  binding,
  endpoint: 'Environment-approved MCP endpoint',
  purpose,
  access: 'Planned, validate read-only scope and endpoint before publication',
});

const graphqlAnalyticsConnection = planningConnection('Cloudflare GraphQL Analytics MCP', 'MCP_GRAPHQL', 'Security, DNS, AI Gateway, and traffic analytics evidence.');
const casbConnection = planningConnection('CASB MCP', 'MCP_CASB', 'SaaS posture, Shadow IT, and control coverage evidence.');
const radarConnection = planningConnection('Cloudflare Radar MCP', 'MCP_RADAR', 'Global Internet traffic, routing, attack, and outage evidence.');
const dnsAnalyticsConnection = planningConnection('DNS Analytics MCP', 'MCP_DNS_ANALYTICS', 'DNS health, latency, and query-pattern evidence.');
const dexConnection = planningConnection('DEX MCP', 'MCP_DEX', 'Digital experience and device posture evidence for Zero Trust readiness.');
const aiGatewayConnection = planningConnection('AI Gateway MCP', 'MCP_AI_GATEWAY', 'Model usage, prompt, routing, latency, and cost evidence.');
const workersBuildsConnection = planningConnection('Workers Builds MCP', 'MCP_WORKERS_BUILDS', 'Build, release, and deployment evidence for Workers services.');

const sharedSkillSlugs = ['evidence-register-builder', 'severity-rationale-reviewer', 'executive-summary-writer', 'remediation-roadmap-planner', 'report-quality-gate-auditor'];

function buildInstallSteps(archive, connections) {
  if (!archive) {
    return [
      'This Blueprint does not have a published .gadget package yet.',
      'Review the required inputs, MCP connection plan, and evidence requirements on this page.',
      'Build and validate the package before trying to install it in Cloudflare OS.',
    ];
  }

  return [
    'Sign in to your Cloudflare OS workspace.',
    'In the left navigation open Blueprints.',
    `Select Upload and choose ${archive.file}.`,
    `Reconnect the required MCP sources: ${connections.map(({ binding }) => binding).join(', ')}. Use the minimum read-only access boundary for each one.`,
    'Create a workspace from the imported Blueprint and run one harmless validation read before generating the report.',
  ];
}

function buildInstallPrompt(title, archive, connections) {
  const archiveInstruction = archive
    ? `I already have the file ${archive.file}.`
    : 'The .gadget package is not published yet, so help me prepare the requirements and validation steps first.';

  return `Help me install the ${title} in Cloudflare OS. ${archiveInstruction} Walk me step by step from the left navigation to Blueprints, then Upload, then reconnect these MCP bindings with minimum read-only access: ${connections.map(({ binding }) => binding).join(', ')}. After that, guide me to create a workspace from the imported Blueprint and run one harmless validation read per source before I generate the report. Stop and ask me for confirmation before any action that changes scope or access.`;
}

export const blueprints = [
  {
    slug: 'account-audit',
    title: 'Cloudflare Account Audit Report',
    category: 'Security posture',
    duration: '30-45 min',
    maturity: 'Workshop ready',
    summary: 'Assess account configuration, identify control gaps, and prioritize remediation with cited evidence.',
    decision: 'Which account risks should we remediate first, who owns them, and what evidence supports that priority?',
    outcome: 'An executive PDF with account scope, prioritized findings, evidence citations, owners, and a 30/60/90-day roadmap.',
    inputs: [
      'Cloudflare account and zone scope',
      'Named security owner and report audience',
      'Approved read-only access boundary',
      'Decision deadline and remediation horizon',
    ],
    connections: coreAccountConnections,
    evidence: [
      'Account and zone configuration relevant to the approved scope',
      'Recent administrative changes and actor attribution',
      'Observed traffic or security signals supporting material findings',
      'Explicit gaps where access or evidence is unavailable',
    ],
    reportSections: ['Executive decision', 'Scope and methodology', 'Prioritized findings', '30/60/90-day roadmap', 'Evidence appendix'],
    guardrails: ['No configuration writes', 'No material claim without a citation', 'Human review owns final severity and risk acceptance'],
    connectorSlugs: ['flareid-identity', 'nexus-wiki'],
    connectorPurposes: {
      'flareid-identity': 'Test identity and group-claim boundaries.',
      'nexus-wiki': 'Test policy and control-ownership retrieval.',
    },
    skillSlugs: sharedSkillSlugs,
    nextPath: '/exercises/run-account-audit',
    archive: {
      id: 'a660d093a214642093491ec9bb9f5511',
      file: 'Cloudflare-Account-Audit-Blueprint-v1.gadget',
      publicUrl: blueprintArchiveUrl('Cloudflare-Account-Audit-Blueprint-v1.gadget'),
    },
    installSteps: buildInstallSteps({
      file: 'Cloudflare-Account-Audit-Blueprint-v1.gadget',
    }, coreAccountConnections),
    installPrompt: buildInstallPrompt('Cloudflare Account Audit Report', {
      file: 'Cloudflare-Account-Audit-Blueprint-v1.gadget',
    }, coreAccountConnections),
  },
  {
    slug: 'attack-surface-risk',
    title: 'Attack Surface and Risk Report',
    category: 'External exposure',
    duration: '35-50 min',
    maturity: 'Workshop ready',
    summary: 'Map exposed services, validate external risk signals, and sequence controls that reduce reachable attack paths.',
    decision: 'Which externally reachable assets create the most material risk, and which control changes reduce it fastest?',
    outcome: 'A cited attack surface PDF with exposed assets, risk paths, control coverage, owners, and sequenced reduction actions.',
    inputs: [
      'Approved domains, zones, and IP ranges',
      'Known business-critical applications',
      'Security owner and application owner',
      'Allowed external discovery boundary',
    ],
    connections: coreAccountConnections,
    evidence: [
      'Externally reachable hostnames and services inside scope',
      'Traffic, DNS, and threat signals linked to exposed assets',
      'Existing edge controls and verified coverage gaps',
      'Unknown ownership, stale assets, and contradictory evidence',
    ],
    reportSections: ['Executive exposure summary', 'Asset and service inventory', 'Risk paths', 'Control coverage', 'Sequenced reduction plan'],
    guardrails: ['Passive and approved discovery only', 'No scanning outside the defined boundary', 'Asset owners validate critical exposure before release'],
    connectorSlugs: ['pipeline-crm', 'nexus-wiki', 'flareid-identity'],
    connectorPurposes: {
      'pipeline-crm': 'Test business criticality and account-owner context.',
      'nexus-wiki': 'Test architecture and asset-ownership evidence.',
      'flareid-identity': 'Test identity context for exposed applications.',
    },
    skillSlugs: sharedSkillSlugs,
    nextPath: '/lessons/evidence-collection',
    archive: {
      id: 'e0560255a5337e605efbfc0ad0e88131',
      file: 'Cloudflare-Attack-Surface-Risk-Blueprint-v1.gadget',
      publicUrl: blueprintArchiveUrl('Cloudflare-Attack-Surface-Risk-Blueprint-v1.gadget'),
    },
    installSteps: buildInstallSteps({
      file: 'Cloudflare-Attack-Surface-Risk-Blueprint-v1.gadget',
    }, coreAccountConnections),
    installPrompt: buildInstallPrompt('Attack Surface and Risk Report', {
      file: 'Cloudflare-Attack-Surface-Risk-Blueprint-v1.gadget',
    }, coreAccountConnections),
  },
  {
    slug: 'security-misconfiguration',
    title: 'Security Misconfiguration Report',
    category: 'Security posture',
    duration: '35-50 min',
    maturity: 'Planning candidate',
    summary: 'Identify missing, weak, or inconsistent security controls across the approved Cloudflare account scope.',
    decision: 'Which misconfigurations create the most material risk, and which remediations should land first?',
    outcome: 'A cited security posture PDF with product-level gaps, severity, business impact, and prioritized remediation actions.',
    inputs: [
      'Approved account and zone scope',
      'Named security owner and change authority',
      'Critical applications and known control dependencies',
      'Remediation horizon and release audience',
    ],
    connections: [coreAccountConnections[0], coreAccountConnections[1], casbConnection],
    evidence: [
      'Current security-product configuration inside the approved scope',
      'Change history and actor attribution for material settings',
      'Observed coverage gaps, exceptions, and inconsistent policy states',
      'Explicit evidence gaps where a control cannot be validated',
    ],
    reportSections: ['Executive risk summary', 'Scope and product coverage', 'Misconfiguration findings', 'Remediation priorities', 'Evidence appendix'],
    guardrails: ['No configuration writes', 'No severity without cited evidence', 'Control owners validate operational impact before release'],
    connectorSlugs: [],
    connectorPurposes: {},
    skillSlugs: sharedSkillSlugs,
    nextPath: '/lessons/security-review',
    installSteps: buildInstallSteps(null, [coreAccountConnections[0], coreAccountConnections[1], casbConnection]),
    installPrompt: buildInstallPrompt('Security Misconfiguration Report', null, [coreAccountConnections[0], coreAccountConnections[1], casbConnection]),
  },
  {
    slug: 'ai-governance-readiness',
    title: 'AI Governance Readiness Report',
    category: 'AI governance',
    duration: '35-50 min',
    maturity: 'Workshop ready',
    summary: 'Evaluate observed AI usage, policy coverage, visibility, and control ownership before scaling enterprise adoption.',
    decision: 'Where can the organization safely scale AI, and which governance gaps must close before broader adoption?',
    outcome: 'An AI governance PDF with maturity findings, observed usage, policy gaps, control owners, and an adoption roadmap.',
    inputs: [
      'Approved AI application and team scope',
      'Current AI policy or stated operating principles',
      'Security, legal, and data governance owners',
      'Target AI use cases and adoption timeline',
    ],
    connections: coreAccountConnections,
    evidence: [
      'Observed AI applications, models, teams, and usage patterns',
      'Policy controls mapped to actual technical visibility',
      'Data handling, logging, and ownership gaps',
      'Unobserved or unverified usage recorded as an explicit limitation',
    ],
    reportSections: ['Executive readiness decision', 'Observed AI landscape', 'Governance maturity', 'Control gaps', 'Adoption roadmap'],
    guardrails: ['Do not collect prompt content unless explicitly approved', 'Minimize personal and sensitive data', 'Legal and security owners approve policy conclusions'],
    connectorSlugs: ['workweek-hr', 'relay-collaboration', 'nexus-wiki', 'flareid-identity'],
    connectorPurposes: {
      'workweek-hr': 'Test directory-safe ownership and organization context.',
      'relay-collaboration': 'Test user-scoped collaboration evidence.',
      'nexus-wiki': 'Test AI policy and architecture retrieval.',
      'flareid-identity': 'Test identity and group-based governance boundaries.',
    },
    skillSlugs: sharedSkillSlugs,
    nextPath: '/lessons/security-review',
    archive: {
      id: 'be0245465a9dda3f08ff91b6920f2a33',
      file: 'Cloudflare-AI-Governance-Readiness-Blueprint-v1.gadget',
      publicUrl: blueprintArchiveUrl('Cloudflare-AI-Governance-Readiness-Blueprint-v1.gadget'),
    },
    installSteps: buildInstallSteps({
      file: 'Cloudflare-AI-Governance-Readiness-Blueprint-v1.gadget',
    }, coreAccountConnections),
    installPrompt: buildInstallPrompt('AI Governance Readiness Report', {
      file: 'Cloudflare-AI-Governance-Readiness-Blueprint-v1.gadget',
    }, coreAccountConnections),
  },
  {
    slug: 'waf-bot-effectiveness',
    title: 'WAF and Bot Protection Effectiveness Report',
    category: 'Application security',
    duration: '35-50 min',
    maturity: 'Planning candidate',
    summary: 'Evaluate whether WAF, Bot Management, API Shield, and rate limiting are covering the highest-risk paths.',
    decision: 'Which Internet-facing paths remain under-protected, and which controls reduce exploitability fastest?',
    outcome: 'A cited application-protection PDF with blocked attacks, missing coverage, exposed endpoints, and remediation recommendations.',
    inputs: [
      'Approved zones, hostnames, and API scope',
      'Known critical applications and high-value endpoints',
      'Named application security owner',
      'Observation window for attack and traffic signals',
    ],
    connections: [coreAccountConnections[0], graphqlAnalyticsConnection, radarConnection],
    evidence: [
      'Observed attack, request, and bot patterns for scoped applications',
      'Current WAF, Bot Management, API Shield, and rate-limiting coverage',
      'Known gaps, bypass paths, and exceptions that weaken protection',
      'Control tuning opportunities supported by cited traffic evidence',
    ],
    reportSections: ['Executive protection summary', 'Scoped applications and endpoints', 'Observed attack patterns', 'Coverage gaps and vulnerable paths', 'Recommended control changes'],
    guardrails: ['No active testing without approval', 'Differentiate blocked traffic from assumed exposure', 'Application owners review high-impact recommendations before release'],
    connectorSlugs: [],
    connectorPurposes: {},
    skillSlugs: sharedSkillSlugs,
    nextPath: '/lessons/evidence-collection',
    installSteps: buildInstallSteps(null, [coreAccountConnections[0], graphqlAnalyticsConnection, radarConnection]),
    installPrompt: buildInstallPrompt('WAF and Bot Protection Effectiveness Report', null, [coreAccountConnections[0], graphqlAnalyticsConnection, radarConnection]),
  },
  {
    slug: 'zero-trust-readiness',
    title: 'Zero Trust Readiness Report',
    category: 'Zero Trust',
    duration: '35-50 min',
    maturity: 'Planning candidate',
    summary: 'Assess readiness for Access, Gateway, DLP, CASB, and device posture before scaling Zero Trust controls.',
    decision: 'What blocks Zero Trust rollout today, and which sequence closes the highest-value gaps first?',
    outcome: 'A Zero Trust readiness PDF with access gaps, unprotected apps, posture findings, and a phased rollout roadmap.',
    inputs: [
      'Approved application and user-population scope',
      'Named Zero Trust owner and endpoint owner',
      'Current identity, device, and remote-access assumptions',
      'Target rollout horizon and control priorities',
    ],
    connections: [coreAccountConnections[0], dexConnection, casbConnection, coreAccountConnections[1]],
    evidence: [
      'Applications, users, and access paths inside the approved scope',
      'Current Access, Gateway, DLP, CASB, and posture coverage',
      'Gaps in identity, device trust, or policy enforcement',
      'Explicit exclusions and unvalidated device or user segments',
    ],
    reportSections: ['Executive readiness decision', 'Scoped applications and users', 'Access and posture findings', 'Zero Trust control gaps', 'Phased rollout roadmap'],
    guardrails: ['No user-content collection beyond approved scope', 'Separate observed controls from target-state recommendations', 'Identity and endpoint owners review rollout assumptions'],
    connectorSlugs: [],
    connectorPurposes: {},
    skillSlugs: sharedSkillSlugs,
    nextPath: '/lessons/remediation-roadmap',
    installSteps: buildInstallSteps(null, [coreAccountConnections[0], dexConnection, casbConnection, coreAccountConnections[1]]),
    installPrompt: buildInstallPrompt('Zero Trust Readiness Report', null, [coreAccountConnections[0], dexConnection, casbConnection, coreAccountConnections[1]]),
  },
  {
    slug: 'ai-gateway-usage-cost',
    title: 'AI Gateway Usage and Cost Report',
    category: 'AI operations',
    duration: '30-45 min',
    maturity: 'Planning candidate',
    summary: 'Analyze model consumption, latency, errors, caching, and provider routing to improve AI reliability and cost.',
    decision: 'Which routing, caching, and model choices reduce cost without weakening reliability or governance?',
    outcome: 'An AI operations PDF with usage patterns, cost drivers, failure modes, and guardrail recommendations.',
    inputs: [
      'Approved AI Gateway scope and observation window',
      'Named AI platform owner and finance reviewer',
      'Critical applications or workflows using AI',
      'Target cost and latency objectives',
    ],
    connections: [aiGatewayConnection, graphqlAnalyticsConnection],
    evidence: [
      'Model, provider, and route-level usage inside scope',
      'Latency, error, and caching patterns tied to user experience or cost',
      'Routing decisions, fallback paths, and concentration risks',
      'Observed opportunities for guardrails, caching, or provider diversification',
    ],
    reportSections: ['Executive optimization summary', 'Usage and provider profile', 'Cost and latency drivers', 'Reliability and routing findings', 'Optimization roadmap'],
    guardrails: ['Do not expose prompt content unless explicitly approved', 'Separate direct cost evidence from inferred savings', 'Platform owners validate material routing changes before release'],
    connectorSlugs: [],
    connectorPurposes: {},
    skillSlugs: sharedSkillSlugs,
    nextPath: '/lessons/report-generation',
    installSteps: buildInstallSteps(null, [aiGatewayConnection, graphqlAnalyticsConnection]),
    installPrompt: buildInstallPrompt('AI Gateway Usage and Cost Report', null, [aiGatewayConnection, graphqlAnalyticsConnection]),
  },
  {
    slug: 'workers-observability-reliability',
    title: 'Workers Observability and Reliability Report',
    category: 'Developer platform',
    duration: '35-50 min',
    maturity: 'Planning candidate',
    summary: 'Review Workers health, deployments, logs, latency, and failure patterns across the approved service scope.',
    decision: 'Which services or deployment patterns create the highest reliability risk, and what corrective actions come first?',
    outcome: 'A reliability PDF with service-level findings, failed deployments, latency concerns, and corrective actions.',
    inputs: [
      'Approved Worker services and environments',
      'Named engineering owner and review audience',
      'Observation window for incidents and deployments',
      'Production-criticality and recovery expectations',
    ],
    connections: [coreAccountConnections[2], workersBuildsConnection, graphqlAnalyticsConnection],
    evidence: [
      'Worker-level error, latency, and log evidence inside scope',
      'Deployment outcomes, rollback patterns, and build failures',
      'Concentration of incidents by service, route, or release window',
      'Explicit limitations where observability is missing or incomplete',
    ],
    reportSections: ['Executive reliability summary', 'Scoped services and environments', 'Error and latency findings', 'Deployment and build findings', 'Corrective action plan'],
    guardrails: ['No production writes or rollbacks', 'Do not overstate root cause without evidence', 'Engineering owners review service-critical conclusions before release'],
    connectorSlugs: [],
    connectorPurposes: {},
    skillSlugs: sharedSkillSlugs,
    nextPath: '/lessons/security-review',
    installSteps: buildInstallSteps(null, [coreAccountConnections[2], workersBuildsConnection, graphqlAnalyticsConnection]),
    installPrompt: buildInstallPrompt('Workers Observability and Reliability Report', null, [coreAccountConnections[2], workersBuildsConnection, graphqlAnalyticsConnection]),
  },
  {
    slug: 'dns-internet-performance',
    title: 'DNS and Internet Performance Report',
    category: 'Internet performance',
    duration: '30-45 min',
    maturity: 'Planning candidate',
    summary: 'Evaluate DNS health, query behavior, latency, configuration quality, and global Internet performance signals.',
    decision: 'Which DNS and Internet-performance issues deserve immediate action, and which need ongoing monitoring?',
    outcome: 'A DNS and Internet-performance PDF with critical zones, regional patterns, and prioritized recommendations.',
    inputs: [
      'Approved zones, domains, and observation window',
      'Named DNS owner and report audience',
      'Known business-critical domains or regional dependencies',
      'Performance objective or customer-facing concern',
    ],
    connections: [dnsAnalyticsConnection, radarConnection, graphqlAnalyticsConnection],
    evidence: [
      'DNS health, latency, and query trends inside scope',
      'Regional Internet signals affecting customer experience or resilience',
      'Configuration patterns linked to performance or failure risk',
      'Unknown or unverified DNS dependencies called out explicitly',
    ],
    reportSections: ['Executive performance summary', 'Scoped zones and regions', 'DNS health findings', 'Regional Internet observations', 'Improvement recommendations'],
    guardrails: ['No active DNS changes', 'Keep Radar and zone-specific evidence clearly separated', 'DNS owners validate business-critical assumptions before release'],
    connectorSlugs: [],
    connectorPurposes: {},
    skillSlugs: sharedSkillSlugs,
    nextPath: '/lessons/evidence-collection',
    installSteps: buildInstallSteps(null, [dnsAnalyticsConnection, radarConnection, graphqlAnalyticsConnection]),
    installPrompt: buildInstallPrompt('DNS and Internet Performance Report', null, [dnsAnalyticsConnection, radarConnection, graphqlAnalyticsConnection]),
  },
  {
    slug: 'compliance-evidence-pack',
    title: 'Compliance Evidence Pack',
    category: 'Compliance',
    duration: '30-45 min',
    maturity: 'Planning candidate',
    summary: 'Assemble evidence for internal or regulatory audit with cited controls, changes, exceptions, and administrative access records.',
    decision: 'What evidence is audit-ready today, what is missing, and which exceptions require explicit owner action?',
    outcome: 'An evidence pack with configured controls, recent changes, access records, open exceptions, and exportable references.',
    inputs: [
      'Approved control framework or audit objective',
      'Named compliance owner and reviewer',
      'Relevant accounts, zones, or products in scope',
      'Target audit window and delivery deadline',
    ],
    connections: [coreAccountConnections[0], coreAccountConnections[1], casbConnection, graphqlAnalyticsConnection],
    evidence: [
      'Configured controls mapped to the approved audit objective',
      'Recent administrative changes with actor attribution',
      'Administrative access, exceptions, and compensating controls',
      'Explicit missing evidence or controls that need owner follow-up',
    ],
    reportSections: ['Audit objective and scope', 'Control evidence summary', 'Administrative access and changes', 'Exceptions and gaps', 'Export package index'],
    guardrails: ['Do not claim certification or compliance status without owner approval', 'Preserve exact evidence timestamps and scope', 'Compliance owners validate final mapping before release'],
    connectorSlugs: [],
    connectorPurposes: {},
    skillSlugs: sharedSkillSlugs,
    nextPath: '/lessons/report-generation',
    installSteps: buildInstallSteps(null, [coreAccountConnections[0], coreAccountConnections[1], casbConnection, graphqlAnalyticsConnection]),
    installPrompt: buildInstallPrompt('Compliance Evidence Pack', null, [coreAccountConnections[0], coreAccountConnections[1], casbConnection, graphqlAnalyticsConnection]),
  },
  {
    slug: 'radar-intelligence',
    title: 'Cloudflare Radar Intelligence Report',
    category: 'Internet intelligence',
    duration: '30-45 min',
    maturity: 'Workshop ready',
    summary: 'Assess a domain, IP address, ASN, or country with traceable Radar evidence, geographic comparison, explicit limitations, and a monitoring roadmap.',
    decision: 'What does Cloudflare Radar directly show about this target, what remains unknown, and what should the team monitor next?',
    outcome: 'A draft intelligence PDF separating direct evidence, evidence gaps, tool errors, unevaluated checks, geographic context, and next monitoring actions.',
    inputs: [
      'One target type: domain, IP address, ASN, or country',
      'Exact target value and a fixed observation window',
      'Optional comparison country recorded separately from the target',
      'Named analyst, reviewer, and report audience',
    ],
    connections: [
      { name: 'Cloudflare Radar MCP', binding: 'MCP_RADAR', endpoint: 'https://radar.mcp.cloudflare.com/mcp', purpose: 'Global Internet traffic, routing, attack, outage, domain, IP, ASN, and country evidence', access: 'Required, named read-only tools only' },
    ],
    evidence: [
      'Target-specific results returned by a named Radar MCP tool',
      'Exact tool, parameters, target, time window, and retrieval timestamp',
      'Geographic comparison stored separately from target evidence',
      'Unsupported, failed, or intentionally skipped checks labeled explicitly',
    ],
    reportSections: ['Executive intelligence summary', 'Target and observation window', 'Direct evidence', 'Geographic comparison', 'Findings and limitations', 'Monitoring roadmap'],
    guardrails: ['Never enable create_url_scan', 'Do not attribute country-level HTTP, DNS, or L7 data to a domain', 'Keep status as Draft, review required until human review'],
    connectorSlugs: [],
    connectorPurposes: {},
    skillSlugs: sharedSkillSlugs,
    nextPath: '/lessons/evidence-collection',
    archive: {
      id: 'ffa228495739ffec22cceafc9b80d8fc',
      file: 'Cloudflare-Radar-Intelligence-Blueprint-v1.gadget',
      publicUrl: blueprintArchiveUrl('Cloudflare-Radar-Intelligence-Blueprint-v1.gadget'),
    },
    installSteps: buildInstallSteps({
      file: 'Cloudflare-Radar-Intelligence-Blueprint-v1.gadget',
    }, [radarConnection]),
    installPrompt: buildInstallPrompt('Cloudflare Radar Intelligence Report', {
      file: 'Cloudflare-Radar-Intelligence-Blueprint-v1.gadget',
    }, [radarConnection]),
  },
];

export function getBlueprint(slug) {
  return blueprints.find((blueprint) => blueprint.slug === slug);
}
