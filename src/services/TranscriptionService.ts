import { TFile, Notice, FileSystemAdapter } from 'obsidian';
import AudioTranscriptionPlugin from '../main';
import { LocalWhisperProcessor } from '../processors/LocalWhisperProcessor';
import { CloudWhisperProcessor } from '../processors/CloudWhisperProcessor';
import { OpenRouterProcessor } from '../processors/OpenRouterProcessor';
import { TranscriptionProgressModal } from '../ui/TranscriptionProgressModal';
import { getAudioDuration, estimateTranscriptionTime, formatEstimatedTime } from '../utils/audio';
import { Language, DateFormat } from '../settings';

export interface TranscriptionResult {
	text: string;
	segments: TranscriptSegment[];
	language: string;
	duration: number;
	speakers?: SpeakerInfo[];
}

export interface TranscriptSegment {
	start: number;
	end: number;
	text: string;
	speaker?: number;
}

export interface SpeakerInfo {
	id: number;
	label: string;
}

export interface AnalysisResult {
	summary: string;
	keyPoints: string[];
	actionItems: string[];
	followUps: string[];
}

export class TranscriptionService {
	private plugin: AudioTranscriptionPlugin;
	private currentProgress: number = 0;
	public localProcessor: LocalWhisperProcessor;
	private cloudWhisperProcessor: CloudWhisperProcessor;
	private openRouterProcessor: OpenRouterProcessor;

	constructor(plugin: AudioTranscriptionPlugin) {
		this.plugin = plugin;
		this.localProcessor = new LocalWhisperProcessor(plugin);
		this.cloudWhisperProcessor = new CloudWhisperProcessor(plugin);
		this.openRouterProcessor = new OpenRouterProcessor(plugin);
	}

	async transcribe(audioFile: TFile, shouldOverwrite: boolean = false, language?: Language, customInstructionsOverride?: string): Promise<void> {
		// Get audio file path for duration estimation
		const audioPath = this.getFullPath(audioFile.path);

		// Get audio duration and show estimate
		const audioDuration = await getAudioDuration(audioPath);
		if (audioDuration > 0) {
			const isLocal = this.plugin.settings.processingMode === 'local';
			const estimatedTime = estimateTranscriptionTime(
				audioDuration,
				this.plugin.settings.modelSize,
				isLocal
			);
			const formattedEstimate = formatEstimatedTime(estimatedTime);
			new Notice(`Starting transcription. Estimated time: ${formattedEstimate}`, 5000);
		}

		// Create progress modal
		const progressModal = new TranscriptionProgressModal(
			this.plugin.app,
			() => this.cancel()
		);
		progressModal.open();

		let transcriptionResult: TranscriptionResult | null = null;

		try {
			// Validate setup before starting
			progressModal.updateProgress('validation', 5);
			this.validateSetup(audioFile);

			// Step 1: Transcribe audio
			progressModal.updateProgress('transcription', 10);
			transcriptionResult = await this.transcribeAudio(audioFile, language);
			progressModal.updateProgress('transcription', 60);


	} catch (error) {
		// Check if user cancelled
		if (progressModal.isCancelled()) {
			progressModal.close();
			new Notice('⚠️ Transcription cancelled');
			return;
		}

		// Transcription failed - this is a fatal error
		console.error('Transcription failed:', error);
		const errorMessage = this.getErrorMessage(error);
		progressModal.markError(errorMessage);
		throw error;
	}

	// Step 2: Analyze content (with retry logic)
	let analysis: AnalysisResult | null = null;
	let analysisError: string | null = null;

	try {
		progressModal.updateProgress('analysis', 65);
		analysis = await this.analyzeTranscription(transcriptionResult, customInstructionsOverride);
		progressModal.updateProgress('analysis', 85);
	} catch (error) {
		console.warn('First analysis attempt failed, retrying...', error);
		progressModal.updateProgress('analysis', 65, '⚠️ Retrying analysis...');

		// Retry analysis once
		try {
			analysis = await this.analyzeTranscription(transcriptionResult, customInstructionsOverride);
			progressModal.updateProgress('analysis', 85);
			new Notice('Analysis succeeded after retry');
		} catch (retryError) {
			console.error('Analysis failed after retry:', retryError);
			analysisError = this.getErrorMessage(retryError);
			new Notice(`⚠️ Analysis failed: ${analysisError}. Saving transcription without analysis.`, 8000);
		}
	}

	// Step 3: Create markdown file (even if analysis failed)
	try {
		progressModal.updateProgress('saving', 90);
		await this.createMarkdownFile(audioFile, transcriptionResult, analysis, shouldOverwrite, analysisError);

		// Complete
		progressModal.markComplete();
		if (analysisError) {
			new Notice('⚠️ Transcription complete, but analysis failed. Check the file for details.');
		} else {
			new Notice(' Transcription complete!');
		}

		// Open the created file
		const mdFileName = this.getMarkdownFileName(audioFile);
		await this.plugin.app.workspace.openLinkText(mdFileName, '', true);

		// Delete the audio file if configured to do so
		if (this.plugin.settings.deleteAudioAfterTranscription) {
			try {
				await this.plugin.app.fileManager.trashFile(audioFile);
				new Notice('🗑️ Audio file deleted after successful transcription');
			} catch (deleteError) {
				console.error('Failed to delete audio file:', deleteError);
				new Notice('⚠️ Transcription complete but audio file could not be deleted', 8000);
			}
		}

	} catch (error) {
		console.error('Failed to create markdown file:', error);
		const errorMessage = this.getErrorMessage(error);
		progressModal.markError(errorMessage);
		throw error;
	}
}

	private validateSetup(audioFile: TFile): void {
		const { processingMode } = this.plugin.settings;

		// Validate file size (warn if > 100MB)
		const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
		const fileSize = audioFile.stat.size;

		if (fileSize > MAX_FILE_SIZE) {
			const sizeMB = Math.round(fileSize / (1024 * 1024));
			new Notice(`⚠️ Large file detected (${sizeMB}MB). Processing may take several minutes.`, 8000);
		}

		// Validate based on processing mode
		if (processingMode === 'local') {
			// Check if whisper.cpp binary exists
			const binaryExists = this.localProcessor.checkBinaryExists();
			if (!binaryExists) {
				throw new Error('Whisper.cpp binary not found.\n\n' +
					'Solution: Go to Settings → Audio Transcription → Download Whisper.cpp binary');
			}

			// Check if model is downloaded
			const modelExists = this.plugin.modelManager.checkModelExists(this.plugin.settings.modelSize);
			if (!modelExists) {
				throw new Error(`Model "${this.plugin.settings.modelSize}" not found.\n\n` +
					'Solution: Go to Settings → Audio Transcription → Download Model');
			}

		} else if (processingMode === 'cloud-whisper') {
			// Validate OpenAI API key
			const apiKey = this.plugin.settings.openaiApiKey;
			if (!apiKey || apiKey.trim().length === 0) {
				throw new Error('OpenAI API key not configured.\n\n' +
					'Solution: Go to Settings → Audio Transcription → API Keys → Add your OpenAI API key');
			}

			if (!apiKey.startsWith('sk-')) {
				throw new Error('Invalid OpenAI API key format.\n\n' +
					'OpenAI API keys should start with "sk-".\n' +
					'Solution: Check your API key in Settings → Audio Transcription → API Keys');
			}
		}

		// Validate OpenRouter API key for analysis
		const openrouterKey = this.plugin.settings.openrouterApiKey;
		if (!openrouterKey || openrouterKey.trim().length === 0) {
			throw new Error('OpenRouter API key not configured.\n\n' +
				'Solution: Go to Settings → Audio Transcription → API Keys → Add your OpenRouter API key');
		}

		if (!openrouterKey.startsWith('sk-or-')) {
			throw new Error('Invalid OpenRouter API key format.\n\n' +
				'OpenRouter API keys should start with "sk-or-".\n' +
				'Solution: Check your API key in Settings → Audio Transcription → API Keys');
		}

		// Validate model name for OpenRouter
		const modelName = this.plugin.settings.openrouterModelName;
		if (!modelName || modelName.trim().length === 0) {
			throw new Error('OpenRouter model name not configured.\n\n' +
				'Solution: Go to Settings → Audio Transcription → API Keys → Add a model name (e.g., meta-llama/llama-3.2-3b-instruct)');
		}
	}

	private shouldRetryError(error: Error): boolean {
		const message = error.message?.toLowerCase() || '';

		// Don't retry validation errors
		if (message.includes('not configured') ||
			message.includes('not found') ||
			message.includes('invalid') ||
			message.includes('solution:')) {
			return false;
		}

		// Retry network errors and temporary failures
		if (message.includes('timeout') ||
			message.includes('network') ||
			message.includes('econnrefused') ||
			message.includes('enotfound') ||
			message.includes('fetch failed')) {
			return true;
		}

		// Default: retry once
		return true;
	}

	private getErrorMessage(error: Error): string {
		const originalMessage = error.message || 'Unknown error occurred';

		// Return validation errors as-is (they already have good messages)
		if (originalMessage.includes('Solution:')) {
			return originalMessage;
		}

		// Enhance common error messages
		if (originalMessage.includes('ffmpeg not found')) {
			return 'FFmpeg not found. Required for audio conversion.\n\n' +
				'Solution:\n' +
				'• Windows: Download from https://ffmpeg.org or run: choco install ffmpeg\n' +
				'• macOS: Run: brew install ffmpeg\n' +
				'• Linux: Run: sudo apt install ffmpeg';
		}

		if (originalMessage.includes('timeout') || originalMessage.includes('ETIMEDOUT')) {
			return 'Request timed out. Check your internet connection and try again.\n\n' +
				'If the problem persists, the API service may be experiencing issues.';
		}

		if (originalMessage.includes('ENOTFOUND') || originalMessage.includes('ECONNREFUSED')) {
			return 'Network error: Unable to connect to the API.\n\n' +
				'Solution: Check your internet connection and try again.';
		}

		if (originalMessage.includes('401') || originalMessage.includes('Unauthorized')) {
			return 'API authentication failed. Your API key may be invalid.\n\n' +
				'Solution: Check your API keys in Settings → Audio Transcription → API Keys';
		}

		if (originalMessage.includes('429') || originalMessage.includes('rate limit')) {
			return 'API rate limit exceeded.\n\n' +
				'Solution: Wait a few minutes before trying again, or upgrade your API plan.';
		}

		if (originalMessage.includes('413') || originalMessage.includes('too large')) {
			return 'File too large for the API.\n\n' +
				'Solution: Try using local processing mode instead, or split the audio into smaller segments.';
		}

		if (originalMessage.includes('unsupported') || originalMessage.includes('codec')) {
			return 'Unsupported audio format or codec.\n\n' +
				'Solution:\n' +
				'• Install ffmpeg for automatic conversion\n' +
				'• Or convert the audio to MP3/M4A/WAV format manually';
		}

		// Return original message if no specific handler
		return `Transcription failed: ${originalMessage}`;
	}

	private async transcribeAudio(audioFile: TFile, language?: Language): Promise<TranscriptionResult> {
		// TODO: Implement actual transcription based on settings
		// For now, return a mock result

		const { processingMode } = this.plugin.settings;

		if (processingMode === 'local') {
			// Use local Whisper.cpp
			return await this.transcribeLocal(audioFile, language);
		} else if (processingMode === 'cloud-whisper') {
			// Use OpenAI Whisper API
			return await this.transcribeCloudWhisper(audioFile, language);
		} else {
			// Use OpenRouter
			return this.transcribeCloudOpenRouter(audioFile, language);
		}
	}

	private async transcribeLocal(audioFile: TFile, language?: Language): Promise<TranscriptionResult> {
		// Get the audio file path
		const audioPath = this.getFullPath(audioFile.path);

		// Use LocalWhisperProcessor
		return await this.localProcessor.transcribe(audioPath, (progress, message) => {
			this.currentProgress = progress;
			// Progress updates are handled by the Notice in the main transcribe method
		}, language);
	}

	private async transcribeCloudWhisper(audioFile: TFile, language?: Language): Promise<TranscriptionResult> {
		// Get the audio file path
		const audioPath = this.getFullPath(audioFile.path);

		// Use CloudWhisperProcessor
		return await this.cloudWhisperProcessor.transcribe(audioPath, (progress, message) => {
			this.currentProgress = progress;
		}, language);
	}

	private transcribeCloudOpenRouter(_audioFile: TFile, _language?: Language): never {
		// OpenRouter doesn't support direct transcription
		// Use OpenAI Whisper instead for now
		throw new Error('OpenRouter transcription not supported. Please use "Cloud (OpenAI Whisper)" or "Local" mode for transcription.');
	}

	private async analyzeTranscription(result: TranscriptionResult, customInstructionsOverride?: string): Promise<AnalysisResult> {
		// Use override if provided, otherwise use settings default
		const customInstructions = customInstructionsOverride !== undefined
			? customInstructionsOverride
			: this.plugin.settings.customInstructions;

		// Use OpenRouter for analysis (cloud-only)
		return await this.openRouterProcessor.analyzeText(result.text, customInstructions);
	}

	private async createMarkdownFile(
		audioFile: TFile,
		transcription: TranscriptionResult,
		analysis: AnalysisResult | null,
		shouldOverwrite: boolean = false,
		analysisError: string | null = null
	): Promise<void> {
		const mdFileName = this.getMarkdownFileName(audioFile);

		// Ensure output folder exists
		const outputFolder = this.plugin.settings.outputFolder;
		if (outputFolder) {
			await this.ensureFolderExists(outputFolder);
		}

		const content = this.formatMarkdown(audioFile, transcription, analysis, analysisError);

		// Create or overwrite the file
		const existingFile = this.plugin.app.vault.getAbstractFileByPath(mdFileName);
		if (existingFile && existingFile instanceof TFile && shouldOverwrite) {
			// Overwrite existing file
			await this.plugin.app.vault.modify(existingFile, content);
		} else {
			// Create new file
			await this.plugin.app.vault.create(mdFileName, content);
		}

		// Add to recent transcriptions
		await this.addToRecentTranscriptions(audioFile, mdFileName, transcription);
	}

	private async ensureFolderExists(folderPath: string): Promise<void> {
		const folders = folderPath.split('/').filter(f => f.length > 0);
		let currentPath = '';

		for (const folder of folders) {
			currentPath = currentPath ? `${currentPath}/${folder}` : folder;

			// Check if folder exists
			const existingFolder = this.plugin.app.vault.getAbstractFileByPath(currentPath);

			if (!existingFolder) {
				// Create folder if it doesn't exist
				await this.plugin.app.vault.createFolder(currentPath);
			}
		}
	}

	private formatMarkdown(
		audioFile: TFile,
		transcription: TranscriptionResult,
		analysis: AnalysisResult | null,
		analysisError: string | null = null
	): string {
		const now = new Date();
		const dateFormat = this.plugin.settings.dateFormat;
		const formattedDate = this.formatDate(now, dateFormat);

		const frontmatter = `---
audio_file: "${audioFile.name}"
duration: "${this.formatDuration(transcription.duration)}"
transcribed_date: ${formattedDate}
language: "${transcription.language}"
speakers: ${transcription.speakers?.length || 0}
tags: [meeting, transcription]
---

`;

		const header = `# ${audioFile.basename}

> 🎙️ Audio Transcription
> 📅 ${formattedDate} | ⏱️ ${this.formatDuration(transcription.duration)} | 🌐 ${transcription.language.toUpperCase()}

`;

		// Embed the audio file
		const audioEmbed = `## Audio File

![[${audioFile.path}]]

`;

		// Add speaker renaming instructions if diarization is enabled
		const speakerInstructions = this.plugin.settings.enableDiarization ? `
> **👥 Speaker Labels**
> To rename speakers, use Find & Replace:
> - Find: \`**Speaker 1:**\` → Replace with: \`**Alice:**\`
> - Find: \`**Speaker 2:**\` → Replace with: \`**Bob:**\`
> - And so on for other speakers...

` : '';

		// Table of contents for longer transcripts
		const hasTOC = transcription.duration > 600; // 10+ minutes
		let toc = '';
		if (hasTOC) {
			if (analysisError) {
				toc = `## Table of Contents

- [Analysis Failed](#️-analysis-failed)
- [Full Transcription](#full-transcription)

---

`;
			} else {
				toc = `## Table of Contents

- [Summary](#summary)
- [Key Points](#key-points)
${(analysis?.actionItems?.length ?? 0) > 0 ? '- [Action Items](#action-items)\n' : ''}${(analysis?.followUps?.length ?? 0) > 0 ? '- [Follow-up Questions](#follow-up-questions)\n' : ''}- [Full Transcription](#full-transcription)

---

`;
			}
		}

		// If analysis failed, show error note instead of analysis sections
		let summarySection = '';
		let keyPointsSection = '';
		let actionItemsSection = '';
		let followUpSection = '';

		if (analysisError) {
			summarySection = `## ⚠️ Analysis Failed

The automatic analysis and summarization failed with the following error:

> **Error:** ${analysisError}

The transcription below was completed successfully, but automatic summarization, key point extraction, and action item detection could not be performed.

You can manually add a summary and key points below, or try re-analyzing the transcription later.

`;
		} else if (analysis) {
			summarySection = `## Summary

${analysis.summary}

`;

			keyPointsSection = `## Key Points

${analysis.keyPoints.map((p: string) => `- ${p}`).join('\n')}

`;

			// Add action items if available
			actionItemsSection = analysis.actionItems && analysis.actionItems.length > 0
				? `## Action Items

${analysis.actionItems.map((item: string) => `- [ ] ${item}`).join('\n')}

`
				: '';

			// Add follow-up questions if available
			followUpSection = analysis.followUps && analysis.followUps.length > 0
				? `## Follow-up Questions

${analysis.followUps.map((q: string) => `- ${q}`).join('\n')}

`
				: '';
		}

		const transcriptionSection = this.formatTranscriptionSection(transcription);

		const footer = `---

*Generated with Obsidian Audio Transcription Plugin*`;

		return frontmatter + header + audioEmbed + speakerInstructions + toc + summarySection + keyPointsSection + actionItemsSection + followUpSection + transcriptionSection + footer;
	}

	private formatTranscriptionSection(transcription: TranscriptionResult): string {
		const includeTimestamps = this.plugin.settings.includeTimestamps;
		const segments = transcription.segments;

		let transcriptText = '';

		if (includeTimestamps && segments && segments.length > 0) {
			// Format with timestamps and speaker labels
			transcriptText = segments.map(segment => {
				const timestamp = this.formatTimestamp(segment.start);
				const speaker = segment.speaker !== undefined ? `**Speaker ${segment.speaker}:** ` : '';
				return `[${timestamp}] ${speaker}${segment.text.trim()}`;
			}).join('\n\n');
		} else {
			// Use plain text without timestamps
			transcriptText = transcription.text;
		}

		return `## Full Transcription

${transcriptText}

`;
	}

	private formatTimestamp(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = Math.floor(seconds % 60);

		if (hours > 0) {
			return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
		}
		return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}

	private getMarkdownFileName(audioFile: TFile): string {
		const baseName = audioFile.basename;
		const outputFolder = this.plugin.settings.outputFolder || '';

		if (outputFolder) {
			// Use specified output folder
			return `${outputFolder}/${baseName}.md`;
		} else {
			// Place in same directory as audio file
			const audioDir = audioFile.parent?.path || '';
			return audioDir ? `${audioDir}/${baseName}.md` : `${baseName}.md`;
		}
	}

	private formatDuration(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = Math.floor(seconds % 60);

		if (hours > 0) {
			return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
		}
		return `${minutes}:${secs.toString().padStart(2, '0')}`;
	}

	private formatDate(date: Date, format: DateFormat): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		const seconds = String(date.getSeconds()).padStart(2, '0');

		switch (format) {
			case 'iso':
				return `${year}-${month}-${day}`;
			case 'us':
				return `${month}/${day}/${year}`;
			case 'eu':
				return `${day}/${month}/${year}`;
			case 'full':
				return date.toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				});
			case 'datetime':
				return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
			case 'locale':
				return date.toLocaleDateString();
			default:
				return `${year}-${month}-${day}`;
		}
	}

	cancel(): void {
		this.localProcessor.cancel();
		this.cloudWhisperProcessor.cancel();
		this.openRouterProcessor.cancel();
	}

private getFullPath(relativePath: string): string {
		const adapter = this.plugin.app.vault.adapter;
		if (adapter instanceof FileSystemAdapter) {
			return adapter.getFullPath(relativePath);
		}
		throw new Error('FileSystemAdapter required for local file operations');
	}

	getProgress(): number {
		return this.currentProgress;
	}

	private async addToRecentTranscriptions(
		audioFile: TFile,
		markdownPath: string,
		transcription: TranscriptionResult
	): Promise<void> {
		const recentEntry = {
			audioFileName: audioFile.name,
			markdownPath: markdownPath,
			transcribedDate: new Date().toISOString(),
			duration: this.formatDuration(transcription.duration),
			language: transcription.language
		};

		// Add to beginning of array
		this.plugin.settings.recentTranscriptions.unshift(recentEntry);

		// Keep only max number of entries
		const maxEntries = this.plugin.settings.maxRecentTranscriptions;
		if (this.plugin.settings.recentTranscriptions.length > maxEntries) {
			this.plugin.settings.recentTranscriptions =
				this.plugin.settings.recentTranscriptions.slice(0, maxEntries);
		}

		// Save settings
		await this.plugin.saveSettings();
	}
}
