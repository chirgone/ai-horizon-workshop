import { blueprints, getBlueprint } from './blueprint-content.js';

export const reportSeverities = ['Critical', 'High', 'Medium', 'Low', 'Informational'];
export const reportHorizons = ['Immediate', '30 days', '60 days', '90 days', 'Accepted risk'];
const standardEvidenceClassifications = ['Verified', 'High', 'Medium', 'Low'];
const radarEvidenceClassifications = ['Direct evidence', 'Evidence gap', 'Tool error', 'Not evaluated'];
export const reportConfidences = [...standardEvidenceClassifications, ...radarEvidenceClassifications];

const sharedGates = [
  'Every material finding has a specific evidence citation.',
  'Severity has been challenged by the security owner.',
  'Every action has one accountable owner and target horizon.',
  'Assumptions, access failures, and evidence gaps are visible.',
  'The approved audience and sharing boundary are confirmed.',
];

const templateDetails = {
  'account-audit': {
    label: 'Cloudflare Account Audit Report',
    accent: 'Account posture',
    methodology: 'Configuration posture, observed changes, control coverage, and cited account evidence.',
    findingsSection: 'Prioritized findings',
    sectionPrompts: [
      'State the account decision and risk-reduction commitment required.',
      'Define account and zone scope, review dates, exclusions, and methodology.',
      'Summarize how the evidence-backed findings are prioritized.',
      'Describe the 30, 60, and 90-day sequencing and dependencies.',
      'Explain the evidence register, source limitations, and citation method.',
    ],
    evidenceClassifications: standardEvidenceClassifications,
  },
  'security-misconfiguration': {
    label: 'Security misconfiguration assessment',
    accent: 'Security posture',
    methodology: 'Scoped product configuration, change evidence, coverage validation, and prioritized remediation based on direct findings.',
    findingsSection: 'Misconfiguration findings',
    sectionPrompts: [
      'State the material security risk and the remediation decision required.',
      'Define the scoped products, zones, accounts, exclusions, and review window.',
      'Summarize the highest-impact misconfigurations with direct evidence.',
      'Explain severity, operational impact, and dependencies for each prioritized issue.',
      'Sequence the remediation work by owner and horizon.',
    ],
    evidenceClassifications: standardEvidenceClassifications,
  },
  'attack-surface-risk': {
    label: 'Attack surface review',
    accent: 'External exposure',
    methodology: 'Reachable assets, risk paths, observed signals, control coverage, and owner validation.',
    findingsSection: 'Risk paths',
    sectionPrompts: [
      'State the material exposure and executive decision required.',
      'Describe the approved asset and service inventory, ownership, and exclusions.',
      'Explain the prioritized paths from external reachability to business impact.',
      'Assess verified controls, coverage gaps, and compensating measures.',
      'Sequence the actions that reduce reachable risk fastest.',
    ],
    evidenceClassifications: standardEvidenceClassifications,
  },
  'waf-bot-effectiveness': {
    label: 'WAF and bot protection assessment',
    accent: 'Application protection',
    methodology: 'Observed attack activity, protection coverage, endpoint exposure, and control-tuning opportunities across scoped applications.',
    findingsSection: 'Coverage gaps and vulnerable paths',
    sectionPrompts: [
      'State the main protection decision and the most material exposed path.',
      'Define the scoped applications, endpoints, and observation window.',
      'Summarize observed attack, bot, or abuse patterns with evidence.',
      'Assess current WAF, Bot, API Shield, and rate-limiting coverage and gaps.',
      'Sequence the protection changes that reduce exploitability fastest.',
    ],
    evidenceClassifications: standardEvidenceClassifications,
  },
  'zero-trust-readiness': {
    label: 'Zero Trust readiness assessment',
    accent: 'Zero Trust',
    methodology: 'Scoped application access, posture evidence, policy coverage, and rollout sequencing for Zero Trust adoption.',
    findingsSection: 'Zero Trust control gaps',
    sectionPrompts: [
      'State the readiness decision and the highest-value gap blocking rollout.',
      'Define the applications, users, devices, and scope limitations.',
      'Assess current Access, Gateway, DLP, CASB, and posture coverage.',
      'Summarize the evidence-backed access and posture gaps.',
      'Sequence the phased rollout plan by owner and control dependency.',
    ],
    evidenceClassifications: standardEvidenceClassifications,
  },
  'ai-governance-readiness': {
    label: 'AI governance assessment',
    accent: 'Governance readiness',
    methodology: 'Observed AI usage, policy coverage, technical visibility, ownership, and adoption controls.',
    findingsSection: 'Control gaps',
    sectionPrompts: [
      'State the readiness decision and conditions for scaling AI safely.',
      'Describe observed applications, models, teams, and known visibility gaps.',
      'Assess current governance maturity, ownership, and policy coverage.',
      'Summarize the evidence-backed gaps blocking safe adoption.',
      'Sequence the governance and technical actions required for adoption.',
    ],
    evidenceClassifications: standardEvidenceClassifications,
  },
  'ai-gateway-usage-cost': {
    label: 'AI Gateway operations assessment',
    accent: 'AI operations',
    methodology: 'Model and provider usage, routing behavior, latency, errors, caching, and cost signals inside the approved scope.',
    findingsSection: 'Reliability and routing findings',
    sectionPrompts: [
      'State the optimization decision and the strongest cost or reliability driver.',
      'Define scoped routes, providers, applications, and observation dates.',
      'Summarize usage, provider concentration, and caching behavior with evidence.',
      'Assess latency, error, and routing patterns affecting cost or resilience.',
      'Sequence the optimization and guardrail changes recommended next.',
    ],
    evidenceClassifications: standardEvidenceClassifications,
  },
  'workers-observability-reliability': {
    label: 'Workers reliability assessment',
    accent: 'Developer platform',
    methodology: 'Worker service health, deployment outcomes, logs, and performance patterns across the approved service scope.',
    findingsSection: 'Error and latency findings',
    sectionPrompts: [
      'State the reliability decision and the most material affected service.',
      'Define the scoped services, environments, and review window.',
      'Summarize service-level error, latency, and incident evidence.',
      'Assess deployment, rollback, and build patterns contributing to instability.',
      'Sequence the corrective actions by service owner and urgency.',
    ],
    evidenceClassifications: standardEvidenceClassifications,
  },
  'dns-internet-performance': {
    label: 'DNS and Internet performance assessment',
    accent: 'Internet performance',
    methodology: 'DNS health, regional Internet signals, configuration patterns, and performance evidence inside the approved scope.',
    findingsSection: 'DNS health findings',
    sectionPrompts: [
      'State the performance decision and the most material DNS or regional issue.',
      'Define the zones, regions, dates, and known customer-facing dependencies.',
      'Summarize DNS health, latency, and query-pattern evidence.',
      'Assess regional Internet observations and configuration concerns separately.',
      'Sequence the recommendations for resilience, performance, and monitoring.',
    ],
    evidenceClassifications: standardEvidenceClassifications,
  },
  'compliance-evidence-pack': {
    label: 'Compliance evidence pack',
    accent: 'Compliance',
    methodology: 'Control evidence, access records, change history, and exceptions mapped to the approved audit objective.',
    findingsSection: 'Exceptions and gaps',
    sectionPrompts: [
      'State the audit objective, delivery decision, and most important missing evidence.',
      'Define the controls, products, accounts, and dates in scope.',
      'Summarize the strongest configured-control evidence and exact sources.',
      'Assess administrative access, recent changes, and open exceptions.',
      'Define the export package structure and owner actions for missing evidence.',
    ],
    evidenceClassifications: standardEvidenceClassifications,
  },
  'account-utilization-contracted-products': {
    label: 'Account utilization assessment',
    accent: 'Account strategy',
    methodology: 'Observed product usage, operational coverage, approved entitlement evidence, and owner follow-up for adoption gaps.',
    findingsSection: 'Inactive or underused capabilities',
    sectionPrompts: [
      'State the utilization decision and the highest-value ownership or adoption gap.',
      'Define the approved account scope, product inventory source, and observation window.',
      'Summarize observed adoption and usage by product with cited evidence.',
      'Assess inactive, underused, or unowned capabilities without overstating commercial conclusions.',
      'Sequence the owner follow-up actions and next review date.',
    ],
    evidenceClassifications: standardEvidenceClassifications,
  },
  'radar-intelligence': {
    label: 'Cloudflare Radar Intelligence Report',
    accent: 'Internet intelligence',
    methodology: 'Named Radar tools, explicit targets and time windows, separated geographic comparison, and exact evidence classifications.',
    findingsSection: 'Findings and limitations',
    sectionPrompts: [
      'State what Radar directly shows, the decision required, and the most important limitation.',
      'Record the target type, exact target value, observation window, comparison geography, and retrieval time.',
      'List only facts returned by named Radar tools, with parameters and citations.',
      'Keep comparison-country results separate from target-specific evidence.',
      'Separate direct evidence, evidence gaps, tool errors, and checks that were not evaluated.',
      'Define owners, monitoring signals, cadence, and the next review date.',
    ],
    evidenceClassifications: radarEvidenceClassifications,
  },
};

export const reportTemplates = blueprints.map((blueprint) => ({
  slug: blueprint.slug,
  blueprintSlug: blueprint.slug,
  title: templateDetails[blueprint.slug].label,
  accent: templateDetails[blueprint.slug].accent,
  summary: blueprint.outcome,
  methodology: templateDetails[blueprint.slug].methodology,
  findingsSection: templateDetails[blueprint.slug].findingsSection,
  sectionPrompts: templateDetails[blueprint.slug].sectionPrompts,
  evidenceClassifications: templateDetails[blueprint.slug].evidenceClassifications,
  sections: blueprint.reportSections,
  requiredEvidence: blueprint.evidence,
  qualityGates: sharedGates,
}));

export function getReportTemplate(slug) {
  return reportTemplates.find((template) => template.slug === slug);
}

export function getReportTemplateForBlueprint(blueprintSlug) {
  return reportTemplates.find((template) => template.blueprintSlug === blueprintSlug);
}

export function reportBelongsToKnownBlueprint(report) {
  return Boolean(getBlueprint(report?.blueprintSlug) && getReportTemplateForBlueprint(report.blueprintSlug));
}
