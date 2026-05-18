import { requestUrl } from 'obsidian';
import AudioTranscriptionPlugin from '../main';
import { TranscriptionResult, TranscriptSegment } from '../services/TranscriptionService';
import { Language } from '../settings';
import { getErrorMessage } from '../utils/errors';
import { sanitizeMultipartFilename } from '../utils/multipart';
import * as fs from 'fs';

interface OpenAIWhisperSegment {
	start: number;
	end: number;
	text: string;
}

interface OpenAIWhisperResponse {
	text?: string;
	segments?: OpenAIWhisperSegment[];
	language?: string;
	duration?: number;
}

interface OpenAIErrorResponse {
	error?: { message?: string };
}

export class CloudWhisperProcessor {
	private plugin: AudioTranscriptionPlugin;
	private apiEndpoint = 'https://api.openai.com/v1/audio/transcriptions';

	constructor(plugin: AudioTranscriptionPlugin) {
		this.plugin = plugin;
	}

	async transcribe(
		audioPath: string,
		onProgress?: (progress: number, message: string) => void,
		language?: Language
	): Promise<TranscriptionResult> {
		const apiKey = this.plugin.settings.openaiApiKey;

		if (!apiKey) {
			throw new Error('OpenAI API key not configured. Please add it in settings.');
		}

		if (onProgress) {
			onProgress(10, 'Preparing audio file...');
		}

		// Read audio file (async so the Obsidian UI thread is not blocked while
		// reading a potentially large file, e.g. from a cloud-backed vault).
		const audioBuffer = await fs.promises.readFile(audioPath);
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
				boundary,
				language
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
				const errorData = response.json as OpenAIErrorResponse;
				const errorMessage = errorData?.error?.message || 'Unknown error';
				throw new Error(`OpenAI API error: ${errorMessage}`);
			}

			if (onProgress) {
				onProgress(90, 'Processing results...');
			}

			// Parse response
			const result = this.parseOpenAIResponse(response.json as OpenAIWhisperResponse);

			if (onProgress) {
				onProgress(100, 'Transcription complete!');
			}

			return result;

		} catch (error: unknown) {
			console.error('OpenAI Whisper API error:', error);
			throw new Error(`Transcription failed: ${getErrorMessage(error)}`);
		}
	}

	private createMultipartFormData(
		audioBuffer: Buffer,
		fileName: string,
		boundary: string,
		language?: Language
	): ArrayBuffer {
		const parts: Buffer[] = [];

		// Sanitize the (user-controlled, vault-derived) file name before placing
		// it in a header: CR/LF or a double quote would let it break out of the
		// Content-Disposition line and inject additional multipart parts.
		const safeFileName = sanitizeMultipartFilename(fileName);

		// Add file field
		parts.push(Buffer.from(
			`--${boundary}\r\n` +
			`Content-Disposition: form-data; name="file"; filename="${safeFileName}"\r\n` +
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
		const langCode = this.getLanguageCode(language);
		if (langCode) {
			parts.push(Buffer.from(
				`--${boundary}\r\n` +
				`Content-Disposition: form-data; name="language"\r\n\r\n` +
				`${langCode}\r\n`
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

	private getLanguageCode(language?: Language): string | undefined {
		// Use provided language or fall back to settings
		const lang = language || this.plugin.settings.language;

		// Auto-detect means no language code (let whisper auto-detect)
		if (lang === 'auto') {
			return undefined;
		}

		// Return the language code directly (they're already in ISO 639-1 format)
		return lang;
	}

	private parseOpenAIResponse(data: OpenAIWhisperResponse): TranscriptionResult {
		// OpenAI Whisper API returns verbose_json format with segments
		const segments: TranscriptSegment[] = (data.segments || []).map((seg: OpenAIWhisperSegment) => ({
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
