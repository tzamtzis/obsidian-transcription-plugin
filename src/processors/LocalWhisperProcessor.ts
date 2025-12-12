import { Notice } from 'obsidian';
import AudioTranscriptionPlugin from '../main';
import { TranscriptionResult, TranscriptSegment } from '../services/TranscriptionService';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';

export interface WhisperOptions {
	modelPath: string;
	audioPath: string;
	language?: string;
	threads?: number;
	outputFormat?: 'txt' | 'srt' | 'vtt' | 'json';
}

export class LocalWhisperProcessor {
	private plugin: AudioTranscriptionPlugin;
	private whisperBinaryPath: string;
	private currentProcess: ChildProcess | null = null;

	constructor(plugin: AudioTranscriptionPlugin) {
		this.plugin = plugin;

		// Get the whisper.cpp binary path
		const pluginDir = (this.plugin.app.vault.adapter as any).basePath;
		const binDir = path.join(pluginDir, '.obsidian', 'plugins', 'obsidian-transcription-plugin', 'bin');

		// Use Windows binary for now
		this.whisperBinaryPath = path.join(binDir, 'whisper.exe');

		this.ensureBinaryDirectory();
	}

	private ensureBinaryDirectory() {
		const binDir = path.dirname(this.whisperBinaryPath);
		if (!fs.existsSync(binDir)) {
			fs.mkdirSync(binDir, { recursive: true });
		}
	}

	async checkBinaryExists(): Promise<boolean> {
		return fs.existsSync(this.whisperBinaryPath);
	}

	async transcribe(
		audioPath: string,
		onProgress?: (progress: number, message: string) => void
	): Promise<TranscriptionResult> {
		// Check if binary exists
		if (!await this.checkBinaryExists()) {
			throw new Error('Whisper.cpp binary not found. Please download it from settings.');
		}

		// Get model path
		const modelPath = this.plugin.modelManager.getModelPath(this.plugin.settings.modelSize);
		if (!fs.existsSync(modelPath)) {
			throw new Error(`Model ${this.plugin.settings.modelSize} not found. Please download it first.`);
		}

		// Convert audio to WAV format (whisper.cpp requires 16kHz WAV)
		const wavPath = await this.convertToWav(audioPath, onProgress);

		try {
			// Run whisper.cpp
			const result = await this.runWhisper({
				modelPath,
				audioPath: wavPath,
				language: this.getLanguageCode(),
				threads: 4,
				outputFormat: 'json'
			}, onProgress);

			// Clean up temp WAV file
			if (fs.existsSync(wavPath)) {
				fs.unlinkSync(wavPath);
			}

			return result;
		} catch (error) {
			// Clean up temp WAV file on error
			if (fs.existsSync(wavPath)) {
				fs.unlinkSync(wavPath);
			}
			throw error;
		}
	}

	private getLanguageCode(): string | undefined {
		const { language } = this.plugin.settings;
		if (language === 'auto') return undefined;
		if (language === 'en') return 'en';
		if (language === 'el') return 'el';
		return undefined;
	}

	private async convertToWav(audioPath: string, onProgress?: (progress: number, message: string) => void): Promise<string> {
		if (onProgress) {
			onProgress(10, 'Converting audio format...');
		}

		// Check if file is already WAV
		if (audioPath.toLowerCase().endsWith('.wav')) {
			// Verify it's 16kHz mono - if not, convert it
			return audioPath;
		}

		// Check if ffmpeg is available
		const ffmpegAvailable = await this.checkFfmpegAvailable();
		if (!ffmpegAvailable) {
			throw new Error('ffmpeg not found. Please install ffmpeg to convert audio files.\n\nWindows: Download from https://ffmpeg.org/download.html\nOr install via chocolatey: choco install ffmpeg');
		}

		// Create temp WAV file path
		const tempWavPath = audioPath.replace(/\.[^.]+$/, '.temp.wav');

		try {
			await this.runFfmpeg(audioPath, tempWavPath, onProgress);
			return tempWavPath;
		} catch (error) {
			// Clean up temp file on error
			if (fs.existsSync(tempWavPath)) {
				fs.unlinkSync(tempWavPath);
			}
			throw error;
		}
	}

	private async checkFfmpegAvailable(): Promise<boolean> {
		return new Promise((resolve) => {
			const process = spawn('ffmpeg', ['-version']);

			process.on('error', () => {
				resolve(false);
			});

			process.on('close', (code) => {
				resolve(code === 0);
			});

			// Timeout after 5 seconds
			setTimeout(() => {
				process.kill();
				resolve(false);
			}, 5000);
		});
	}

	private async runFfmpeg(
		inputPath: string,
		outputPath: string,
		onProgress?: (progress: number, message: string) => void
	): Promise<void> {
		return new Promise((resolve, reject) => {
			if (onProgress) {
				onProgress(15, 'Converting audio to 16kHz mono WAV...');
			}

			// FFmpeg command to convert to 16kHz mono WAV
			// -i: input file
			// -ar 16000: sample rate 16kHz
			// -ac 1: mono (1 channel)
			// -c:a pcm_s16le: PCM signed 16-bit little-endian
			// -y: overwrite output file
			const args = [
				'-i', inputPath,
				'-ar', '16000',
				'-ac', '1',
				'-c:a', 'pcm_s16le',
				'-y',
				outputPath
			];

			const ffmpegProcess = spawn('ffmpeg', args);

			let stderr = '';
			let duration = 0;
			let converting = false;

			// FFmpeg outputs progress to stderr
			ffmpegProcess.stderr?.on('data', (data: Buffer) => {
				stderr += data.toString();
				const output = data.toString();

				// Extract duration from ffmpeg output
				if (!converting) {
					const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
					if (durationMatch) {
						const hours = parseInt(durationMatch[1]);
						const minutes = parseInt(durationMatch[2]);
						const seconds = parseFloat(durationMatch[3]);
						duration = hours * 3600 + minutes * 60 + seconds;
						converting = true;
					}
				}

				// Extract progress
				if (converting && duration > 0) {
					const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
					if (timeMatch) {
						const hours = parseInt(timeMatch[1]);
						const minutes = parseInt(timeMatch[2]);
						const seconds = parseFloat(timeMatch[3]);
						const currentTime = hours * 3600 + minutes * 60 + seconds;
						const progress = Math.min(90, 15 + (currentTime / duration) * 75);

						if (onProgress) {
							onProgress(Math.floor(progress), 'Converting audio...');
						}
					}
				}
			});

			ffmpegProcess.on('close', (code) => {
				if (code !== 0) {
					reject(new Error(`FFmpeg conversion failed: ${stderr}`));
					return;
				}

				if (!fs.existsSync(outputPath)) {
					reject(new Error('FFmpeg conversion failed: output file not created'));
					return;
				}

				if (onProgress) {
					onProgress(95, 'Audio conversion complete');
				}

				resolve();
			});

			ffmpegProcess.on('error', (error) => {
				reject(new Error(`Failed to run ffmpeg: ${error.message}`));
			});
		});
	}

	private async runWhisper(
		options: WhisperOptions,
		onProgress?: (progress: number, message: string) => void
	): Promise<TranscriptionResult> {
		return new Promise((resolve, reject) => {
			const args = [
				'-m', options.modelPath,
				'-f', options.audioPath,
				'-t', (options.threads || 4).toString(),
				'-oj', // Output JSON
			];

			// Add language if specified
			if (options.language) {
				args.push('-l', options.language);
			}

			if (onProgress) {
				onProgress(20, 'Starting transcription...');
			}

			// Spawn whisper.cpp process
			this.currentProcess = spawn(this.whisperBinaryPath, args, {
				cwd: path.dirname(this.whisperBinaryPath)
			});

			let stdout = '';
			let stderr = '';
			let progressCount = 20;

			this.currentProcess.stdout?.on('data', (data: Buffer) => {
				stdout += data.toString();

				// Update progress (estimate based on output)
				progressCount = Math.min(90, progressCount + 5);
				if (onProgress) {
					onProgress(progressCount, 'Transcribing audio...');
				}
			});

			this.currentProcess.stderr?.on('data', (data: Buffer) => {
				stderr += data.toString();
				console.log('Whisper stderr:', data.toString());
			});

			this.currentProcess.on('close', (code) => {
				this.currentProcess = null;

				if (code !== 0) {
					reject(new Error(`Whisper process exited with code ${code}: ${stderr}`));
					return;
				}

				try {
					// Parse the JSON output
					const result = this.parseWhisperOutput(stdout, options.audioPath);

					if (onProgress) {
						onProgress(100, 'Transcription complete!');
					}

					resolve(result);
				} catch (error) {
					reject(new Error(`Failed to parse whisper output: ${error.message}`));
				}
			});

			this.currentProcess.on('error', (error) => {
				this.currentProcess = null;
				reject(new Error(`Failed to start whisper process: ${error.message}`));
			});
		});
	}

	private parseWhisperOutput(output: string, audioPath: string): TranscriptionResult {
		try {
			// Whisper.cpp outputs JSON in a specific format
			// Try to find and parse the JSON
			const jsonMatch = output.match(/\{[\s\S]*"transcription"[\s\S]*\}/);
			if (!jsonMatch) {
				// If no JSON found, treat entire output as text
				return {
					text: output.trim(),
					segments: [{
						start: 0,
						end: 0,
						text: output.trim()
					}],
					language: this.plugin.settings.language || 'auto',
					duration: 0
				};
			}

			const json = JSON.parse(jsonMatch[0]);

			// Convert to our format
			const segments: TranscriptSegment[] = (json.segments || []).map((seg: any) => ({
				start: seg.start || 0,
				end: seg.end || 0,
				text: seg.text || ''
			}));

			const text = segments.map(s => s.text).join(' ').trim();

			return {
				text,
				segments,
				language: json.language || this.plugin.settings.language || 'auto',
				duration: segments.length > 0 ? segments[segments.length - 1].end : 0
			};
		} catch (error) {
			console.error('Error parsing whisper output:', error);
			throw error;
		}
	}

	cancel() {
		if (this.currentProcess) {
			this.currentProcess.kill();
			this.currentProcess = null;
		}
	}

	// Download whisper.cpp binary for Windows
	async downloadBinary(onProgress?: (progress: number) => void): Promise<void> {
		// URL for whisper.cpp Windows binary
		const binaryUrl = 'https://github.com/ggerganov/whisper.cpp/releases/download/v1.5.4/whisper-bin-x64.zip';

		// TODO: Implement binary download
		// This would download the zip, extract whisper.exe, and place it in the bin directory

		throw new Error('Binary download not yet implemented. Please download whisper.cpp manually.');
	}
}
