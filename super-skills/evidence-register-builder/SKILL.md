---
name: evidence-register-builder
description: Normalize approved source results into traceable evidence records without converting inference into fact.
---

# Evidence Register Builder

## Trigger

After read-only sources are validated and before any finding is drafted.

## Overview

Normalize approved source results into traceable evidence records without converting inference into fact.

## Inputs

- Approved source inventory
- Retrieved facts and timestamps
- Account or asset scope
- Known access failures

## Outputs

- Evidence register
- Source citations
- Confidence classification
- Explicit evidence gaps

## Source requirements

- Use only sources authorized for the Workspace.
- Preserve source, retrieval time, query or control, affected scope, and observed fact.
- Label stale, contradictory, incomplete, and permission-limited evidence.

## Safety

- Never create a missing fact.
- Never expand source scope.
- Never include secrets, tokens, or prohibited data.
- Never execute a write action.

## Approval gate

Source owner confirms scope and material evidence records.

## Reusable prompt

Build an evidence register from the supplied read-only results. For every record include source, retrieval time, query or control, affected scope, observed fact, confidence, and the report claim it may support. Separate verified facts, inference, contradictions, and missing evidence. Do not invent facts or expand scope.
