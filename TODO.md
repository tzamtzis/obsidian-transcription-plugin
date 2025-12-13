# TODO - Obsidian Audio Transcription Plugin

## High Priority

### 1. Testing with Real Audio Files

- [ ] Test with m4a files (various codecs)
- [ ] Test with mp3 files (various bitrates)
- [ ] Test with WAV files (verify 16kHz conversion skipping)
- [ ] Test with long audio files (2+ hours)
- [ ] Test Greek language transcription
- [ ] Test English language transcription
- [ ] Test auto-detect language mode
- [ ] Test cloud transcription (OpenAI Whisper API)
- [ ] Test cloud analysis (OpenRouter)
- [ ] Test error scenarios (corrupted files, network failures, etc.)

### 2. Platform Support

- [ ] Add macOS support for whisper.cpp binary
  - Detect platform in LocalWhisperProcessor constructor
  - Update binary URL for macOS builds
  - Update binary filename (no .exe extension)
- [ ] Add Linux support for whisper.cpp binary
  - Add platform detection
  - Add Linux binary URLs
- [ ] Make ffmpeg detection cross-platform
- [ ] Test on macOS
- [ ] Test on Linux

### 3. Output Formatting Improvements

- [x] Implement timestamp inclusion setting
  - Add timestamps to each segment when enabled
  - Format: `[00:01:23] Speaker text here`
- [x] Implement output folder creation
  - Create folder if it doesn't exist
  - Handle nested folder paths
- [x] Add speaker labels to transcript when diarization is available
- [x] Improve markdown formatting
  - Better section spacing
  - Add table of contents for long transcripts (10+ minutes)
  - Add metadata section with file info

## Medium Priority

### 4. Speaker Diarization (Nice-to-Have)

- [ ] Research diarization options compatible with whisper.cpp
- [ ] Implement pyannote-audio integration (if feasible)
- [ ] Add speaker count setting
- [ ] Update transcript format to include speaker labels
- [ ] Add speaker renaming UI in generated markdown

### 5. Error Handling Improvements

- [x] Add validation for API keys before making requests
- [x] Improve error messages for common failures
  - Missing ffmpeg
  - Missing whisper.cpp binary
  - Model not downloaded
  - API key invalid
  - Network timeout
- [x] Add proper error recovery for partial failures
- [x] Implement request cancellation for cloud APIs (structure in place)
- [x] Add file size validation (warn for files > 100MB)

### 6. UI/UX Enhancements

- [x] Add progress modal during transcription
  - Show current step (transcribing/analyzing/saving)
  - Show progress bar with color coding
  - Add cancel button with cleanup
- [x] Add ribbon icon customization (8 icon options)
- [x] Show binary and model status in settings
- [ ] Add model size recommendations based on system specs
- [ ] Add estimated time display based on audio duration
- [ ] Add recent transcriptions list in settings

### 7. File Management

- [ ] Implement duplicate file handling
  - Check if output markdown already exists
  - Offer to overwrite or create new version
  - Add timestamp suffix for new versions
- [ ] Add cleanup of temporary files on plugin unload
- [ ] Implement automatic cleanup of old .temp.wav files
- [ ] Add option to delete audio file after successful transcription

## Low Priority

### 8. Performance Optimization

- [ ] Implement streaming for very large audio files
- [ ] Add chunking for 2+ hour audio files
- [ ] Optimize memory usage during transcription
- [ ] Add caching for repeated transcriptions
- [ ] Implement parallel processing for multiple files

### 9. Additional Features

- [ ] Batch transcription support
  - Select multiple audio files
  - Process sequentially or in parallel
  - Show batch progress
- [ ] Custom prompt templates
  - Save/load analysis prompt templates
  - Community prompt sharing
- [ ] Export formats
  - Export to SRT (subtitles)
  - Export to VTT (WebVTT)
  - Export to plain text
- [ ] Audio playback in markdown
  - Embed audio player in generated markdown
  - Sync playback with transcript timestamps
- [ ] Integration with other plugins
  - Calendar integration for meeting dates
  - Tasks plugin for action items
  - Dataview for transcript queries

### 10. Documentation

- [ ] Update README.md
  - Add setup instructions
  - Add usage guide with screenshots
  - Add troubleshooting section
  - Add API configuration guide
- [ ] Create CONTRIBUTING.md
- [ ] Add inline code documentation (JSDoc)
- [ ] Create user guide with examples
- [ ] Add FAQ section
- [ ] Create video tutorial

### 11. Code Quality

- [ ] Add comprehensive unit tests
  - Test each processor independently
  - Test TranscriptionService workflows
  - Test ModelManager download logic
- [ ] Add integration tests
- [ ] Implement proper logging system
- [ ] Add debug mode for troubleshooting
- [ ] Refactor duplicate code
- [ ] Add TypeScript strict mode compliance
- [ ] Run linter and fix all warnings

### 12. Security & Privacy

- [ ] Add warning about cloud processing privacy
- [ ] Implement API key encryption in settings
- [ ] Add option to exclude sensitive files from transcription
- [ ] Validate file types before processing
- [ ] Add content warning detection

## Future Enhancements

### 13. Advanced Features (Post-v1.0)

- [ ] Real-time transcription from microphone
- [ ] Live meeting transcription
- [ ] Multi-language support beyond Greek/English
- [ ] Custom model fine-tuning support
- [ ] Whisper model quantization for better performance
- [ ] GPU acceleration for local processing
- [ ] Voice activity detection (VAD) for better segmentation
- [ ] Automatic punctuation and capitalization
- [ ] Named entity recognition (NER) for people, places, dates
- [ ] Sentiment analysis
- [ ] Topic extraction and tagging
- [ ] Integration with external transcription services
  - Assembly AI
  - Deepgram
  - Rev.ai
- [ ] Cloud storage integration
  - Google Drive
  - Dropbox
  - OneDrive

## Bugs to Fix

### Known Issues

- [ ] None reported yet (first release)

---

## Release Checklist

### Pre-Release (v1.0.0)

- [ ] Complete High Priority tasks (1-3)
- [ ] Complete Medium Priority task 5 (Error Handling)
- [ ] Complete Documentation (task 10)
- [ ] Test on all platforms
- [ ] Create release notes
- [ ] Submit to Obsidian community plugins

### Post-Release

- [ ] Monitor user feedback
- [ ] Address reported bugs
- [ ] Implement most requested features
- [ ] Regular updates and maintenance

---

**Legend:**

- `[ ]` Not started
- `[x]` Completed
- Priority: High (essential for v1.0), Medium (important but not critical), Low (nice to have)

Last Updated: 2024-12-12
