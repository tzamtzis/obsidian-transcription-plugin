# Test Checklist - Audio Transcription Plugin

Use this checklist to track your testing progress. Copy this file and mark items as you complete them.

## Test Session Info

- **Date**: _______________
- **Tester**: _______________
- **Plugin Version**: _______________
- **Obsidian Version**: _______________
- **OS**: _______________
- **FFmpeg Version**: _______________

---

## Pre-Test Setup

- [ ] Obsidian installed
- [ ] Plugin installed and enabled
- [ ] FFmpeg installed and in PATH
- [ ] Test vault created
- [ ] Test audio files prepared
- [ ] API keys configured (if testing cloud)

---

## 1. Audio Format Tests

### M4A Files
- [ ] Test with AAC-encoded M4A
- [ ] Test with different bitrates (128k, 256k, 320k)
- [ ] Verify conversion works correctly
- [ ] Check output accuracy

### MP3 Files
- [ ] Test with 128 kbps MP3
- [ ] Test with 192 kbps MP3
- [ ] Test with 320 kbps MP3
- [ ] Verify conversion works correctly
- [ ] Check output accuracy

### WAV Files
- [ ] Test with 16kHz WAV (should NOT convert)
- [ ] Test with 44.1kHz WAV (should convert)
- [ ] Test with 48kHz WAV (should convert)
- [ ] Verify 16kHz files skip conversion
- [ ] Compare processing times

**Notes**:
```


```

---

## 2. Long Audio File Tests

- [ ] Test with 2-hour audio file (local)
- [ ] Test with 2-hour audio file (cloud)
- [ ] File size warning shown for >100MB files
- [ ] Estimated time displayed before start
- [ ] Progress updates throughout
- [ ] No memory issues or crashes
- [ ] Table of contents added for 10+ min files
- [ ] Processing completes successfully

**Performance Metrics**:
- Audio duration: _____ minutes
- Processing time: _____ minutes
- Realtime factor: _____ x
- Model used: _____
- File size: _____ MB

---

## 3. Language Tests

### Greek Language
- [ ] Set language to "Greek only"
- [ ] Test with Greek news clip
- [ ] Test with Greek podcast
- [ ] Test with self-recorded Greek speech
- [ ] Verify Greek characters display correctly
- [ ] Check transcription accuracy (target: >85%)
- [ ] Verify language metadata: "el"

**Accuracy**: _____ % (count errors in first 100 words)

### English Language
- [ ] Set language to "English only"
- [ ] Test with English podcast
- [ ] Test with English audiobook
- [ ] Test with self-recorded English speech
- [ ] Verify spelling and punctuation
- [ ] Check transcription accuracy (target: >90%)
- [ ] Verify language metadata: "en"

**Accuracy**: _____ % (count errors in first 100 words)

### Auto-Detect Mode
- [ ] Set language to "Auto-detect"
- [ ] Test with Greek audio (should detect "el")
- [ ] Test with English audio (should detect "en")
- [ ] Verify language metadata matches actual language

### Multilingual Mode
- [ ] Set language to "Multilingual"
- [ ] Test with mixed Greek/English content
- [ ] Verify both languages transcribed
- [ ] Check both character sets rendered correctly

**Notes**:
```


```

---

## 4. Cloud Processing Tests

### OpenAI Whisper API
- [ ] Set processing mode to "Cloud (OpenAI Whisper)"
- [ ] Verify API key configured
- [ ] Test with short file (1 min)
- [ ] Test with medium file (10 min)
- [ ] Test with large file (check 25MB limit)
- [ ] Verify faster processing (~0.1x realtime)
- [ ] Check transcription quality

### OpenRouter Analysis
- [ ] Verify OpenRouter API key configured
- [ ] Test with meeting recording
- [ ] Test with lecture recording
- [ ] Test with interview recording
- [ ] Verify summary generated
- [ ] Check key points extracted
- [ ] Verify action items identified (if applicable)
- [ ] Check follow-up questions generated (if applicable)

**Notes**:
```


```

---

## 5. Error Scenario Tests

### Missing Dependencies
- [ ] Test without FFmpeg (should show clear error)
- [ ] Test without whisper.cpp binary (should show clear error)
- [ ] Test without model downloaded (should show clear error)
- [ ] Verify all error messages are helpful

### Invalid API Keys
- [ ] Test with invalid OpenAI key
- [ ] Test with invalid OpenRouter key
- [ ] Test with missing API keys
- [ ] Verify validation catches invalid formats
- [ ] Check error messages are clear

### Network Issues
- [ ] Test with network disconnected during cloud transcription
- [ ] Verify retry logic works
- [ ] Check error handling is graceful
- [ ] Verify no data loss

### Corrupted Files
- [ ] Test with renamed .txt file as .m4a
- [ ] Test with truncated audio file
- [ ] Verify errors caught and reported
- [ ] Check no crashes occur

**Notes**:
```


```

---

## 6. UI/UX Tests

### Progress Modal
- [ ] Modal appears when transcription starts
- [ ] Shows correct steps (validation → transcription → analysis → saving)
- [ ] Progress bar updates correctly
- [ ] Color changes for each step
- [ ] Percentage displayed
- [ ] Cancel button works
- [ ] Auto-closes on completion
- [ ] Shows errors clearly

### Settings Interface
- [ ] Processing mode dropdown works
- [ ] Model size dropdown works (local mode only)
- [ ] Language dropdown works
- [ ] Diarization toggle works
- [ ] Speaker count slider works (when diarization enabled)
- [ ] Custom instructions text area works
- [ ] API key fields work (password type)
- [ ] Output folder setting works
- [ ] Include timestamps toggle works
- [ ] Ribbon icon dropdown works (icon changes immediately)

### System Status Display
- [ ] Binary status shows correctly (✅ or ❌)
- [ ] Model status shows correctly (✅ or ❌)
- [ ] Model size recommendations show correctly
- [ ] RAM and CPU count displayed accurately
- [ ] Status updates when files change

### Recent Transcriptions
- [ ] Shows last 10 transcriptions
- [ ] Displays correct metadata (filename, date, duration, language)
- [ ] Clicking entries opens markdown files
- [ ] "Clear All" button works
- [ ] Shows "No recent transcriptions" when empty

**Notes**:
```


```

---

## 7. Output Format Tests

### Markdown Structure
- [ ] Frontmatter present with correct metadata
- [ ] Title matches audio filename
- [ ] Header shows date, duration, language
- [ ] Speaker instructions shown (if diarization enabled)
- [ ] Table of contents shown for 10+ min files
- [ ] Summary section present
- [ ] Key Points section present
- [ ] Action Items section (if any)
- [ ] Follow-up Questions section (if any)
- [ ] Full Transcription section present
- [ ] Footer present

### Timestamps
- [ ] Enable "Include timestamps"
- [ ] Format is [MM:SS] or [HH:MM:SS]
- [ ] Timestamps accurate to segment start
- [ ] Speaker labels appear after timestamp
- [ ] Text readable with timestamps

### Speaker Labels
- [ ] Enable diarization
- [ ] Speaker renaming instructions shown
- [ ] Format is **Speaker N:**
- [ ] Consistent numbering throughout
- [ ] Find & Replace instructions work

**Notes**:
```


```

---

## 8. Performance Tests

### Model Comparison
Test same 5-minute audio file with each model:

- [ ] Tiny model
  - Processing time: _____ min
  - Realtime factor: _____ x
  - Accuracy: _____ %

- [ ] Base model
  - Processing time: _____ min
  - Realtime factor: _____ x
  - Accuracy: _____ %

- [ ] Small model
  - Processing time: _____ min
  - Realtime factor: _____ x
  - Accuracy: _____ %

- [ ] Medium model
  - Processing time: _____ min
  - Realtime factor: _____ x
  - Accuracy: _____ %

- [ ] Large model
  - Processing time: _____ min
  - Realtime factor: _____ x
  - Accuracy: _____ %

### Cloud vs Local
- [ ] Local (medium) - Processing time: _____ min
- [ ] Cloud (OpenAI) - Processing time: _____ min
- [ ] Compare quality
- [ ] Note cost difference

---

## Test Summary

### Results
- Total tests attempted: _____
- Tests passed: _____
- Tests failed: _____
- Tests skipped: _____
- Pass rate: _____ %

### Critical Issues Found
1.
2.
3.

### Minor Issues Found
1.
2.
3.

### Recommendations
1.
2.
3.

### Overall Assessment
- [ ] Ready for release
- [ ] Needs minor fixes
- [ ] Needs major fixes
- [ ] Not ready for release

---

## Additional Notes

```






```

---

**Test completed by**: _______________
**Date**: _______________
**Signature**: _______________
