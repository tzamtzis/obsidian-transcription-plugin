import { TFile, Notice } from 'obsidian';
import AudioTranscriptionPlugin from '../main';

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

export class TranscriptionService {
	private plugin: AudioTranscriptionPlugin;
	private currentProgress: number = 0;

	constructor(plugin: AudioTranscriptionPlugin) {
		this.plugin = plugin;
	}

	async transcribe(audioFile: TFile): Promise<void> {
		const notice = new Notice('Starting transcription...', 0);

		try {
			// Step 1: Transcribe audio
			notice.setMessage('Step 1/3: Transcribing audio...');
			const transcriptionResult = await this.transcribeAudio(audioFile);

			// Step 2: Analyze content
			notice.setMessage('Step 2/3: Analyzing content...');
			const analysis = await this.analyzeTranscription(transcriptionResult);

			// Step 3: Create markdown file
			notice.setMessage('Step 3/3: Creating markdown file...');
			await this.createMarkdownFile(audioFile, transcriptionResult, analysis);

			notice.hide();
			new Notice(' Transcription complete!');

			// Open the created file
			const mdFileName = this.getMarkdownFileName(audioFile);
			await this.plugin.app.workspace.openLinkText(mdFileName, '', true);

		} catch (error) {
			notice.hide();

			// Retry once
			console.log('First attempt failed, retrying...');
			try {
				const retryNotice = new Notice('Retrying transcription...', 0);
				const transcriptionResult = await this.transcribeAudio(audioFile);
				const analysis = await this.analyzeTranscription(transcriptionResult);
				await this.createMarkdownFile(audioFile, transcriptionResult, analysis);

				retryNotice.hide();
				new Notice(' Transcription complete (after retry)!');

				const mdFileName = this.getMarkdownFileName(audioFile);
				await this.plugin.app.workspace.openLinkText(mdFileName, '', true);
			} catch (retryError) {
				console.error('Transcription failed after retry:', retryError);
				new Notice(`Transcription failed: ${retryError.message}\n\nPossible causes:\n- Audio file may be corrupted\n- Unsupported audio codec\n- Insufficient disk space`, 10000);
				throw retryError;
			}
		}
	}

	private async transcribeAudio(audioFile: TFile): Promise<TranscriptionResult> {
		// TODO: Implement actual transcription based on settings
		// For now, return a mock result

		const { processingMode } = this.plugin.settings;

		if (processingMode === 'local') {
			// Use local Whisper.cpp
			return await this.transcribeLocal(audioFile);
		} else if (processingMode === 'cloud-whisper') {
			// Use OpenAI Whisper API
			return await this.transcribeCloudWhisper(audioFile);
		} else {
			// Use OpenRouter
			return await this.transcribeCloudOpenRouter(audioFile);
		}
	}

	private async transcribeLocal(audioFile: TFile): Promise<TranscriptionResult> {
		// TODO: Implement Whisper.cpp integration
		throw new Error('Local transcription not yet implemented');
	}

	private async transcribeCloudWhisper(audioFile: TFile): Promise<TranscriptionResult> {
		// TODO: Implement OpenAI Whisper API integration
		throw new Error('Cloud Whisper transcription not yet implemented');
	}

	private async transcribeCloudOpenRouter(audioFile: TFile): Promise<TranscriptionResult> {
		// TODO: Implement OpenRouter integration
		throw new Error('OpenRouter transcription not yet implemented');
	}

	private async analyzeTranscription(result: TranscriptionResult): Promise<any> {
		// TODO: Implement analysis using AnalysisService
		return {
			summary: 'Summary of the transcription',
			keyPoints: ['Point 1', 'Point 2'],
			actionItems: [],
			followUps: []
		};
	}

	private async createMarkdownFile(
		audioFile: TFile,
		transcription: TranscriptionResult,
		analysis: any
	): Promise<void> {
		// TODO: Use FileManager to create the markdown file
		const mdFileName = this.getMarkdownFileName(audioFile);

		const content = this.formatMarkdown(audioFile, transcription, analysis);

		// Create the file
		await this.plugin.app.vault.create(mdFileName, content);
	}

	private formatMarkdown(
		audioFile: TFile,
		transcription: TranscriptionResult,
		analysis: any
	): string {
		const frontmatter = `---
audio_file: "${audioFile.name}"
duration: "${this.formatDuration(transcription.duration)}"
transcribed_date: ${new Date().toISOString()}
language: "${transcription.language}"
speakers: ${transcription.speakers?.length || 0}
tags: [meeting, transcription]
---

`;

		const header = `# Transcription: ${audioFile.basename}

**Audio File:** ${audioFile.name}
**Date:** ${new Date().toLocaleDateString()}
**Duration:** ${this.formatDuration(transcription.duration)}

---

`;

		const summarySection = `## Summary

${analysis.summary}

---

`;

		const keyPointsSection = `## Key Points

${analysis.keyPoints.map((p: string) => `- ${p}`).join('\n')}

---

`;

		const transcriptionSection = `## Full Transcription

${transcription.text}

---

[End of transcription]
`;

		return frontmatter + header + summarySection + keyPointsSection + transcriptionSection;
	}

	private getMarkdownFileName(audioFile: TFile): string {
		const baseName = audioFile.basename;
		const outputFolder = this.plugin.settings.outputFolder || '';
		return outputFolder ? `${outputFolder}/${baseName}.md` : `${baseName}.md`;
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

	cancel(): void {
		// TODO: Implement cancellation logic
	}

	getProgress(): number {
		return this.currentProgress;
	}
}
