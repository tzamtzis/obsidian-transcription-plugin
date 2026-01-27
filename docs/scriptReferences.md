# Script References

Complete reference of all scripts in the Obsidian Transcription Plugin project.

## Core Plugin

| Script | Namespace | Description | File Link |
|--------|-----------|-------------|-----------|
| **main.ts** | `src/` | Main plugin entry point that initializes the Obsidian plugin, registers commands, and manages the plugin lifecycle. | [src/main.ts](../src/main.ts) |
| **settings.ts** | `src/` | Settings panel UI and persistence layer for managing plugin configuration including API keys, processing modes, and user preferences. | [src/settings.ts](../src/settings.ts) |

## Processors

Transcription backend implementations for different processing modes.

| Script | Namespace | Description | File Link |
|--------|-----------|-------------|-----------|
| **CloudWhisperProcessor.ts** | `src/processors/` | OpenAI Whisper API integration for cloud-based transcription using the official OpenAI API. | [src/processors/CloudWhisperProcessor.ts](../src/processors/CloudWhisperProcessor.ts) |
| **LocalWhisperProcessor.ts** | `src/processors/` | Local whisper.cpp integration for privacy-focused offline transcription using downloaded AI models. | [src/processors/LocalWhisperProcessor.ts](../src/processors/LocalWhisperProcessor.ts) |
| **OpenRouterProcessor.ts** | `src/processors/` | OpenRouter API integration enabling custom AI model selection for transcription through the OpenRouter service. | [src/processors/OpenRouterProcessor.ts](../src/processors/OpenRouterProcessor.ts) |
| **OllamaProcessor.ts** | `src/processors/` | Ollama local model support for running transcription models locally through Ollama (implementation stub). | [src/processors/OllamaProcessor.ts](../src/processors/OllamaProcessor.ts) |

## Services

Core business logic and functionality services.

| Script | Namespace | Description | File Link |
|--------|-----------|-------------|-----------|
| **TranscriptionService.ts** | `src/services/` | Main orchestration service that coordinates transcription workflow, manages processors, and handles AI-powered analysis of transcripts. | [src/services/TranscriptionService.ts](../src/services/TranscriptionService.ts) |
| **ModelManager.ts** | `src/services/` | Download and cache management for Whisper AI models including progress tracking and file verification. | [src/services/ModelManager.ts](../src/services/ModelManager.ts) |
| **DiarizationService.ts** | `src/services/` | Speaker identification service for distinguishing between different speakers in audio recordings (planning/documentation phase). | [src/services/DiarizationService.ts](../src/services/DiarizationService.ts) |
| **FileManager.ts** | `src/services/` | File operation utilities for managing audio files, transcripts, and temporary files within the Obsidian vault. | [src/services/FileManager.ts](../src/services/FileManager.ts) |

## UI Components

User interface components built with Obsidian UI framework.

| Script | Namespace | Description | File Link |
|--------|-----------|-------------|-----------|
| **TranscriptionModal.ts** | `src/ui/` | Main transcription modal dialog that provides the user interface for configuring and initiating transcriptions. | [src/ui/TranscriptionModal.ts](../src/ui/TranscriptionModal.ts) |
| **TranscriptionProgressModal.ts** | `src/ui/` | Progress display modal showing real-time transcription status, percentage completion, and stage information. | [src/ui/TranscriptionProgressModal.ts](../src/ui/TranscriptionProgressModal.ts) |
| **ProgressNotification.ts** | `src/ui/` | Toast-style notification system for displaying brief status updates and completion messages to users. | [src/ui/ProgressNotification.ts](../src/ui/ProgressNotification.ts) |

## Utilities

Helper functions and shared utilities.

| Script | Namespace | Description | File Link |
|--------|-----------|-------------|-----------|
| **audio.ts** | `src/utils/` | Audio file handling utilities including format conversion, validation, and metadata extraction for MP3 and M4A files. | [src/utils/audio.ts](../src/utils/audio.ts) |
| **markdown.ts** | `src/utils/` | Markdown generation utilities for creating formatted transcript documents with frontmatter, timestamps, and structured content. | [src/utils/markdown.ts](../src/utils/markdown.ts) |

## Build & Development

Build configuration and development tooling scripts.

| Script | Namespace | Description | File Link |
|--------|-----------|-------------|-----------|
| **esbuild.config.mjs** | Root | ESBuild bundler configuration that compiles TypeScript source into a single optimized main.js plugin file. | [esbuild.config.mjs](../esbuild.config.mjs) |
| **version-bump.mjs** | Root | Automated version management script that updates manifest.json and versions.json during release preparation. | [version-bump.mjs](../version-bump.mjs) |
| **test-utils.js** | Root | Testing utilities and automation functions for validating plugin functionality during development. | [test-utils.js](../test-utils.js) |

## Build Artifacts

| Script | Namespace | Description | File Link |
|--------|-----------|-------------|-----------|
| **main.js** | Root | Bundled and minified production build of the plugin (generated by esbuild, not tracked in git). | [main.js](../main.js) |

---

**Total Scripts:** 18 source files + 3 build scripts = 21 scripts

**Last Updated:** 2026-01-27
