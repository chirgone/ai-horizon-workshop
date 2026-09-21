---
name: remediation-roadmap-planner
description: Sequence accepted actions by risk reduction, dependency, effort, ownership, and completion evidence.
---

# Remediation Roadmap Planner

## Trigger

After findings and severity are reviewed.

## Overview

Sequence accepted actions by risk reduction, dependency, effort, ownership, and completion evidence.

## Inputs

- Reviewed findings
- Recommended actions
- Owners and dependencies
- Change-control constraints

## Outputs

- Immediate actions
- 30/60/90-day roadmap
- Owners and dependencies
- Completion evidence

## Source requirements

- Every action maps to a reviewed finding.
- Every owner is explicitly named.
- Every completion signal is observable.

## Safety

- Never schedule an owner without confirmation.
- Never treat activity as risk reduction.
- Never bypass change control.
- Never execute a remediation action.

## Approval gate

Action owners confirm ownership, dependency, and target horizon.

## Reusable prompt

Convert the reviewed findings into an immediate and 30/60/90-day remediation roadmap. For every action include finding ID, risk reduction, owner, dependencies, target horizon, and observable completion evidence. Separate accepted risk and unresolved dependencies. Do not execute actions or assign unconfirmed owners.
