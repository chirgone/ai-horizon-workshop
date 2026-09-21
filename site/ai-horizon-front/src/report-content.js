import { blueprints, getBlueprint } from './blueprint-content.js';

export const reportSeverities = ['Critical', 'High', 'Medium', 'Low', 'Informational'];
export const reportHorizons = ['Immediate', '30 days', '60 days', '90 days', 'Accepted risk'];
export const reportConfidences = ['Verified', 'High', 'Medium', 'Low'];

const sharedGates = [
  'Every material finding has a specific evidence citation.',
  'Severity has been challenged by the security owner.',
  'Every action has one accountable owner and target horizon.',
  'Assumptions, access failures, and evidence gaps are visible.',
  'The approved audience and sharing boundary are confirmed.',
];

const templateDetails = {
  'account-audit': {
    label: 'Security posture brief',
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
