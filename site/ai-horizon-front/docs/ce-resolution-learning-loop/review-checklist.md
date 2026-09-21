# CE Resolution Learning Loop, Review Checklist

Use this checklist before any internal resolution record is added to the Knowledge Center or any customer report is shared.

---

## Reviewer Decision

- [ ] Approved for Knowledge Center
- [ ] Approved for Customer
- [ ] Needs reviewer edits
- [ ] Rejected for reuse
- [ ] Test Only

## 1. Case Eligibility

- [ ] The case status is correctly labeled as Active, Mitigated, Resolved, Resolved With Workaround or Unknown.
- [ ] Active cases are not represented as final root cause reports.
- [ ] Customer-facing reports are generated only for resolved cases or stable workarounds.
- [ ] The draft is intended for internal reuse or customer sharing only after explicit review.
- [ ] The case has enough signal to justify a reusable pattern.

## 2. Canonical Template Completeness

- [ ] All major sections of the canonical template are present.
- [ ] Customer, market, and affected geography are captured when relevant.
- [ ] Missing information is explicitly called out instead of silently omitted.
- [ ] Actions, findings, and outcome are clearly separated.

## 3. Official Documentation Policy

Public Cloudflare documentation is the source of truth for technical claims.

- [ ] Product behavior claims were checked against `cloudflare-docs` first.
- [ ] Documentation URLs support the claims that cite them.
- [ ] Claims are labeled correctly as `Verified`, `Partial / Inferred`, or `Unverified`.
- [ ] No partial capability has been presented as a full confirmed capability.

Preferred source order:

1. `cloudflare-docs`
2. `developers.cloudflare.com`
3. `www.cloudflare.com`
4. `blog.cloudflare.com`
5. Internal references for internal context only

## 4. Evidence Quality

- [ ] Important conclusions point back to evidence or a supporting source.
- [ ] Evidence is relevant and understandable out of context.
- [ ] Contradictions or low-confidence areas are called out explicitly.

## 5. Sanitization And Privacy

- [ ] Secrets, credentials, private tokens, and internal-only values were removed.
- [ ] Customer-identifying details were generalized where needed.
- [ ] `Customer / Account` and `Support case reference` are kept in private metadata only and excluded from semantic indexing by default.
- [ ] One-off environment artifacts were not preserved as reusable knowledge unless necessary.
- [ ] The sensitivity label matches the actual content.

## 6. Customer Report Safety

- [ ] The customer report excludes internal links and internal-only references.
- [ ] The customer report excludes account IDs, zone IDs, private IPs, tokens and internal hostnames.
- [ ] The customer report states root cause only when supported by evidence.
- [ ] The customer report does not expose internal hypotheses, escalation paths or commercial data.
- [ ] The customer report clearly states current status, actions taken and follow-up items.

## 7. Reusability Test

- [ ] The draft explains when the pattern applies.
- [ ] The draft explains when the pattern does not apply.
- [ ] A future CE could use this record to accelerate a similar investigation.
- [ ] Open questions remain open instead of being overstated.

## 8. Review Outcome Notes

- **Decision:**
- **Reviewer:**
- **Date:**
- **Required edits:**
- **Reason if rejected:**

## 9. Minimum Approval Standard

Approve only if all of the following are true:

- the case is safe to preserve
- the key claims are either verified or honestly labeled
- the case is understandable without the original conversation
- private metadata is separated from reusable searchable content
- the reusable pattern is clear enough to help the next CE
- the customer report is safe to share when `Approved for Customer` is selected
