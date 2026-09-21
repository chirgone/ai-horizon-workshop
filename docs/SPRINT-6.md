# Sprint 6: Super Skills and Guided Automation

Date: 2026-09-21

## Outcome

- Added a customer-facing Super Skills catalog with five reusable capability contracts.
- Added searchable phase filters and detail pages with inputs, outputs, source requirements, safety boundaries, approval gates, and copyable prompts.
- Connected every Blueprint, Workspace, and report template to its ordered Super Skills workflow.
- Added a browser-local Workspace checklist that records output preparation without storing customer evidence.
- Added portable canonical `SKILL.md` contracts under `super-skills/`.

## Routes

- `/skills`
- `/skills/:slug`

## Workflow

1. Evidence Register Builder
2. Severity Rationale Reviewer
3. Executive Summary Writer
4. Remediation Roadmap Planner
5. Report Quality Gate Auditor

- Steps unlock in order and can be reopened from any prepared step.
- The first four Skills prepare the analysis required to create a report draft.
- The final quality audit remains locked until a report exists for the Workspace.
- Completing a checklist item means its draft output is prepared. It does not close the named human approval gate.

## Storage and safety

- Checklist state uses `localStorage` under `ai-horizon-workshop-v6-workflow-{workspaceId}`.
- Final quality-audit state uses `sessionStorage` and is scoped to the exact `report.id`, so it cannot transfer to another report in the same Workspace or outlive the report session.
- Deleting one or all report drafts also deletes their quality-audit state.
- Stored values contain only ordered Skill slugs, never customer evidence or report content.
- Invalid, unknown, or out-of-order stored values are discarded during hydration.
- Storage failures produce an accessible error and do not update in-memory state.
- Navigating between Workspace routes remounts the checklist with the correct Workspace key.
- Prompts do not authorize MCP, retrieve data, execute writes, approve risk, close gates, or distribute reports.
- The final report remains session-scoped, draft-only, and human-reviewed.

## Canonical contracts

- Each Skill has a portable contract at `super-skills/{slug}/SKILL.md`.
- `npm run validate:skills` verifies every UI contract field against its canonical Markdown contract.
- The validation covers identity, summary, trigger, inputs, outputs, source requirements, safety boundaries, approval, and reusable prompt.

## Installation invariant

- `src/installation.js` was not modified.
- No Installation content changed in `src/workshop-content.js`.
- Installation keeps its existing URLs, steps, order, troubleshooting, and hosted flow.

## Validation

- `npm run validate:skills` validated all five canonical contracts.
- `npm run build` completed successfully with Vite 6.4.3.
- `git diff --check` completed successfully.
- Desktop, intermediate, and mobile layouts have dedicated responsive rules.
- Review findings for report ordering, Workspace state isolation, storage errors, contract drift, and clipboard feedback were addressed.
- No deployment command was executed.
