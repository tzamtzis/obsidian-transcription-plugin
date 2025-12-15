# Testing Guide - Audio Transcription Plugin

This document provides a comprehensive testing plan for the Obsidian Audio Transcription Plugin.

## Table of Contents

- [Test Environment Setup](#test-environment-setup)
- [Test Data Preparation](#test-data-preparation)
- [Test Cases](#test-cases)
- [Test Results Template](#test-results-template)
- [Known Issues and Limitations](#known-issues-and-limitations)

---

## Test Environment Setup

### Prerequisites

1. **Obsidian installed** (latest version recommended)
2. **Plugin installed** in Obsidian vault
3. **FFmpeg installed** (for local processing)
   - Windows: Download from https://ffmpeg.org or use `choco install ffmpeg`
   - macOS: `brew install ffmpeg`
   - Linux: `sudo apt install ffmpeg`

### For Local Processing

**Windows Users - Important:**
- Install Visual C++ Redistributable first: https://aka.ms/vs/17/release/vc_redist.x64.exe
- Required for whisper.cpp to run (prevents error 3221225781)
- Restart Obsidian after installation

**All Platforms:**
1. Download Whisper.cpp binary (via plugin settings)
2. Download at least one model (recommend: medium for Greek/English)
3. Verify binary and model status in Settings → System Status

### For Cloud Processing

1. **OpenAI API Key** (for Whisper API)
   - Get from: https://platform.openai.com/api-keys
   - Add to: Settings → API Keys → OpenAI API key

2. **OpenRouter API Key** (for analysis)
   - Get from: https://openrouter.ai/keys
   - Add to: Settings → API Keys → OpenRouter API key

### Recommended Test Vault Structure

```text
test-vault/
├── audio-samples/
│   ├── m4a/
│   ├── mp3/
│   ├── wav/
│   └── long-files/
└── Transcriptions/  (output folder)
```

---

## Test Data Preparation

### Where to Get Test Audio Files

1. **Record your own**
   - Use your phone or computer to record test audio
   - Create samples in different languages (Greek, English)
   - Vary lengths: short (30s), medium (5min), long (1hr+)

2. **Free audio resources**
   - LibriVox (free audiobooks): https://librivox.org
   - Common Voice (Mozilla): https://commonvoice.mozilla.org
   - BBC Sounds (some free content)
   - Podcast episodes (check license)

3. **Generate test files**
   - Use text-to-speech to create known content
   - Record yourself reading a script (easier to verify accuracy)

### Test File Requirements

| Test Category | File Format | Duration | Content | Purpose |
|--------------|-------------|----------|---------|---------|
| Format: M4A | .m4a | 1-2 min | English speech | Verify M4A codec handling |
| Format: MP3 | .mp3 | 1-2 min | English speech | Verify MP3 bitrate handling |
| Format: WAV | .wav (16kHz) | 1-2 min | Any speech | Verify WAV passthrough |
| Format: WAV | .wav (44.1kHz) | 1-2 min | Any speech | Verify downsampling |
| Long file | Any | 2+ hours | Lecture/podcast | Verify long file handling |
| Greek | Any | 2-5 min | Greek speech | Verify Greek transcription |
| English | Any | 2-5 min | English speech | Verify English transcription |
| Mixed | Any | 2-5 min | Greek + English | Verify multilingual mode |
| Multi-speaker | Any | 2-5 min | 2+ speakers | Test diarization support |

### Creating Test Files with Known Content

```bash
# Example: Create a WAV file with known text using text-to-speech
# macOS
say "This is a test of the transcription system. The quick brown fox jumps over the lazy dog." -o test-english.wav

# Windows (PowerShell)
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SetOutputToWaveFile("test-english.wav")
$synth.Speak("This is a test of the transcription system.")
$synth.Dispose()
```

---

## Test Cases

### 1. Audio Format Tests

#### Test 1.1: M4A File Processing

**Objective**: Verify M4A files transcribe correctly

**Steps**:
1. Add M4A file to vault
2. Right-click → "Transcribe audio file"
3. Verify processing starts and completes
4. Check output markdown file

**Expected Results**:
- ✅ File processes without errors
- ✅ Audio is converted if needed (check for .temp.wav)
- ✅ Transcription text is accurate
- ✅ Markdown file created in correct location
- ✅ Frontmatter contains correct metadata

**Test with**:
- [ ] AAC-encoded M4A
- [ ] ALAC-encoded M4A
- [ ] Different bitrates (128k, 256k, 320k)

---

#### Test 1.2: MP3 File Processing

**Objective**: Verify MP3 files transcribe correctly

**Steps**:
1. Add MP3 file to vault
2. Right-click → "Transcribe audio file"
3. Verify processing starts and completes
4. Check output markdown file

**Expected Results**:
- ✅ File processes without errors
- ✅ Audio conversion works correctly
- ✅ Transcription accuracy is good
- ✅ Duration is calculated correctly

**Test with**:
- [ ] 128 kbps MP3
- [ ] 192 kbps MP3
- [ ] 320 kbps MP3 (VBR)

---

#### Test 1.3: WAV File Processing

**Objective**: Verify WAV files are handled efficiently

**Steps**:
1. Test with 16kHz WAV (should skip conversion)
2. Test with 44.1kHz WAV (should convert)
3. Test with 48kHz WAV (should convert)
4. Compare processing times

**Expected Results**:
- ✅ 16kHz files: No .temp.wav created (passthrough)
- ✅ Other rates: Converted to 16kHz
- ✅ Processing time faster for 16kHz files
- ✅ Transcription quality equivalent

**Test with**:
- [ ] 16kHz WAV (should NOT convert)
- [ ] 44.1kHz WAV (should convert)
- [ ] 48kHz WAV (should convert)

---

### 2. Long Audio File Tests

#### Test 2.1: Long File Processing

**Objective**: Verify plugin handles long audio files (2+ hours)

**Steps**:
1. Add 2-hour audio file to vault
2. Note start time
3. Start transcription
4. Monitor progress modal
5. Verify completion
6. Note end time

**Expected Results**:
- ✅ File size warning shown (if >100MB)
- ✅ Estimated time displayed before starting
- ✅ Progress modal updates regularly
- ✅ No memory issues or crashes
- ✅ Processing completes successfully
- ✅ Table of contents added (for 10+ min files)
- ✅ Output file is well-formatted

**Metrics to Record**:
- Audio duration: _____ minutes
- Processing time: _____ minutes
- Realtime factor: _____ x
- Model used: _____
- File size: _____ MB

**Test with**:
- [ ] 2-hour lecture (local processing)
- [ ] 2-hour podcast (cloud processing)
- [ ] Compare processing times

---

### 3. Language Tests

#### Test 3.1: Greek Language Transcription

**Objective**: Verify Greek speech is transcribed accurately

**Setup**: Settings → Language → "Greek only"

**Test Content**: Use Greek speech (news, podcast, or record yourself)

**Expected Results**:
- ✅ Greek characters rendered correctly
- ✅ Transcription accuracy >85%
- ✅ Common Greek words recognized
- ✅ Language metadata: "el"

**Accuracy Test**:
- Manually count errors in first 100 words
- Calculate accuracy: (100 - errors) / 100
- Target: >85% accuracy

**Test with**:
- [ ] Greek news clip
- [ ] Greek podcast segment
- [ ] Self-recorded Greek speech

---

#### Test 3.2: English Language Transcription

**Objective**: Verify English speech is transcribed accurately

**Setup**: Settings → Language → "English only"

**Test Content**: Use clear English speech

**Expected Results**:
- ✅ English words spelled correctly
- ✅ Punctuation added appropriately
- ✅ Capitalization correct
- ✅ Transcription accuracy >90%
- ✅ Language metadata: "en"

**Test with**:
- [ ] English podcast
- [ ] English audiobook
- [ ] Self-recorded English speech

---

#### Test 3.3: Auto-Detect Language Mode

**Objective**: Verify language auto-detection works

**Setup**: Settings → Language → "Auto-detect"

**Expected Results**:
- ✅ Correctly identifies Greek audio
- ✅ Correctly identifies English audio
- ✅ Language metadata matches actual language

**Test with**:
- [ ] Greek audio (should detect "el")
- [ ] English audio (should detect "en")
- [ ] Mixed language audio

---

#### Test 3.4: Multilingual Mode

**Objective**: Verify handling of mixed Greek/English content

**Setup**: Settings → Language → "Multilingual (both English and Greek)"

**Test Content**: Audio with both Greek and English

**Expected Results**:
- ✅ Both languages transcribed
- ✅ No language switches break transcription
- ✅ Both character sets rendered correctly

**Test with**:
- [ ] Greek speaker with English terms
- [ ] English speaker with Greek phrases
- [ ] Conversation switching between languages

---

### 4. Cloud Processing Tests

#### Test 4.1: OpenAI Whisper API Transcription

**Objective**: Verify cloud transcription works

**Setup**:
- Settings → Processing Mode → "Cloud (OpenAI Whisper)"
- Ensure API key configured

**Expected Results**:
- ✅ File uploads successfully
- ✅ Processing is faster than local (~0.1x realtime)
- ✅ Transcription quality is high
- ✅ Estimated time shown before start
- ✅ Progress modal shows cloud processing

**Test with**:
- [ ] Short file (1 min)
- [ ] Medium file (10 min)
- [ ] Large file (check 25MB limit)

**Error Cases**:
- [ ] Invalid API key (should show clear error)
- [ ] File too large >25MB (should show error)
- [ ] Network timeout (should handle gracefully)

---

#### Test 4.2: OpenRouter Analysis

**Objective**: Verify AI analysis of transcripts works

**Setup**: Ensure OpenRouter API key configured

**Expected Results**:
- ✅ Summary generated
- ✅ Key points extracted (3-7 points)
- ✅ Action items identified (if any)
- ✅ Follow-up questions generated (if any)
- ✅ Analysis is relevant and accurate

**Test with**:
- [ ] Meeting recording (should extract action items)
- [ ] Lecture (should extract key concepts)
- [ ] Interview (should identify themes)

---

### 5. Error Scenario Tests

#### Test 5.1: Missing FFmpeg

**Objective**: Verify clear error when FFmpeg not installed

**Setup**: Temporarily rename or uninstall FFmpeg

**Expected Results**:
- ✅ Clear error message about missing FFmpeg
- ✅ Instructions on how to install FFmpeg
- ✅ Links to download page

---

#### Test 5.2: Missing Whisper Binary

**Objective**: Verify clear error when binary not downloaded

**Setup**:
- Set to local processing
- Delete whisper.cpp binary

**Expected Results**:
- ✅ Validation error before transcription starts
- ✅ Clear message about missing binary
- ✅ Instructions to download from settings

---

#### Test 5.3: Missing Model

**Objective**: Verify clear error when model not downloaded

**Setup**:
- Set to local processing
- Delete model file

**Expected Results**:
- ✅ Validation error before transcription starts
- ✅ Clear message about missing model
- ✅ Instructions to download from settings

---

#### Test 5.4: Invalid API Keys

**Objective**: Verify clear errors for invalid API keys

**Test Cases**:
1. Invalid OpenAI key
2. Invalid OpenRouter key
3. Missing API keys
4. Revoked API keys

**Expected Results**:
- ✅ Validation catches invalid format before API call
- ✅ 401 errors handled gracefully
- ✅ Clear error messages
- ✅ Instructions to check settings

---

#### Test 5.5: Network Failures

**Objective**: Verify graceful handling of network issues

**Test Cases**:
1. Disconnect network during cloud transcription
2. Timeout during upload
3. API service unavailable

**Expected Results**:
- ✅ Retry logic attempts once
- ✅ Clear error message on failure
- ✅ No data loss or corruption
- ✅ Progress modal shows error state

---

#### Test 5.6: Corrupted Audio Files

**Objective**: Verify handling of invalid audio files

**Test Cases**:
1. Rename .txt file to .m4a
2. Truncated audio file
3. Unsupported codec

**Expected Results**:
- ✅ FFmpeg error caught and reported
- ✅ Clear error message
- ✅ No crash or hang
- ✅ Suggests checking file format

---

### 6. UI/UX Tests

#### Test 6.1: Progress Modal

**Objective**: Verify progress modal works correctly

**Expected Results**:
- ✅ Modal appears when transcription starts
- ✅ Shows correct steps: validation → transcription → analysis → saving
- ✅ Progress bar updates
- ✅ Color changes for each step
- ✅ Percentage displayed
- ✅ Cancel button works
- ✅ Auto-closes on completion
- ✅ Shows errors clearly

---

#### Test 6.2: Settings Interface

**Objective**: Verify all settings work correctly

**Test Each Setting**:
- [ ] Processing mode dropdown (changes UI correctly)
- [ ] Model size dropdown (local mode only)
- [ ] Language dropdown
- [ ] Diarization toggle (shows/hides speaker count)
- [ ] Speaker count slider (when diarization enabled)
- [ ] Custom instructions text area
- [ ] API key fields (password type)
- [ ] Output folder setting
- [ ] Include timestamps toggle
- [ ] Auto-create tags toggle
- [ ] Ribbon icon dropdown (icon changes immediately)

---

#### Test 6.3: System Status Display

**Objective**: Verify system status shows correctly

**Expected Results**:
- ✅ Binary status: Shows ✅ if installed, ❌ if not
- ✅ Model status: Shows ✅ if downloaded, ❌ if not
- ✅ Updates when files change
- ✅ Model size recommendations show correct info
- ✅ RAM and CPU count displayed accurately

---

#### Test 6.4: Recent Transcriptions List

**Objective**: Verify recent transcriptions tracking works

**Steps**:
1. Transcribe several files
2. Check Settings → Recent Transcriptions
3. Click on entries to open files
4. Clear history

**Expected Results**:
- ✅ Shows last 10 transcriptions
- ✅ Displays filename, date, time, duration, language
- ✅ Clicking opens the markdown file
- ✅ "Clear All" button removes all entries
- ✅ Shows "No recent transcriptions" when empty

---

### 7. Output Format Tests

#### Test 7.1: Markdown Format

**Objective**: Verify output markdown is well-formatted

**Expected Sections**:
- ✅ Frontmatter with metadata
- ✅ Title (audio filename)
- ✅ Header with date, duration, language
- ✅ Speaker instructions (if diarization enabled)
- ✅ Table of contents (for 10+ min files)
- ✅ Summary section
- ✅ Key Points section
- ✅ Action Items section (if any)
- ✅ Follow-up Questions section (if any)
- ✅ Full Transcription section
- ✅ Footer

---

#### Test 7.2: Timestamp Format

**Objective**: Verify timestamps are formatted correctly

**Setup**: Enable "Include timestamps"

**Expected Results**:
- ✅ Format: [MM:SS] or [HH:MM:SS]
- ✅ Timestamps accurate to segment start
- ✅ Speaker labels appear after timestamp
- ✅ Text is readable with timestamps

**Example**:
```
[00:15] **Speaker 1:** Hello everyone, welcome to today's meeting.
[00:23] **Speaker 2:** Thanks for joining us.
```

---

#### Test 7.3: Speaker Labels

**Objective**: Verify speaker labels display correctly

**Setup**: Enable diarization (manual mode)

**Expected Results**:
- ✅ Speaker renaming instructions shown
- ✅ Format: **Speaker N:**
- ✅ Consistent numbering throughout
- ✅ Find & Replace instructions work

---

### 8. Performance Tests

#### Test 8.1: Model Performance Comparison

**Objective**: Compare speed vs accuracy of different models

**Test**: Same audio file with each model

| Model | Size | Duration | Processing Time | Realtime Factor | Accuracy | Notes |
|-------|------|----------|-----------------|-----------------|----------|-------|
| Tiny | 75 MB | 5 min | | | | |
| Base | 142 MB | 5 min | | | | |
| Small | 466 MB | 5 min | | | | |
| Medium | 1.5 GB | 5 min | | | | |
| Large | 2.9 GB | 5 min | | | | |

---

#### Test 8.2: Cloud vs Local Performance

**Objective**: Compare cloud and local processing

**Test**: Same file with both methods

| Method | Duration | Processing Time | Accuracy | Cost | Notes |
|--------|----------|-----------------|----------|------|-------|
| Local (medium) | 5 min | | | $0 | |
| Cloud (OpenAI) | 5 min | | | ~$0.03 | |

---

## Test Results Template

### Test Session Information

```markdown
## Test Session: [Date]

**Tester**: [Name]
**Plugin Version**: [Version]
**Obsidian Version**: [Version]
**OS**: [Windows/macOS/Linux] [Version]
**FFmpeg Version**: [Version]

### Environment
- [ ] Local processing tested
- [ ] Cloud processing tested
- [ ] Greek language tested
- [ ] English language tested

### Test Results Summary

Total Tests: ___
Passed: ___
Failed: ___
Skipped: ___

Pass Rate: ___%
```

### Individual Test Result

```markdown
### Test: [Test Name]

**Status**: ✅ PASS / ❌ FAIL / ⏭️ SKIP

**Steps**:
1.
2.
3.

**Expected Result**:


**Actual Result**:


**Notes**:


**Screenshots**: (if applicable)

**Logs**: (paste relevant logs)
```

---

## Known Issues and Limitations

### Current Limitations

1. **Speaker Diarization**: Not automatically implemented yet
   - Manual editing required via Find & Replace

2. **Platform Support**: Currently Windows-focused
   - macOS/Linux binary downloads not implemented
   - FFmpeg detection may need manual setup on non-Windows

3. **File Size Limits**:
   - OpenAI Whisper API: 25MB limit
   - Large files may require significant processing time

4. **Language Support**:
   - Optimized for Greek and English
   - Other languages untested

### Workarounds

1. **Large Files**: Use local processing or split files
2. **Diarization**: Manually edit speaker labels after transcription
3. **macOS/Linux**: Manually download whisper.cpp binary

---

## Debugging Tips

### Enable Console Logging

1. Open Obsidian Developer Tools: Ctrl+Shift+I (Windows) or Cmd+Option+I (macOS)
2. Go to Console tab
3. Look for messages starting with "Audio Transcription:"

### Common Issues

**"FFmpeg not found"**
- Verify FFmpeg installed: `ffmpeg -version` in terminal
- Add FFmpeg to PATH

**"Model not found"**
- Check Settings → Model Management
- Verify model downloaded to correct location
- Check file: `./models/[model-name].bin`

**"API key invalid"**
- Check API key format (OpenAI: sk-..., OpenRouter: sk-or-...)
- Verify key is active on provider website
- Check for extra spaces when copying

**Transcription hangs**
- Check console for errors
- Verify audio file is valid
- Try smaller test file first

---

## Reporting Issues

When reporting issues, please include:

1. **Plugin version**
2. **Obsidian version**
3. **Operating system**
4. **Processing mode** (local/cloud)
5. **Audio file format and size**
6. **Steps to reproduce**
7. **Expected vs actual behavior**
8. **Console logs** (if available)
9. **Screenshots** (if UI issue)

Submit issues at: https://github.com/[username]/obsidian-transcription-plugin/issues

---

**Good luck with testing!** 🎯
