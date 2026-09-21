---
name: report-quality-gate-auditor
description: Apply the final evidence, security, ownership, privacy, and presentation gates before a report is shared.
---

# Report Quality Gate Auditor

## Trigger

After the PDF-ready draft is assembled and before distribution.

## Overview

Apply the final evidence, security, ownership, privacy, and presentation gates before a report is shared.

## Inputs

- PDF-ready draft
- Evidence register
- Severity decisions
- Approval and audience record

## Outputs

- Blocking issues
- Non-blocking issues
- Gate status
- Release recommendation

## Source requirements

- Inspect every material claim and citation.
- Confirm owner and horizon for every action.
- Confirm scope, audience, and sharing boundary.

## Safety

- Never close a human approval gate.
- Never suppress a blocking issue.
- Never distribute the report.
- Never change evidence during review.

## Approval gate

Named reviewer closes all blocking gates and authorizes distribution.

## Reusable prompt

Audit this PDF-ready draft against evidence traceability, severity rationale, assumptions, ownership, remediation clarity, customer-safe language, privacy, audience, and presentation. Return blocking issues, non-blocking issues, and each gate as passed, failed, or pending. Do not approve or distribute the report.
