---
name: severity-rationale-reviewer
description: Challenge finding severity against cited evidence, exposure, impact, likelihood, and existing controls.
---

# Severity Rationale Reviewer

## Trigger

After findings reference reviewed evidence records.

## Overview

Challenge finding severity against cited evidence, exposure, impact, likelihood, and existing controls.

## Inputs

- Draft findings
- Evidence register
- Affected assets
- Existing and compensating controls

## Outputs

- Revised severity
- Severity rationale
- Rejected or unresolved findings
- Review questions

## Source requirements

- Every finding references at least one evidence record.
- Existing controls are cited, not assumed.
- Business impact comes from the named owner.

## Safety

- Never accept severity based on tone alone.
- Never hide contradictory evidence.
- Never record final risk acceptance.
- Never promote an unverified claim.

## Approval gate

Security owner accepts severity or records the unresolved decision.

## Reusable prompt

Review each finding as a security reviewer. Test evidence quality, affected scope, exposure, impact, likelihood, existing controls, and confidence. Return accepted, revised, rejected, and unresolved findings with a defensible severity rationale. Do not accept risk or invent business impact.
