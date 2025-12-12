import { Notice, requestUrl } from 'obsidian';
import AudioTranscriptionPlugin from '../main';
import { TranscriptionResult, TranscriptSegment } from '../services/TranscriptionService';
import * as fs from 'fs';

export class CloudWhisperProcessor {
	private plugin: AudioTranscriptionPlugin;
	private apiEndpoint = 'https://api.openai.com/v1/audio/transcriptions';

	constructor(plugin: AudioTranscriptionPlugin) {
		this.plugin = plugin;
	}

	async transcribe(
		audioPath: string,
		onProgress?: (progress: number, message: string) => void
	): Promise<TranscriptionResult> {
		const apiKey = this.plugin.settings.openaiApiKey;

		if (!apiKey) {
			throw new Error('OpenAI API key not configured. Please add it in settings.');
		}

		if (onProgress) {
			onProgress(10, 'Preparing audio file...');
		}

		// Read audio file
		const audioBuffer = fs.readFileSync(audioPath);
		const fileName = audioPath.split(/[\\/]/).pop() || 'audio.m4a';

		if (onProgress) {
			onProgress(30, 'Uploading to OpenAI...');
		}

		try {
			// Create form data manually
			const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
			const formData = this.createMultipartFormData(
				audioBuffer,
				fileName,
				boundary
			);

			if (onProgress) {
				onProgress(50, 'Transcribing with OpenAI Whisper...');
			}

			// Make API request
			const response = await requestUrl({
				url: this.apiEndpoint,
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${apiKey}`,
					'Content-Type': `multipart/form-data; boundary=${boundary}`
				},
				body: formData,
				throw: false
			});

			if (response.status !== 200) {
				const errorData = response.json;
				const errorMessage = errorData?.error?.message || 'Unknown error';
				throw new Error(`OpenAI API error: ${errorMessage}`);
			}

			if (onProgress) {
				onProgress(90, 'Processing results...');
			}

			// Parse response
			const result = this.parseOpenAIResponse(response.json);

			if (onProgress) {
				onProgress(100, 'Transcription complete!');
			}

			return result;

		} catch (error) {
			console.error('OpenAI Whisper API error:', error);
			throw new Error(`Transcription failed: ${error.message}`);
		}
	}

	private createMultipartFormData(
		audioBuffer: Buffer,
		fileName: string,
		boundary: string
	): ArrayBuffer {
		const parts: Buffer[] = [];

		// Add file field
		parts.push(Buffer.from(
			`--${boundary}\r\n` +
			`Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
			`Content-Type: audio/mpeg\r\n\r\n`
		));
		parts.push(audioBuffer);
		parts.push(Buffer.from('\r\n'));

		// Add model field
		parts.push(Buffer.from(
			`--${boundary}\r\n` +
			`Content-Disposition: form-data; name="model"\r\n\r\n` +
			`whisper-1\r\n`
		));

		// Add language field if specified
		const language = this.getLanguageCode();
		if (language) {
			parts.push(Buffer.from(
				`--${boundary}\r\n` +
				`Content-Disposition: form-data; name="language"\r\n\r\n` +
				`${language}\r\n`
			));
		}

		// Add response format
		parts.push(Buffer.from(
			`--${boundary}\r\n` +
			`Content-Disposition: form-data; name="response_format"\r\n\r\n` +
			`verbose_json\r\n`
		));

		// Add timestamp granularities
		parts.push(Buffer.from(
			`--${boundary}\r\n` +
			`Content-Disposition: form-data; name="timestamp_granularities[]"\r\n\r\n` +
			`segment\r\n`
		));

		// End boundary
		parts.push(Buffer.from(`--${boundary}--\r\n`));

		// Combine all parts
		const buffer = Buffer.concat(parts);
		return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
	}

	private getLanguageCode(): string | undefined {
		const { language } = this.plugin.settings;
		if (language === 'auto') return undefined;
		if (language === 'en') return 'en';
		if (language === 'el') return 'el';
		return undefined;
	}

	private parseOpenAIResponse(data: any): TranscriptionResult {
		// OpenAI Whisper API returns verbose_json format with segments
		const segments: TranscriptSegment[] = (data.segments || []).map((seg: any) => ({
			start: seg.start || 0,
			end: seg.end || 0,
			text: seg.text || ''
		}));

		const text = data.text || segments.map(s => s.text).join(' ').trim();
		const duration = data.duration || (segments.length > 0 ? segments[segments.length - 1].end : 0);

		return {
			text,
			segments,
			language: data.language || this.plugin.settings.language || 'auto',
			duration
		};
	}

	cancel() {
		// Cannot cancel HTTP requests easily
		// This is a limitation of the cloud approach
	}
}
