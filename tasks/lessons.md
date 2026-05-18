# Lessons

## Verify against current code + real tooling, not a stale report

**Context:** Asked to fix an Obsidian plugin review (commit 04a509f). The report's
line numbers no longer matched — the maintainer had landed many fix commits since.

**Lesson:** When given an external report (review, audit, CI log), first
reconcile it with the *current* code and reproduce the *actual* tooling. Here:
installed eslint 9 + `eslint-plugin-obsidianmd@0.3` (the real review ruleset, not
the repo's broken eslint 8 setup) and ran it for the authoritative violation
list. ~Half the report was already fixed; chasing stale line numbers would have
wasted effort and missed the real issues.

**How to apply:** Reproduce the check locally before fixing. Group violations by
rule (dedupe), fix root causes (one `getErrorMessage(unknown)` util killed ~51
`no-unsafe-*` errors), re-run after each phase.

## A "fix" can introduce a new violation

**Context:** A prior commit changed `Vault.delete` -> `FileManager.trashFile` to
satisfy one rule, but `trashFile` needs Obsidian 1.6.6 while manifest said 1.4.0
— a new `no-unsupported-api` blocker the original report didn't have.

**Lesson:** API-substitution fixes must check the minimum-supported-version
contract (`manifest.json` `minAppVersion`), not just the lint rule in isolation.

## Linters over-fire on proper nouns

`obsidianmd/ui/sentence-case` flagged `OpenAI`/`MB`/`VPN`/`Hugging Face` and
literal examples (`sk-xxx`, model ids). Its autofix would degrade the UI. Don't
blindly apply autofixes — triage; apply only genuine ones (e.g. `markdown` ->
`Markdown`), and document the deliberately-skipped ones.
