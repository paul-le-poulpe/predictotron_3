# predictotron_1 — Project Definition

Repo: https://github.com/paul-le-poulpe/predictotron_1

**Status: definition phase. No code is written until every module below is fully specified.**

---

## 1. Purpose

A website where users hold accounts and publish **prediction posts** about the future.

Predictions can be **linked to each other**, forming **arborescences** (trees of predictions).

Users accumulate **successes** when:
- their own predictions come true, or
- predictions they **reacted to** come true.

---

## 2. Working Method

1. Paul defines the project module by module.
2. Claude asks questions instead of guessing. **No assumptions.** Paul has a clear idea of the product and of the database structure.
3. Each module is written into this document (or a linked file) as a complete specification.
4. Implementation starts only once the definition is complete, then proceeds **module per module**.

Deliverable of the current phase: a complete definition of the project.

---

## 3. Hosting & Infrastructure Constraints

- Hosted on **Cloudflare**.
- Deployed via a **GitHub pipeline**.
- Requires a **database**.
- **Portability is a hard requirement**: the stack must stay as agnostic as possible so the project can later be migrated to a custom server or another provider. No hard lock-in to Cloudflare-specific APIs beyond what is unavoidable; anything platform-specific must sit behind an abstraction layer.
- Tooling preference: **open source by default**.

---

## 4. Modules

To be defined one by one with Paul. Each module gets: purpose, data model, API surface, UI, rules/edge cases.

| # | Module | Status |
|---|--------|--------|
| — | (to be listed by Paul) | not started |

---

## 5. Database

Paul has a defined database structure. To be transcribed here verbatim once walked through.

---

## 6. Open Questions

_(Claude appends questions here; Paul answers; answers are folded into the spec.)_
