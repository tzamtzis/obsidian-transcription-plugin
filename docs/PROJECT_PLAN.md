# Obsidian Audio Transcription Plugin - Project Plan

## Executive Summary

This document outlines the business and technical approach for developing an Obsidian community plugin that transcribes audio files (m4a, mp3) and extracts actionable insights from meeting recordings. The plugin will support Greek and English languages, with a focus on user customization and flexible deployment (local or cloud-based processing).

---

## Business Analysis

### 1. Target Users & Use Cases

**Primary Use Case**: Meeting recordings
- Business professionals recording team meetings
- Consultants/freelancers documenting client conversations
- Researchers conducting interviews
- Personal productivity enthusiasts tracking action items

**User Needs**:
- Quick conversion of meeting audio to structured notes
- Extraction of action items and follow-up points
- Support for Greek and English (bilingual users or code-switching scenarios)
- Privacy flexibility (option for local processing)
- Integration with existing Obsidian note-taking workflow

### 2. Value Proposition

**Core Benefits**:
- **Time Savings**: Eliminate manual transcription (2-hour meeting = 4-8 hours of typing)
- **Improved Recall**: Never miss action items or key decisions
- **Knowledge Integration**: Transcriptions live alongside existing notes in Obsidian
- **Privacy Control**: Flexible processing options for sensitive content
- **Multilingual Support**: Essential for bilingual work environments

**Competitive Differentiation**:
- Native Obsidian integration (no export/import workflow)
- User-customizable analysis prompts
- Multilingual support (especially Greek, which is often overlooked)
- Open-source community plugin (free, transparent, extensible)

### 3. Monetization & Distribution

**Distribution Model**: Free, open-source community plugin
- Published on Obsidian Community Plugins marketplace
- Source code on GitHub for transparency and contributions
- MIT or GPL license for maximum adoption

**Cost Considerations**:
- **Local Processing**: Free after initial setup, requires powerful hardware
- **Cloud Processing (Optional)**: Users pay for their own API keys
  - OpenAI Whisper API: ~$0.006/minute ($0.72 for 2-hour audio)
  - Assembly AI: ~$0.00065/second (~$4.68 for 2-hour audio)
  - Google Cloud Speech-to-Text: Variable pricing

**Sustainability**: Community-driven development, potential for sponsored features

### 4. Success Metrics

**Adoption Metrics**:
- Downloads from Obsidian Community Plugins
- GitHub stars and forks
- Active installations (via update checks)

**Quality Metrics**:
- Transcription accuracy (measured via user feedback)
- Processing time vs. audio length ratio
- User retention (continued use after 30 days)
- Issue resolution time on GitHub

### 5. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Local processing too slow | High | High | Offer cloud API fallback option |
| Poor Greek transcription quality | Medium | High | Test multiple models, allow model selection |
| Large file size crashes | Medium | Medium | Implement chunking and streaming |
| Privacy concerns with cloud | Low | High | Clear documentation, local-first approach |
| Complex UI confuses users | Medium | Medium | Progressive disclosure, good defaults |

---

## Technical Analysis

### 1. Architecture Overview

```text
┌─────────────────────────────────────────────────────────┐
│                    Obsidian Plugin                      │
├─────────────────────────────────────────────────────────┤
│  UI Layer                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Ribbon Icon  │  │ Context Menu │  │ Settings Pane│ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────┤
│  Orchestration Layer                                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │  TranscriptionService (manages workflow)         │  │
│  └──────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  Processing Layer                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Local      │  │    Cloud     │  │   Analysis   │ │
│  │  Processor   │  │  Processor   │  │   Service    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────┤
│  Storage Layer                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  FileManager (reads audio, writes markdown)      │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 2. Technology Stack

#### Core Plugin Framework

- **Language**: TypeScript
- **Build Tool**: esbuild or Rollup
- **Framework**: Obsidian Plugin API (v1.x)
- **Testing**: Jest, Vitest

#### Transcription Engines

**Option A: Local Processing (Recommended for Windows)**

- **Whisper.cpp**: C++ port of OpenAI Whisper, runs on CPU/GPU
  - Pros: Fast, accurate, no API costs, privacy-preserving
  - Cons: Requires model download (~1-3GB), CPU-intensive
  - Implementation: Node.js child process or WASM build
  - Languages: Supports 99+ languages including Greek and English

**Option B: Cloud Processing (Fallback)**

- **OpenAI Whisper API**:
  - Pros: Excellent accuracy, simple API, official
  - Cons: $0.006/minute, requires internet, data leaves device

- **Assembly AI**:
  - Pros: Speaker diarization built-in, punctuation, async processing
  - Cons: More expensive, requires API key

- **Deepgram**:
  - Pros: Fast, real-time capable, good Greek support
  - Cons: API-only, pricing varies

**Recommendation**: Implement both with user preference

1. Default to local Whisper.cpp for privacy and cost
2. Fallback to cloud APIs if user opts in
3. Allow model selection (tiny, base, small, medium, large)

#### Analysis & Extraction

- **Option A: Local LLM (via LM Studio/Ollama)**:
  - Run small models like Llama 3.2 3B locally
  - Use customizable prompts for extraction
  - Privacy-preserving

- **Option B: Cloud LLM APIs**:
  - OpenAI GPT-4/GPT-3.5
  - Anthropic Claude
  - User provides API key

**Recommendation**: Support both, default to local via Ollama if available

### 3. Project Structure

```text
obsidian-transcription-plugin/
├── .github/
│   └── workflows/
│       └── release.yml
├── src/
│   ├── main.ts                    # Plugin entry point
│   ├── settings.ts                # Settings UI and management
│   ├── services/
│   │   ├── TranscriptionService.ts
│   │   ├── AnalysisService.ts
│   │   ├── ModelManager.ts        # Download/manage Whisper models
│   │   └── FileManager.ts
│   ├── processors/
│   │   ├── LocalWhisperProcessor.ts
│   │   ├── CloudWhisperProcessor.ts
│   │   ├── OpenRouterProcessor.ts
│   │   └── OllamaProcessor.ts
│   ├── ui/
│   │   ├── TranscriptionModal.ts
│   │   └── ProgressNotification.ts
│   └── utils/
│       ├── audio.ts               # Audio utilities
│       └── markdown.ts            # Markdown formatting
├── models/                        # ← Whisper models (gitignored)
│   ├── .gitkeep
│   ├── tiny.bin                   # Downloaded by user
│   ├── medium.bin
│   └── large.bin
├── test/
│   └── fixtures/                  # Sample audio files for testing
├── .gitignore                     # Excludes models/
├── manifest.json                  # Obsidian plugin manifest
├── package.json
├── tsconfig.json
├── esbuild.config.mjs
├── README.md
└── PROJECT_PLAN.md               # This document
```

**Key Notes**:

- `models/` directory stores Whisper model binaries locally
- `.gitignore` excludes `models/*.bin` to avoid committing large files
- `ModelManager.ts` handles checking, downloading, and validating models
- Plugin checks for model existence on startup and prompts download if needed

### 4. Core Components Design

#### A. TranscriptionService

```typescript
interface TranscriptionService {
  transcribe(
    audioPath: string,
    options: TranscriptionOptions
  ): Promise<TranscriptionResult>;

  cancel(): void;
  getProgress(): number;
}

interface TranscriptionOptions {
  language?: 'auto' | 'el' | 'en';
  processorType: 'local' | 'cloud-whisper' | 'cloud-assemblyai';
  modelSize?: 'tiny' | 'base' | 'small' | 'medium' | 'large';
  enableDiarization?: boolean;
}

interface TranscriptionResult {
  text: string;
  segments: TranscriptSegment[];
  language: string;
  duration: number;
  speakers?: SpeakerInfo[];
}
```

#### B. AnalysisService

```typescript
interface AnalysisService {
  analyze(
    transcript: string,
    prompt: AnalysisPrompt
  ): Promise<AnalysisResult>;
}

interface AnalysisPrompt {
  type: 'meeting' | 'lecture' | 'interview' | 'custom';
  customPrompt?: string;
  extractionRules: ExtractionRule[];
}

interface AnalysisResult {
  summary: string;
  keyPoints: string[];
  actionItems: ActionItem[];
  followUps: FollowUp[];
  metadata: Record<string, any>;
}
```

#### C. FileManager

```typescript
interface FileManager {
  findAudioFiles(vault: Vault): TFile[];
  readAudioFile(file: TFile): Promise<ArrayBuffer>;
  createMarkdownFile(
    audioFile: TFile,
    content: MarkdownContent
  ): Promise<TFile>;
}

interface MarkdownContent {
  frontmatter: Record<string, any>;
  body: string;
  transcription: string;
}
```

#### D. ModelManager

```typescript
interface ModelManager {
  checkModelExists(modelSize: ModelSize): Promise<boolean>;
  downloadModel(
    modelSize: ModelSize,
    onProgress: (progress: number) => void
  ): Promise<void>;
  getModelPath(modelSize: ModelSize): string;
  validateModel(modelSize: ModelSize): Promise<boolean>;
  listAvailableModels(): ModelInfo[];
}

type ModelSize = 'tiny' | 'base' | 'small' | 'medium' | 'large';

interface ModelInfo {
  size: ModelSize;
  downloaded: boolean;
  fileSize: number;
  path: string;
}

// Usage example
class WhisperModelManager implements ModelManager {
  private modelsDir = './models';
  private modelUrls = {
    tiny: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin',
    base: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin',
    small: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin',
    medium: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin',
    large: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin'
  };

  async checkModelExists(modelSize: ModelSize): Promise<boolean> {
    const modelPath = this.getModelPath(modelSize);
    return await exists(modelPath);
  }

  async downloadModel(
    modelSize: ModelSize,
    onProgress: (progress: number) => void
  ): Promise<void> {
    const url = this.modelUrls[modelSize];
    const modelPath = this.getModelPath(modelSize);

    // Stream download with progress tracking
    // Save to models directory
    // Validate checksum after download
  }

  getModelPath(modelSize: ModelSize): string {
    return `${this.modelsDir}/ggml-${modelSize}.bin`;
  }
}
```

### 5. Data Flow

```text
User Action (Context Menu on audio file)
         ↓
   UI triggers transcription
         ↓
   ┌──────────────────────────────────┐
   │ Check if markdown file exists    │
   │ and contains analysis            │
   └──────────────────────────────────┘
         ↓
   ┌─────────────┐
   │ Exists?     │
   └─────────────┘
    YES ↓    ↓ NO
        ↓    └──────────────────────┐
   Show message:                    │
   "Analysis already                │
    available"                      │
         ↓                           ↓
    [STOP]              ┌─────────────────────┐
                        │ Check model exists  │
                        │ (ModelManager)      │
                        └─────────────────────┘
                                 ↓
                        ┌─────────────┐
                        │ Missing?    │
                        └─────────────┘
                         YES ↓    ↓ NO
                             ↓    └────────────┐
                   Prompt download             │
                   with progress bar           │
                             ↓                 ↓
                   ┌─────────────────────────────────┐
                   │ TranscriptionService.transcribe()│
                   └─────────────────────────────────┘
                             ↓
                   ┌─────────────────────┐
                   │ Determine Processor │
                   └─────────────────────┘
                             ↓
                   ┌────────────────────────────┐
                   │  Local Path    │ Cloud Path│
                   │  ↓             │  ↓        │
                   │  Load Whisper  │  Upload   │
                   │  ↓             │  ↓        │
                   │  Process chunks│  Poll API │
                   │  ↓             │  ↓        │
   [Retry on error]│  Transcript    │  Transcript│
         ↓         └────────────────────────────┘
    [Max 1 retry]           ↓
         ↓           TranscriptionResult
    Show error              ↓
    & stop          AnalysisService.analyze()
                             ↓
                   Apply custom instructions
                             ↓
                   ┌────────────────────────────┐
                   │  Local LLM  │  Cloud LLM   │
                   │  (Ollama)   │ (OpenRouter) │
                   └────────────────────────────┘
                             ↓
                      AnalysisResult
                             ↓
                   FileManager.createMarkdownFile()
                             ↓
                   Format markdown with:
                   - Frontmatter (metadata)
                   - Summary
                   - Key points
                   - Action items
                   - Follow-ups
                   - Full transcription
                             ↓
                   Create file with same name
                             ↓
                   Open file in Obsidian
```

### 5. File Output Format

```markdown
---
audio_file: "meeting-2025-01-15.m4a"
duration: "1:32:45"
transcribed_date: 2025-01-15
language: "en"
speakers: 3
tags: [meeting, transcription]
---

# Meeting Transcription: meeting-2025-01-15

## Summary
Brief overview of the meeting content...

## Key Points
- Important decision about project timeline
- Discussion of budget allocation
- New team member introduction

## Action Items
- [ ] John to review budget proposal by Friday (@john)
- [ ] Sarah to schedule follow-up meeting (@sarah)
- [ ] Update project timeline document (@team)

## Follow-up Questions
- What is the final deadline for Q1 deliverables?
- Need clarification on resource allocation

---

## Full Transcription

**Speaker 1** [00:00:12]
Good morning everyone, let's get started...

**Speaker 2** [00:00:45]
Thanks for joining. Today we need to discuss...

[Continue transcription...]
```

### 6. User Interface Design

#### A. Settings Panel

```text
┌─────────────────────────────────────────┐
│ Transcription Settings                  │
├─────────────────────────────────────────┤
│ Processing Mode:                        │
│ ○ Local (Whisper.cpp)                   │
│ ○ Cloud (OpenAI Whisper)                │
│ ○ Cloud (OpenRouter)                    │
│                                         │
│ Model Size (Local): [medium ▼]          │
│ tiny | base | small | medium | large    │
│                                         │
│ Default Language:                       │
│ ○ Auto-detect                           │
│ ○ English                               │
│ ○ Greek                                 │
│ ○ Both (Multilingual)                   │
│                                         │
│ Enable Speaker Diarization: [✓]        │
│                                         │
│ ─── Analysis Settings ───               │
│                                         │
│ Analysis Provider:                      │
│ ○ Local (Ollama)                        │
│ ○ Cloud (OpenRouter)                    │
│                                         │
│ Custom Instructions (Optional):         │
│ ┌─────────────────────────────────────┐ │
│ │ Add any extra instructions for the  │ │
│ │ analysis model here...              │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ─── API Keys (for cloud processing) ─── │
│                                         │
│ OpenAI API Key: [**********]            │
│                                         │
│ OpenRouter API Key: [**********]        │
│ OpenRouter Model: [meta-llama/llama-3.2-3b-instruct] │
│                                         │
│ ─── Model Management ───                │
│                                         │
│ Local Models Path: ./models/            │
│ Models Status:                          │
│   • tiny.bin: Not downloaded            │
│   • medium.bin: ✓ Downloaded (1.5GB)    │
│   • large.bin: Not downloaded           │
│                                         │
│ [Download Missing Models]               │
│                                         │
│ ─── Output Settings ───                 │
│                                         │
│ Output Folder: [/Transcriptions]        │
│ Include Timestamps: [✓]                 │
│ Create Tags: [✓]                        │
│ Skip if Already Analyzed: [✓]           │
└─────────────────────────────────────────┘
```

#### B. Context Menu Integration

- Right-click on .m4a or .mp3 file
- Menu option: "Transcribe audio file"
- Shows progress notification
- Opens result file when complete

#### C. Ribbon Icon

- Icon in left sidebar
- Clicking shows: "Select an audio file to transcribe"
- File picker for manual selection

### 7. Technical Challenges & Solutions

#### Challenge 1: Long Audio Files (2 hours)

**Problem**:

- Large files consume memory
- Whisper has token limits per chunk
- User needs progress feedback

**Solution**:

```typescript
// Chunk audio into manageable segments
class ChunkedTranscription {
  async transcribe(audioBuffer: ArrayBuffer) {
    const chunks = this.splitAudio(audioBuffer, 30 * 60); // 30-min chunks
    const results = [];

    for (let i = 0; i < chunks.length; i++) {
      this.updateProgress((i / chunks.length) * 100);
      const result = await this.processChunk(chunks[i]);
      results.push(result);
    }

    return this.mergeResults(results);
  }
}
```

#### Challenge 2: Greek Language Support

**Problem**:

- Not all transcription services handle Greek well
- User may switch between English and Greek in same audio

**Solution**:

- Use Whisper large model (best multilingual support)
- Enable automatic language detection per segment
- Test Greek accuracy before release
- Allow manual language override

#### Challenge 3: Speaker Diarization

**Problem**:

- Whisper.cpp doesn't include speaker diarization
- Cloud services vary in quality

**Solution**:

```typescript
// Option 1: Use pyannote.audio locally (Python)
// Option 2: Use Assembly AI cloud API
// Option 3: Simple silence-based segmentation

interface DiarizationStrategy {
  identifySpeakers(audio: AudioBuffer): Promise<SpeakerSegment[]>;
}

class LocalDiarization implements DiarizationStrategy {
  // Run pyannote via Python subprocess
}

class CloudDiarization implements DiarizationStrategy {
  // Use Assembly AI API
}
```

#### Challenge 4: Local Processing Performance

**Problem**:

- Whisper.cpp on CPU can be slow
- Windows GPU support varies

**Solution**:

- Use `whisper.cpp` with GPU acceleration (CUDA, Metal, OpenCL)
- Start with "small" model as default (good speed/accuracy balance)
- Show estimated time before processing
- Allow cancellation during processing
- Consider streaming output for user feedback

### 8. Implementation Phases

#### Phase 1: MVP (Core Functionality)

**Duration**: 2-3 weeks
**Deliverables**:

- Basic plugin structure (Obsidian API integration)
- Local Whisper.cpp integration (English only)
- Simple UI (context menu + settings)
- Basic markdown output (transcription only)
- Manual trigger via context menu

**Success Criteria**:

- Can transcribe 30-minute English audio file
- Creates markdown file with transcription
- No crashes or errors

#### Phase 2: Multilingual & Analysis

**Duration**: 2-3 weeks
**Deliverables**:

- Greek language support
- Analysis service integration (local LLM)
- Customizable prompts
- Enhanced markdown output (summary, action items, etc.)
- Progress notifications

**Success Criteria**:

- Accurate Greek transcription
- Extracts action items from meeting audio
- User can customize prompts

#### Phase 3: Advanced Features

**Duration**: 2-4 weeks
**Deliverables**:

- Speaker diarization
- Cloud API fallback options
- Chunk processing for long files
- Settings panel UI improvements
- Error handling & recovery

**Success Criteria**:

- Can handle 2-hour audio files
- Identifies speakers (when enabled)
- Graceful handling of failures

#### Phase 4: Polish & Release

**Duration**: 1-2 weeks
**Deliverables**:

- Documentation (README, user guide)
- Testing (unit tests, integration tests)
- Performance optimization
- Community plugin submission
- Video demo

**Success Criteria**:

- Accepted into Obsidian Community Plugins
- Comprehensive documentation
- All core features stable

### 9. Dependencies & Requirements

#### Development Environment

- Node.js 18+
- TypeScript 5+
- Obsidian API types
- Git for version control

#### Runtime Requirements (User)

- Obsidian 1.4.0+
- For local processing:
  - Whisper.cpp binary (bundled or downloaded on first run)
  - 4GB+ RAM recommended
  - 2GB disk space for models
- For cloud processing:
  - Internet connection
  - API keys (user-provided)

#### External Dependencies

- `whisper.cpp` (C++ binary or Node.js wrapper)
- `ffmpeg` (for audio format conversion)
- Optional: Ollama or LM Studio (for local LLM analysis)

### 10. Testing Strategy

#### Unit Tests

- TranscriptionService logic
- AnalysisService prompt generation
- FileManager markdown formatting
- Settings persistence

#### Integration Tests

- End-to-end transcription flow
- API integration (mocked)
- File creation and Obsidian vault integration

#### Manual Testing

- Various audio formats (m4a, mp3)
- Different audio lengths (5min, 30min, 2hr)
- Greek and English audio samples
- Edge cases (corrupted files, very quiet audio, multiple speakers)

### 11. Implementation Decisions (User Confirmed)

The following decisions have been confirmed and will guide implementation:

1. **Model Storage**: ✓ DECIDED
   - Store in subfolder under project directory: `./models/`
   - Folder must be excluded from git via `.gitignore`
   - Plugin checks for model existence on startup
   - If missing, prompt user to download automatically
   - Implement auto-download with progress indication

2. **Prompt Customization**: ✓ DECIDED
   - Non-technical approach: Simple textbox
   - Users enter optional extra instructions
   - Instructions appended to base analysis prompt
   - No complex prompt engineering required

3. **Error Handling**: ✓ DECIDED
   - Retry once automatically on failure
   - If second attempt fails, show descriptive error message
   - Error should explain what went wrong and possible solutions
   - No partial result saving

4. **Existing Files**: ✓ DECIDED
   - Check if markdown file contains audio analysis
   - If analysis already exists, skip processing
   - Return message: "Analysis already available for this file"
   - No overwrite or duplication

5. **Performance Expectations**: ✓ DECIDED
   - **Priority: Accuracy over speed**
   - Use larger models (medium/large) for better Greek support
   - Accept longer processing times for quality results
   - Add OpenRouter API support as alternative
   - User can provide OpenRouter API key + model name in settings

6. **Initial Focus**: ✓ DECIDED
   - **Balanced approach**
   - Start with medium model as default
   - Allow model selection in settings
   - Support both local (accuracy) and cloud (speed/convenience)

---

## Next Steps

1. **Review this document** and provide feedback on approach
2. **Answer open questions** above
3. **Set up development environment** (scaffold plugin)
4. **Create project repository** structure
5. **Begin Phase 1 implementation**

---

## Appendix: Research Notes

### A. Whisper Model Comparison

| Model | Size | Params | Speed (CPU) | Accuracy | Greek Support |
|-------|------|--------|-------------|----------|---------------|
| tiny  | 75MB | 39M    | Very Fast   | Fair     | Limited       |
| base  | 142MB| 74M    | Fast        | Good     | Fair          |
| small | 466MB| 244M   | Moderate    | Very Good| Good          |
| medium| 1.5GB| 769M   | Slow        | Excellent| Very Good     |
| large | 2.9GB| 1550M  | Very Slow   | Best     | Excellent     |

**Recommendation**: Default to `small` model (best balance), allow users to upgrade to `medium` or `large` for Greek.

### B. Speaker Diarization Options

1. **pyannote.audio** (Local, Python)
   - Pros: State-of-art accuracy, free
   - Cons: Requires Python setup, additional dependency

2. **Assembly AI** (Cloud)
   - Pros: Built-in, simple API
   - Cons: Costs money, data leaves device

3. **Simple silence detection** (Custom)
   - Pros: No dependencies, fast
   - Cons: Poor accuracy, can't handle overlapping speech

**Recommendation**: Phase 3 feature, start with cloud option (Assembly AI), consider local in future.

### C. Alternative Approaches Considered

1. **Real-time transcription**: Record and transcribe simultaneously
   - Rejected: Complexity high, not MVP requirement

2. **Mobile support**: iOS/Android
   - Deferred: Focus on Windows desktop first, revisit after desktop stable

3. **Video support**: Extract audio from .mp4, .mkv
   - Deferred: Use case unclear, can add later if requested

---

**Document Version**: 1.0
**Last Updated**: 2025-12-12
**Author**: Claude (AI Assistant)
