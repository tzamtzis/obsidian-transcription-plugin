import { Notice } from 'obsidian';
import AudioTranscriptionPlugin from '../main';
import { ModelSize } from '../settings';
import { ModelDownloadModal } from '../ui/TranscriptionModal';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import { IncomingMessage } from 'http';

export interface ModelInfo {
	size: ModelSize;
	downloaded: boolean;
	fileSize: number;
	path: string;
}

export class ModelManager {
	private plugin: AudioTranscriptionPlugin;
	private modelsDir: string;
	private modelUrls: Record<ModelSize, string> = {
		tiny: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin',
		base: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin',
		small: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin',
		medium: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin',
		large: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin'
	};

	constructor(plugin: AudioTranscriptionPlugin) {
		this.plugin = plugin;
		// Use plugin's data directory for models
		const pluginDir = (this.plugin.app.vault.adapter as any).basePath;
		this.modelsDir = path.join(pluginDir, '.obsidian', 'plugins', 'obsidian-transcription-plugin', 'models');
		this.ensureModelsDirectory();
	}

	private ensureModelsDirectory() {
		if (!fs.existsSync(this.modelsDir)) {
			fs.mkdirSync(this.modelsDir, { recursive: true });
		}
	}

	async checkModelExists(modelSize: ModelSize): Promise<boolean> {
		const modelPath = this.getModelPath(modelSize);
		return fs.existsSync(modelPath);
	}

	async downloadModel(
		modelSize: ModelSize,
		onProgress?: (downloaded: number, total: number) => void,
		maxRetries: number = 2
	): Promise<void> {
		let lastError: Error | null = null;

		// Try downloading with retries
		for (let attempt = 0; attempt < maxRetries; attempt++) {
			try {
				if (attempt > 0) {
					new Notice(`Retrying download (attempt ${attempt + 1}/${maxRetries})...`);
				}
				await this.downloadModelAttempt(modelSize, onProgress);
				return; // Success!
			} catch (error) {
				lastError = error;
				console.error(`Download attempt ${attempt + 1} failed:`, error);

				// If it's a user cancellation, don't retry
				if (error.message && error.message.includes('cancelled')) {
					throw error;
				}

				// Wait a bit before retrying
				if (attempt < maxRetries - 1) {
					await new Promise(resolve => setTimeout(resolve, 2000));
				}
			}
		}

		// All attempts failed
		throw lastError || new Error('Download failed after multiple attempts');
	}

	private async downloadModelAttempt(
		modelSize: ModelSize,
		onProgress?: (downloaded: number, total: number) => void
	): Promise<void> {
		const url = this.modelUrls[modelSize];
		const modelPath = this.getModelPath(modelSize);
		const tempPath = `${modelPath}.download`;

		// Create download modal
		const modal = new ModelDownloadModal(this.plugin.app, modelSize);
		modal.open();

		let downloadCancelled = false;
		let writeStream: fs.WriteStream | null = null;
		let request: any = null;

		// Set up cancellation
		modal.setCancelCallback(() => {
			downloadCancelled = true;
			if (request) {
				request.destroy();
			}
			if (writeStream) {
				writeStream.destroy();
			}
			// Clean up temp file
			if (fs.existsSync(tempPath)) {
				fs.unlinkSync(tempPath);
			}
		});

		return new Promise((resolve, reject) => {
			try {
				modal.setStatus('Connecting to server...');

				// Follow redirects and download
				this.downloadWithRedirects(url, tempPath, (downloaded, total) => {
					if (onProgress) {
						onProgress(downloaded, total);
					}
					modal.updateProgress(downloaded, total);
				}, (req, stream) => {
					request = req;
					writeStream = stream;
				}).then(() => {
					if (downloadCancelled) {
						reject(new Error('Download cancelled by user'));
						return;
					}

					// Move temp file to final location
					if (fs.existsSync(tempPath)) {
						fs.renameSync(tempPath, modelPath);
					}

					modal.setComplete();
					new Notice(`${modelSize} model downloaded successfully!`);

					// Close modal after 2 seconds
					setTimeout(() => {
						modal.close();
					}, 2000);

					resolve();
				}).catch((error) => {
					if (downloadCancelled) {
						modal.close();
						reject(new Error('Download cancelled by user'));
						return;
					}

					console.error('Failed to download model:', error);
					modal.setError(error.message || 'Download failed');

					// Clean up temp file
					if (fs.existsSync(tempPath)) {
						fs.unlinkSync(tempPath);
					}

					reject(error);
				});
			} catch (error) {
				modal.setError(error.message || 'Failed to start download');
				reject(error);
			}
		});
	}

	private downloadWithRedirects(
		url: string,
		destPath: string,
		onProgress: (downloaded: number, total: number) => void,
		onStreamCreated?: (request: any, stream: fs.WriteStream) => void,
		maxRedirects: number = 5
	): Promise<void> {
		return new Promise((resolve, reject) => {
			const download = (currentUrl: string, redirectCount: number) => {
				const request = https.get(currentUrl, (response: IncomingMessage) => {
					// Handle redirects
					if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
						const redirectUrl = response.headers.location;
						if (!redirectUrl) {
							reject(new Error('Redirect without location'));
							return;
						}

						if (redirectCount >= maxRedirects) {
							reject(new Error('Too many redirects'));
							return;
						}

						download(redirectUrl, redirectCount + 1);
						return;
					}

					if (response.statusCode !== 200) {
						reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
						return;
					}

					const totalSize = parseInt(response.headers['content-length'] || '0', 10);
					let downloadedSize = 0;

					// Create write stream
					const fileStream = fs.createWriteStream(destPath);

					if (onStreamCreated) {
						onStreamCreated(request, fileStream);
					}

					// Track progress
					response.on('data', (chunk: Buffer) => {
						downloadedSize += chunk.length;
						onProgress(downloadedSize, totalSize);
					});

					// Pipe to file
					response.pipe(fileStream);

					// Wait for both 'finish' and 'close' events
					fileStream.on('finish', () => {
						fileStream.close();
					});

					fileStream.on('close', () => {
						// Only resolve after file is fully closed
						resolve();
					});

					fileStream.on('error', (error) => {
						fileStream.close();
						if (fs.existsSync(destPath)) {
							try {
								fs.unlinkSync(destPath);
							} catch (e) {
								console.error('Failed to delete temp file:', e);
							}
						}
						reject(error);
					});

					response.on('error', (error) => {
						fileStream.close();
						fs.unlinkSync(destPath);
						reject(error);
					});
				});

				request.on('error', (error) => {
					reject(error);
				});

				request.setTimeout(30000, () => {
					request.destroy();
					reject(new Error('Download timeout'));
				});
			};

			download(url, 0);
		});
	}

	getModelPath(modelSize: ModelSize): string {
		return path.join(this.modelsDir, `ggml-${modelSize}.bin`);
	}

	async validateModel(modelSize: ModelSize): Promise<boolean> {
		const modelPath = this.getModelPath(modelSize);

		if (!fs.existsSync(modelPath)) {
			return false;
		}

		// Basic validation: check if file is not empty
		const stats = fs.statSync(modelPath);
		return stats.size > 1000000; // At least 1MB
	}

	listAvailableModels(): ModelInfo[] {
		const models: ModelSize[] = ['tiny', 'base', 'small', 'medium', 'large'];
		const modelSizes = {
			tiny: 75 * 1024 * 1024,
			base: 142 * 1024 * 1024,
			small: 466 * 1024 * 1024,
			medium: 1.5 * 1024 * 1024 * 1024,
			large: 2.9 * 1024 * 1024 * 1024
		};

		return models.map(size => ({
			size,
			downloaded: fs.existsSync(this.getModelPath(size)),
			fileSize: modelSizes[size],
			path: this.getModelPath(size)
		}));
	}
}
