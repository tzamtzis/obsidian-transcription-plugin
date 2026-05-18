# Obsidian plugin review fixes

Review report basis: commit 04a509f (May 7 2026). Current HEAD had already fixed
all blocking *errors* (HTML headings, inline styles, `<style>` injection,
innerHTML, hardcoded `.obsidian`, `createDiv`). Authoritative current state was
reproduced locally with eslint 9 + `eslint-plugin-obsidianmd@0.3` +
typescript-eslint type-checked (the real review ruleset).

## Plan

- [x] **A. Type-safety** — root-caused the ~51 `no-unsafe-*` errors -> 0
  - [x] Added `src/utils/errors.ts` (`getErrorMessage` / `toError` / `getNodeErrorCode`)
  - [x] Typed all `catch` clauses as `unknown`; use `getErrorMessage`
  - [x] `TranscriptionService.getErrorMessage/shouldRetryError` accept `unknown`
  - [x] Typed `requestUrl` JSON responses (OpenAI Whisper, OpenRouter chat) + error shapes
  - [x] Typed `loadData()` result in `main.ts`
  - [x] Typed `window.require('electron').shell` in `TranscriptionModal.ts`
- [x] **B. prefer-window-timers** — `setTimeout`/`clearTimeout` -> `window.*` (19 -> 0); retyped `NodeJS.Timeout` -> `number`
- [x] **C. no-unsupported-api** — bumped manifest minAppVersion `1.4.0` -> `1.6.6` (+ versions.json) so `FileManager.trashFile` is valid
- [x] **D. builtin-modules** — replaced with `node:module` `builtinModules`; dropped devDependency + lockfile entry
- [x] **E. console polish** — removed all 19 informational `console.debug` (kept `console.error/warn`)
- [x] **F. Releases** — added `.github/workflows/release.yml` with `actions/attest-build-provenance`
- [x] **G. Verify** — review eslint clean (only out-of-scope sentence-case), `tsc` 0, build 0, env restored

## Out of scope / decisions

- `obsidianmd/ui/sentence-case` (19 remaining): NOT in the provided review report.
  Every remaining hit is a false positive that would lowercase a proper noun /
  acronym / literal example (`OpenAI`, `OpenRouter`, `MB`, `VPN`, `Hugging Face`,
  `Windows Defender`, the literal `sk-xxx` API-key sample, the literal model id
  `meta-llama/...`, language names). Forcing these degrades the UI and contradicts
  how Obsidian's human reviewers treat proper nouns, so they are intentionally
  left. The 3 *genuine* ones (capitalize "Markdown") were fixed.
- minAppVersion bumped to 1.6.6 (current Obsidian is far past this in 2026; the
  clean fix Obsidian reviewers prefer over feature-detecting deprecated APIs).
- Did not commit / change the project's own broken `npm run lint` tooling or add
  eslint 9 + obsidianmd to devDependencies (out of scope; offered to the user).

## Review

- Result: every actionable item from the review report is resolved, plus a
  newly-discovered real blocker (`FileManager.trashFile` vs minAppVersion) that
  a *previous* fix had introduced.
- `tsc -noEmit -skipLibCheck`: exit 0. `node esbuild.config.mjs production`: exit
  0, `main.js` regenerated.
- Files changed: 14 source/config + 3 new (`src/utils/errors.ts`,
  `.github/workflows/release.yml`, `tasks/`). No behavior change intended —
  edits are type-narrowing, timer namespacing, log removal, and manifest/build
  metadata only.
- Not done by design: deploying `main.js` to an Obsidian vault (path unknown —
  offered to the user); committing (awaiting user request per git workflow).
