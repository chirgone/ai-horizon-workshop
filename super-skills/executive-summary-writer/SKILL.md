---
name: executive-summary-writer
description: Turn reviewed findings into a concise decision narrative while preserving uncertainty and citations.
---

# Executive Summary Writer

## Trigger

After severity review and before report layout.

## Overview

Turn reviewed findings into a concise decision narrative while preserving uncertainty and citations.

## Inputs

- Reviewed findings
- Decision statement
- Report audience
- Evidence gaps and assumptions

## Outputs

- Executive summary
- Decision required
- Top risks
- Visible limitations

## Source requirements

- Use reviewed findings only.
- Reference finding IDs for material claims.
- Preserve assumptions, confidence, and unresolved issues.

## Safety

- Never remove uncertainty to improve the narrative.
- Never introduce uncited metrics.
- Never expose internal-only language.
- Never mark a report approved.

## Approval gate

Executive sponsor confirms the decision framing and customer-safe language.

## Reusable prompt

Write a customer-ready executive summary from the reviewed findings. Lead with the decision required, then the material risks, business relevance, owners, and remediation direction. Reference finding IDs for material claims and preserve assumptions, confidence, and unresolved evidence. Do not add metrics or conclusions that are not supplied.
