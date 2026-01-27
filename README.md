# Audio Transcription & Analysis Plugin for Obsidian

Transform your audio recordings into structured, actionable notes automatically. This plugin transcribes audio files (m4a, mp3) and extracts key points, action items, and follow-ups using AI - all within your Obsidian vault.

## Features

- **Automatic Transcription**: Convert meeting recordings, lectures, and interviews into text
- **Multilingual Support**: Full support for Greek and English (with automatic language detection)
- **AI-Powered Analysis**: Extract summaries, key points, action items, and follow-up questions
- **Local or Cloud Processing**: Choose between privacy-focused local processing or faster cloud APIs
- **Speaker Identification**: Distinguish between different speakers in conversations
- **Long Audio Support**: Handle recordings up to 2+ hours
- **Seamless Integration**: Results saved as markdown files in your vault
- **Customizable**: Add your own analysis instructions for personalized results

---

## What It Looks Like: End-User Journey

### Step 1: Installing the Plugin

After installing from Obsidian Community Plugins:

1. Open Obsidian Settings (gear icon)
2. Navigate to "Community Plugins"
3. Search for "Audio Transcription"
4. Click "Install" then "Enable"

You'll see a new microphone icon in your left ribbon bar.

### Step 2: First-Time Setup

When you first use the plugin, you'll see a welcome screen:

```text
============================================
  Welcome to Audio Transcription Plugin!
============================================

  Before you can transcribe audio files,
  you need to download a transcription
  model.

  Recommended: Medium Model (1.5 GB)
  - Best balance of speed and accuracy
  - Good Greek language support
  - Can process 1-hour audio in ~20 mins

  Other options:
  - Small (466 MB) - Faster, less accurate
  - Large (2.9 GB) - Best quality, slower

  [Download Medium Model]  [Choose Other]

  Or use cloud processing (no download):
  [Configure Cloud API]
============================================
```

If you click "Download Medium Model", you'll see:

```text
============================================
  Downloading Whisper Medium Model...
============================================

  Progress: [##########....] 742 MB / 1.5 GB

  Estimated time remaining: 3 minutes

  This is a one-time download. The model
  will be saved to your plugin folder.

            [Cancel Download]
============================================
```

### Step 3: Configuring Settings (Optional)

Open Settings > Audio Transcription to see:

```text
============================================
        TRANSCRIPTION SETTINGS
============================================

Processing Mode
(*) Local (Whisper.cpp) - Private, no internet needed
( ) Cloud (OpenAI Whisper) - Faster, requires API key
( ) Cloud (OpenRouter) - Use custom models

Model Size (for local processing)
[  tiny  |  base  | small | *medium | large  ]

Default Language
(*) Auto-detect - Let the AI figure it out
( ) English only
( ) Greek only
( ) Multilingual (both)

[X] Enable Speaker Diarization (identify speakers)

--------------------------------------------
           ANALYSIS SETTINGS
--------------------------------------------

Analysis Provider
(*) Local (Ollama) - Requires Ollama installed
( ) Cloud (OpenRouter) - Requires API key

Custom Analysis Instructions (optional)
+---------------------------------------+
| Focus on technical decisions and      |
| deadlines. Tag people using @name     |
| format. Identify risks and blockers.  |
+---------------------------------------+

--------------------------------------------
      API KEYS (for cloud processing)
--------------------------------------------

OpenAI API Key (for Whisper API)
[sk-************************************************]

OpenRouter API Key (for analysis)
[sk-or-********************************************]

OpenRouter Model Name
[meta-llama/llama-3.2-3b-instruct              ]

--------------------------------------------
           MODEL MANAGEMENT
--------------------------------------------

Local Models Path: ./models/

Installed Models:
( ) tiny.bin    - Not downloaded
( ) base.bin    - Not downloaded
( ) small.bin   - Not downloaded
(*) medium.bin  - ✓ Installed (1.5 GB)
( ) large.bin   - Not downloaded

[Download Selected Model]  [Delete Model]

--------------------------------------------
           OUTPUT SETTINGS
--------------------------------------------

Output Folder
[/Transcriptions                           ] [Browse]

[X] Include timestamps in transcription
[X] Auto-create tags from analysis
[X] Skip files that are already analyzed

            [Save Settings]
============================================
```

### Step 4: Transcribing Your First Audio File

There are two ways to start transcription:

**Method 1: Right-click on an audio file**

1. In your file explorer, find an audio file (meeting-2025-01-15.m4a)
2. Right-click on it
3. Select "Transcribe audio file" from the context menu

```text
File: meeting-2025-01-15.m4a
-----------------------------
Rename
Delete
Copy path
Move file
> Transcribe audio file  <-- Click here!
Properties
```

**Method 2: Use the ribbon icon**

1. Click the microphone icon in the left sidebar
2. A file picker appears
3. Select your audio file

### Step 5: Watching the Progress

You'll see a notification in the bottom-right corner:

```text
======================================
  Transcribing: meeting-2025-01-15
======================================

  Step 1/3: Transcribing audio...
  Progress: [########..] 73%

  Estimated time: 4 minutes remaining

       [Cancel Transcription]
======================================
```

After transcription completes:

```text
======================================
  Transcribing: meeting-2025-01-15
======================================

  Step 2/3: Analyzing content...
  Extracting key points and actions

  [#########.] 85%
======================================
```

Then:

```text
======================================
  Transcribing: meeting-2025-01-15
======================================

  Step 3/3: Creating markdown file...

  [###########] 100%
======================================
```

Finally:

```text
======================================
      ✓ Transcription Complete
======================================

  File created: meeting-2025-01-15.md

  Duration: 1:32:45
  Processing time: 18 minutes

       [Open File]  [Dismiss]
======================================
```

### Step 6: Viewing the Results

Clicking "Open File" opens your new markdown note:

````markdown
---
audio_file: "meeting-2025-01-15.m4a"
duration: "1:32:45"
transcribed_date: 2025-01-15T14:32:00
language: "en"
speakers: 3
tags: [meeting, transcription, project-alpha, budget-review]
---

# Meeting Transcription: Q1 Budget Review

**Audio File:** meeting-2025-01-15.m4a
**Date:** January 15, 2025
**Duration:** 1 hour 32 minutes
**Participants:** 3 speakers identified

---

## Summary

This meeting covered the Q1 budget review for Project Alpha. The team discussed resource allocation, timeline adjustments due to staffing changes, and identified three critical blockers that need immediate attention. A follow-up meeting was scheduled for next week to finalize the revised timeline.

---

## Key Points

- **Budget approved** for additional contractor support ($45K)
- **Timeline extended** by 2 weeks due to Sarah's onboarding delay
- **Marketing campaign** launch postponed to March 1st
- **New feature request** from client - needs feasibility assessment
- **Risk identified**: Current API rate limits may impact performance testing
- **Decision made**: Switch to microservices architecture for Phase 2

---

## Action Items

- [ ] @john Review and approve contractor agreements by Friday (Jan 19)
- [ ] @sarah Set up development environment and complete onboarding checklist
- [ ] @mike Research API rate limit solutions and present options (due: Jan 22)
- [ ] @team Update project timeline in Jira with new milestones
- [ ] @john Schedule client call to discuss new feature request
- [ ] @sarah Create technical specification for microservices migration

---

## Follow-up Questions

- What is the exact scope of the new client feature request?
- Do we have budget flexibility if API solution requires paid tier upgrade?
- Has legal reviewed the contractor agreements?
- When will the new designer start?

---

## Full Transcription

**Speaker 1 (John)** [00:00:15]
Good morning everyone. Thanks for joining today's Q1 budget review. I know we're all busy, so let's try to keep this focused. Sarah, welcome to the team - this is your first planning meeting with us.

**Speaker 2 (Sarah)** [00:00:28]
Thanks John! Happy to be here. Looking forward to diving in.

**Speaker 1 (John)** [00:00:32]
Great. So let me start with the budget overview. We've been tracking expenses closely, and I'm happy to report we're actually 8% under budget for Q4, which gives us some flexibility going forward.

**Speaker 3 (Mike)** [00:00:48]
That's great news. Does that mean we can move forward with the contractor support we discussed?

**Speaker 1 (John)** [00:00:53]
Yes, exactly. I'm proposing we allocate $45,000 for two contractors to help with the frontend work. This should accelerate our timeline significantly.

**Speaker 2 (Sarah)** [00:01:08]
Just to clarify - would these contractors be working on the React components or the new design system?

**Speaker 1 (John)** [00:01:15]
Both, actually. We need someone who can implement the designs and also help establish the component library patterns.

[Transcription continues for full 1:32:45...]

---

**Speaker 3 (Mike)** [01:31:52]
Alright, I think we've covered everything. I'll send out the meeting notes later today.

**Speaker 1 (John)** [01:32:02]
Perfect. Thanks everyone. Let's sync up again next Tuesday.

**Speaker 2 (Sarah)** [01:32:08]
Sounds good. Thanks all!

[End of transcription]
````

### Step 7: What Happens If You Try Again?

If you right-click on the same audio file and select "Transcribe audio file" again:

```text
======================================
     Analysis Already Exists
======================================

  This audio file has already been
  transcribed and analyzed.

  File: meeting-2025-01-15.md
  Created: 2025-01-15 at 14:32

  [Open Existing File]  [OK]
======================================
```

This prevents accidental duplicate processing and wasted time.

### Step 8: Error Handling Example

If something goes wrong during transcription:

```text
======================================
       Transcription Failed
======================================

  ⚠ The transcription process failed

  Error: Could not process audio file

  Possible causes:
  - Audio file may be corrupted
  - Unsupported audio codec
  - Insufficient disk space

  The plugin automatically retried
  once but encountered the same error.

  [View Detailed Logs]  [Close]
======================================
```

---

## Installation

### Requirements

- **Obsidian** v1.4.0 or higher
- **For Local Processing:**
  - 4GB+ RAM (8GB recommended for large models)
  - 2-3GB free disk space for models
  - Windows 10/11 (64-bit)
- **For Cloud Processing:**
  - Internet connection
  - API key from OpenAI or OpenRouter

### Install from Community Plugins (Recommended)

1. Open Obsidian Settings
2. Go to "Community Plugins" and disable Safe Mode
3. Click "Browse" to open the community plugins browser
4. Search for "Audio Transcription"
5. Click "Install"
6. Once installed, enable the plugin
7. Follow the first-time setup wizard to download models

### Manual Installation (Advanced)

1. Download the latest release from GitHub
2. Extract the files to `<vault>/.obsidian/plugins/obsidian-transcription-plugin/`
3. Reload Obsidian
4. Enable the plugin in Settings > Community Plugins

---

## Setup Guide

### Option 1: Local Processing (Recommended for Privacy)

**Advantages:**

- Complete privacy - audio never leaves your device
- No ongoing costs
- Works offline
- Full control over processing

**Setup Steps:**

1. Open plugin settings
2. Select "Local (Whisper.cpp)" as processing mode
3. Choose your model size:
   - **Small (466 MB)**: Fast, good for English-only, basic quality
   - **Medium (1.5 GB)**: Recommended - balanced speed/quality, good Greek support
   - **Large (2.9 GB)**: Best quality, excellent multilingual, slower
4. Click "Download Selected Model"
5. Wait for download to complete (one-time only)

**Note:** First transcription may take a few minutes as the system initializes. Subsequent transcriptions will be faster.

### Option 2: Cloud Processing with OpenAI Whisper

**Advantages:**

- Faster processing
- No large downloads required
- Works on any device
- Excellent accuracy

**Cost:** ~$0.006 per minute (~$0.72 for 2-hour recording)

**Setup Steps:**

1. Get an OpenAI API key from https://platform.openai.com/api-keys
2. Open plugin settings
3. Select "Cloud (OpenAI Whisper)" as processing mode
4. Paste your API key in the "OpenAI API Key" field
5. Save settings

### Option 3: Cloud Processing with OpenRouter

**Advantages:**

- Access to multiple AI models
- Often cheaper than OpenAI
- Flexible model selection

**Setup Steps:**

1. Get an OpenRouter API key from https://openrouter.ai/keys
2. Open plugin settings
3. Select "Cloud (OpenRouter)" as processing mode
4. Paste your API key in the "OpenRouter API Key" field
5. Enter your preferred model name (e.g., `openai/whisper-large-v3`)
6. Save settings

### Configuring Analysis (AI Insights)

The plugin can analyze your transcriptions to extract key information.

**Option 1: Local Analysis with Ollama (Free)**

1. Install Ollama from https://ollama.ai
2. Run `ollama pull llama3.2:3b` in your terminal
3. In plugin settings, select "Local (Ollama)" as analysis provider
4. The plugin will automatically connect to Ollama

**Option 2: Cloud Analysis with OpenRouter**

1. Get an OpenRouter API key (same as above)
2. In plugin settings, select "Cloud (OpenRouter)" as analysis provider
3. Paste your API key
4. Choose a model (recommended: `meta-llama/llama-3.2-3b-instruct`)

### Adding Custom Analysis Instructions

Want the AI to focus on specific things? Add custom instructions:

**Examples:**

**For project meetings:**

```text
- Tag all participants with @ symbol
- Identify technical decisions and mark with [DECISION]
- Flag any mentioned deadlines with [DEADLINE]
- Highlight budget discussions
```

**For lecture notes:**

```text
- Extract key concepts and definitions
- Create a glossary of technical terms
- Identify examples and case studies
- Note any assigned homework or readings
```

**For interviews:**

```text
- Identify main themes discussed
- Extract interesting quotes verbatim
- Note emotional reactions or emphasis
- Highlight follow-up topics
```

---

## Usage Examples

### Example 1: Team Meeting Notes

**Scenario:** You recorded a 45-minute team standup meeting with 4 participants.

**Steps:**

1. Save recording as `team-standup-2025-01-15.m4a` in your vault
2. Right-click → "Transcribe audio file"
3. Wait ~8-12 minutes (medium model, local processing)
4. Open the generated `team-standup-2025-01-15.md` file

**Result:** You get a complete transcription with:

- Each person's comments identified
- Action items automatically extracted as checkboxes
- Key decisions highlighted
- Tagged with relevant project names

### Example 2: Client Call (Confidential)

**Scenario:** 1-hour client discussion with sensitive information. Privacy is critical.

**Steps:**

1. Ensure you're using local processing (no cloud APIs)
2. Record and save as `client-call-acme-corp.m4a`
3. Add custom instruction: "Identify all commitments made to the client"
4. Transcribe

**Result:** Complete transcription that never left your computer, with client commitments clearly marked.

### Example 3: Greek Language Lecture

**Scenario:** 90-minute university lecture in Greek

**Steps:**

1. Use large model for best Greek support
2. Set language to "Greek only" or "Auto-detect"
3. Add custom instruction: "Extract key concepts and create a glossary of technical terms"
4. Transcribe

**Result:** Full Greek transcription with technical terms identified and defined.

### Example 4: Bilingual Meeting (English + Greek)

**Scenario:** Meeting where participants switch between English and Greek

**Steps:**

1. Use medium or large model
2. Set language to "Multilingual (both)" or "Auto-detect"
3. Transcribe

**Result:** Accurate transcription with both languages correctly identified and transcribed.

---

## How It Works (Behind the Scenes)

### The Transcription Process

1. **Pre-check:** Plugin checks if this audio file was already transcribed
2. **Model Check:** Verifies the selected model is downloaded
3. **Audio Loading:** Reads the audio file from your vault
4. **Chunking:** For long files, splits audio into manageable segments (30-min chunks)
5. **Transcription:** Processes each chunk with Whisper
6. **Speaker Diarization:** If enabled, identifies different speakers
7. **Language Detection:** Automatically detects language(s) in the audio
8. **Assembly:** Combines all chunks into complete transcript

### The Analysis Process

1. **Transcript Review:** AI reads the complete transcription
2. **Context Understanding:** Identifies the type of content (meeting, lecture, etc.)
3. **Custom Instructions:** Applies any user-defined analysis rules
4. **Extraction:** Pulls out:
   - Summary (2-3 sentences)
   - Key points (bullet list)
   - Action items (as checkboxes with assignees)
   - Follow-up questions
   - Relevant tags
5. **Formatting:** Creates structured markdown output

### Privacy & Data Flow

**Local Processing:**

```text
Your Audio File → Your Computer → Whisper Model → Transcription
                                        ↓
                               Ollama (Local) → Analysis
                                        ↓
                            Your Vault (.md file)
```

Nothing leaves your computer. Complete privacy.

**Cloud Processing:**

```text
Your Audio File → OpenAI/OpenRouter API → Transcription
                                                ↓
                        OpenRouter API → Analysis
                                                ↓
                            Your Vault (.md file)
```

Audio and transcript sent to external servers. Review your API provider's privacy policy.

---

## Frequently Asked Questions (FAQ)

### General Questions

**Q: How accurate is the transcription?**

A: Using the medium or large model, transcription accuracy is typically 90-95% for clear audio in English or Greek. Accuracy depends on:

- Audio quality (clear recordings work best)
- Background noise (quiet environments ideal)
- Speaker clarity (distinct voices help)
- Language complexity (technical jargon may need review)

**Q: Can it handle multiple speakers?**

A: Yes! When speaker diarization is enabled, the plugin identifies different speakers and labels them as "Speaker 1", "Speaker 2", etc. It cannot currently identify speakers by name automatically.

**Q: What audio formats are supported?**

A: Currently .m4a and .mp3 files. Support for .wav, .ogg, and .flac may be added in future versions.

**Q: How long does transcription take?**

A: Processing time varies:

- Small model: ~0.1-0.2x realtime (10-min audio = 1-2 min processing)
- Medium model: ~0.3-0.5x realtime (1-hour audio = 18-30 min processing)
- Large model: ~0.5-1x realtime (1-hour audio = 30-60 min processing)
- Cloud APIs: Much faster, usually 0.05-0.1x realtime

**Q: Will it work offline?**

A: Yes, if you use local processing. Once models are downloaded, you can transcribe without internet.

### Technical Questions

**Q: Where are models stored?**

A: Models are stored in `<vault>/.obsidian/plugins/obsidian-transcription-plugin/models/`

**Q: Can I use my own Whisper model?**

A: Currently, the plugin uses official Whisper.cpp models from HuggingFace. Custom model support may be added later.

**Q: What if I don't have Ollama installed?**

A: You can still use cloud analysis via OpenRouter, or skip the analysis step and just get the transcription.

**Q: How much disk space do I need?**

A: Model sizes:

- Tiny: 75 MB
- Base: 142 MB
- Small: 466 MB
- Medium: 1.5 GB
- Large: 2.9 GB

Plus temporary space for audio processing (usually 2-3x the audio file size).

**Q: Does it work on mobile (iOS/Android)?**

A: Not yet. Currently Windows desktop only. Mobile support may come in future updates.

### Troubleshooting Questions

**Q: Transcription failed with "model not found" error**

A: Go to Settings → Audio Transcription → Model Management and download your selected model.

**Q: The transcription is very inaccurate**

A: Try these solutions:

- Upgrade to a larger model (medium or large)
- Check audio quality - clear recordings work best
- Set the correct language instead of auto-detect
- Ensure audio file isn't corrupted

**Q: Plugin says "analysis already available" but I don't see a file**

A: The markdown file might be in your configured output folder. Check Settings → Audio Transcription → Output Settings to see the folder path.

**Q: Processing is very slow**

A:

- Local processing is CPU-intensive. Close other applications.
- Try a smaller model (small instead of medium)
- Consider using cloud processing for faster results
- Check if your antivirus is scanning the process

**Q: Speaker diarization isn't working**

A: Speaker diarization requires cloud processing with Assembly AI (coming in Phase 3) or local pyannote installation (advanced). Currently limited functionality.

### Usage Questions

**Q: Can I edit the transcription after it's created?**

A: Absolutely! It's a markdown file in your vault. Edit it like any other note.

**Q: Can I re-transcribe if I'm not happy with the results?**

A: Yes. Delete the generated markdown file first, then transcribe again. The plugin skips files that already have analysis.

**Q: Can I transcribe video files?**

A: Not directly. Extract the audio first using a tool like VLC or FFmpeg, then transcribe the audio file.

**Q: How do I share transcriptions with others?**

A: They're standard markdown files. Export to PDF, copy the text, or share the .md file directly.

### Privacy & Cost Questions

**Q: Is my audio data private?**

A: With local processing: Yes, completely private. Audio never leaves your device.
With cloud processing: Audio is sent to API provider (OpenAI, OpenRouter). Check their privacy policies.

**Q: How much do cloud APIs cost?**

A: Approximate costs:

- OpenAI Whisper: $0.006/minute ($7.20 per 20 hours)
- OpenRouter: Varies by model, often cheaper
- Local processing: Free (after model download)

**Q: Do I need a paid Obsidian account?**

A: No. This plugin works with free Obsidian.

---

## Roadmap

### Current Features (v1.0)

- ✓ Local Whisper.cpp transcription
- ✓ Cloud transcription (OpenAI, OpenRouter)
- ✓ Greek and English language support
- ✓ AI-powered analysis and extraction
- ✓ Customizable analysis instructions
- ✓ Automatic model management
- ✓ Duplicate detection
- ✓ Error retry logic
- ✓ Custom prompt templates

### Planned Features (Future Versions)

#### v1.1 - Enhanced Analysis

- Multiple analysis profiles (meeting, lecture, interview)
- Improved speaker identification
- Export to other formats (PDF, DOCX)

#### v1.2 - Speaker Diarization

- Full speaker identification
- Speaker labeling and naming
- Improved multi-speaker accuracy

#### v2.0 - Advanced Features

- Real-time transcription during recording
- Video file support (auto-extract audio)
- Batch processing (multiple files at once)
- Mobile app support (iOS/Android)
- Integration with other plugins (Calendar, Tasks)

#### Community Requests

- Your feedback shapes the roadmap! Submit feature requests on GitHub.

---

## Support & Community

### Getting Help

- **Documentation**: You're reading it!
- **GitHub Issues**: Report bugs or request features at [github.com/tzamtzis/obsidian-transcription-plugin](github.com/tzamtzis/obsidian-transcription-plugin)
- **Obsidian Forum**: Discuss the plugin with other users

### Contributing

This is an open-source project! Contributions welcome:

- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation
- Share your use cases

### License

MIT License - Free to use, modify, and distribute.

---

## Credits

**Built with:**

- [Whisper.cpp](https://github.com/ggerganov/whisper.cpp) - Fast C++ implementation of OpenAI Whisper
- [Obsidian API](https://github.com/obsidianmd/obsidian-api) - Plugin framework
- [OpenAI Whisper](https://openai.com/research/whisper) - Original transcription model

**Special Thanks:**

- OpenAI for creating Whisper
- Georgi Gerganov for whisper.cpp
- Obsidian team for the amazing plugin API
- Beta testers and early adopters

---

## Changelog

### v1.0.0 (2026-01-27)

- Initial release
- Local and cloud transcription
- Greek and English support
- AI-powered analysis
- Automatic model management
- Windows desktop support

---

**Made with ♥ for the Obsidian community**

Transform your audio into knowledge. Start transcribing today!
