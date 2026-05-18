# Issue #8 — Add Groq transcription support

Branch: `groq-transcription` (off `main`, which now includes merged PR #9).

Groq's audio API is OpenAI-compatible (`https://api.groq.com/openai/v1/audio/transcriptions`,
multipart form, `verbose_json` + segment timestamps), so it maps onto the existing
`CloudWhisperProcessor` pattern as a new `cloud-groq` processing mode. Analysis
still goes through OpenRouter (unchanged).

## Decisions (from user)

- Branch off `main` (PR #9 was merged, so this inherits all the cleanup).
- Model picker: dropdown (turbo / large-v3 / distil), default `whisper-large-v3-turbo`.
- Separate `GroqWhisperProcessor` (mirrors `CloudWhisperProcessor`; zero risk to OpenAI path).

## Plan

- [x] `src/processors/GroqWhisperProcessor.ts` — new, mirrors CloudWhisperProcessor (typed responses, `getErrorMessage`, Groq endpoint/key/model)
- [x] `settings.ts` — `'cloud-groq'` in ProcessingMode; `GroqModel` type + `GROQ_MODEL_NAMES`; `groqApiKey`/`groqModel` in interface + DEFAULT_SETTINGS; processing-mode dropdown option; conditional Groq API-key (password, `gsk_`) + model dropdown
- [x] `TranscriptionService.ts` — instantiate processor; `cloud-groq` branch + `transcribeCloudGroq()`; `validateSetup` (`gsk_` key + model); `cancel()`
- [x] Verify — `tsc` 0, esbuild production 0, review-eslint clean (only documented sentence-case false positives)

## Review

- Scope held to 3 files (2 modified, 1 new), matching the existing cloud-whisper
  pattern exactly — no behavior change to local/OpenAI/OpenRouter paths.
- Not done by design: version bump (done at release), push/PR/vault deploy
  (awaiting user), in-Obsidian smoke test (can't run Obsidian).
- Note: Groq free tier caps audio at ~25 MB (dev tier ~100 MB); the existing
  generic >100 MB warning still applies. Could add a Groq-specific size note as
  a follow-up if desired.
