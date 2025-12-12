# TODO - Obsidian Audio Transcription Plugin

## High Priority

### 1. Implement Ollama Processor for Local Analysis
- [ ] Create OllamaProcessor class in `src/processors/OllamaProcessor.ts`
- [ ] Implement text analysis using Ollama API (http://localhost:11434)
- [ ] Add model selection in settings (llama2, mistral, etc.)
- [ ] Parse Ollama response into summary/key points/action items
- [ ] Update TranscriptionService to use Ollama when `analysisProvider === 'local-ollama'`
- [ ] Add error handling for Ollama not running

### 2. Testing with Real Audio Files
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

### 3. Platform Support
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

### 4. Output Formatting Improvements
- [ ] Implement timestamp inclusion setting
  - Add timestamps to each segment when enabled
  - Format: `[00:01:23] Speaker text here`
- [ ] Implement output folder creation
  - Create folder if it doesn't exist
  - Handle nested folder paths
- [ ] Add speaker labels to transcript when diarization is available
- [ ] Improve markdown formatting
  - Better section spacing
  - Add table of contents for long transcripts
  - Add metadata section with file info

## Medium Priority

### 5. Speaker Diarization (Nice-to-Have)
- [ ] Research diarization options compatible with whisper.cpp
- [ ] Implement pyannote-audio integration (if feasible)
- [ ] Add speaker count setting
- [ ] Update transcript format to include speaker labels
- [ ] Add speaker renaming UI in generated markdown

### 6. Error Handling Improvements
- [ ] Add validation for API keys before making requests
- [ ] Improve error messages for common failures
  - Missing ffmpeg
  - Missing whisper.cpp binary
  - Model not downloaded
  - API key invalid
  - Network timeout
- [ ] Add proper error recovery for partial failures
- [ ] Implement request cancellation for cloud APIs
- [ ] Add file size validation (warn for very large files)

### 7. UI/UX Enhancements
- [ ] Add progress modal during transcription
  - Show current step (transcribing/analyzing/saving)
  - Show progress bar
  - Add cancel button
- [ ] Add ribbon icon customization
- [ ] Show binary status in settings (downloaded/not downloaded)
- [ ] Add model size recommendations based on system specs
- [ ] Add estimated time display based on audio duration
- [ ] Add recent transcriptions list in settings

### 8. File Management
- [ ] Implement duplicate file handling
  - Check if output markdown already exists
  - Offer to overwrite or create new version
  - Add timestamp suffix for new versions
- [ ] Add cleanup of temporary files on plugin unload
- [ ] Implement automatic cleanup of old .temp.wav files
- [ ] Add option to delete audio file after successful transcription

## Low Priority

### 9. Performance Optimization
- [ ] Implement streaming for very large audio files
- [ ] Add chunking for 2+ hour audio files
- [ ] Optimize memory usage during transcription
- [ ] Add caching for repeated transcriptions
- [ ] Implement parallel processing for multiple files

### 10. Additional Features
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

### 11. Documentation
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

### 12. Code Quality
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

### 13. Security & Privacy
- [ ] Add warning about cloud processing privacy
- [ ] Implement API key encryption in settings
- [ ] Add option to exclude sensitive files from transcription
- [ ] Validate file types before processing
- [ ] Add content warning detection

## Future Enhancements

### 14. Advanced Features (Post-v1.0)
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
- [ ] Complete High Priority tasks (1-4)
- [ ] Complete Medium Priority task 6 (Error Handling)
- [ ] Complete Documentation (task 11)
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
