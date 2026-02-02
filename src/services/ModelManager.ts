import { Notice, FileSystemAdapter } from 'obsidian';
import AudioTranscriptionPlugin from '../main';
import { ModelSize } from '../settings';
import { ModelDownloadModal } from '../ui/TranscriptionModal';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import { IncomingMessage, ClientRequest } from 'http';

interface NodeError extends Error {
	code?: string;
	errno?: number;
	syscall?: string;
}

export interface ModelInfo {
	size: ModelSize;
	downloaded: boolean;
	fileSize: number;
	path: string;
}

export class ModelManager {
	private plugin: AudioTranscriptionPlugin;
	private modelsDir: string;
	private downloadsInProgress: Set<ModelSize> = new Set();
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
		const adapter = this.plugin.app.vault.adapter;
		if (!(adapter instanceof FileSystemAdapter)) {
			throw new Error('FileSystemAdapter required for model management');
		}
		const pluginDir = adapter.getBasePath();
		const configDir = this.plugin.app.vault.configDir;
		this.modelsDir = path.join(pluginDir, configDir, 'plugins', 'obsidian-transcription-plugin', 'models');
		this.ensureModelsDirectory();
	}

	private ensureModelsDirectory() {
		if (!fs.existsSync(this.modelsDir)) {
			fs.mkdirSync(this.modelsDir, { recursive: true });
		}
	}

	checkModelExists(modelSize: ModelSize): boolean {
		const modelPath = this.getModelPath(modelSize);
		return fs.existsSync(modelPath);
	}

	async downloadModel(
		modelSize: ModelSize,
		onProgress?: (downloaded: number, total: number) => void,
		maxRetries: number = 2
	): Promise<void> {
		// Check if download is already in progress
		if (this.downloadsInProgress.has(modelSize)) {
			throw new Error(`Download of ${modelSize} model is already in progress`);
		}

		// Mark download as in progress
		this.downloadsInProgress.add(modelSize);

		try {
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
		} finally {
			// Always remove from in-progress set when done
			this.downloadsInProgress.delete(modelSize);
		}
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
		let request: ClientRequest | null = null;

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

		try {
			modal.setStatus('Testing connection to server...');

			// Test connection first
			const canConnect = await this.testConnection(url);
			if (!canConnect) {
				const errorMsg = 'Cannot reach Hugging Face servers. This could be due to:\n' +
					'• Firewall or antivirus blocking the connection\n' +
					'• Network proxy requiring configuration\n' +
					'• Network connection issues\n\n' +
					'You can try:\n' +
					'1. Temporarily disable your antivirus/firewall\n' +
					'2. Check if you need to configure a proxy\n' +
					'3. Download the model manually from huggingface.co';
				console.error(errorMsg);
				throw new Error('Cannot reach Hugging Face servers. Check firewall/proxy settings or download manually.');
			}

			modal.setStatus('Connecting to server...');

			// Follow redirects and download
			await this.downloadWithRedirects(url, tempPath, (downloaded, total) => {
				if (onProgress) {
					onProgress(downloaded, total);
				}
				modal.updateProgress(downloaded, total);
			}, (req, stream) => {
				request = req;
				writeStream = stream;
			});

			if (downloadCancelled) {
				throw new Error('Download cancelled by user');
			}

			modal.setStatus('Finalizing download...');

			// Wait a moment for file system to release locks (especially on Windows)
			// This prevents EPERM/EBUSY errors when renaming
			await new Promise(resolve => setTimeout(resolve, 500));

			// Move temp file to final location with retry logic
			let retries = 3;
			while (retries > 0) {
				try {
					if (fs.existsSync(tempPath)) {
						// Check if destination file exists and remove it
						if (fs.existsSync(modelPath)) {
							fs.unlinkSync(modelPath);
						}
						fs.renameSync(tempPath, modelPath);
					}
					break; // Success!
				} catch (error) {
					retries--;
					if (retries === 0) {
						// Final attempt failed
						throw new Error(`Failed to finalize download: ${(error as Error).message}`);
					}
					// Wait before retry
					await new Promise(resolve => setTimeout(resolve, 1000));
				}
			}

			modal.setComplete();
			new Notice(`${modelSize} model downloaded successfully!`);

			// Close modal after 2 seconds
			setTimeout(() => {
				modal.close();
			}, 2000);

		} catch (error) {
			if (downloadCancelled) {
				modal.close();
				throw new Error('Download cancelled by user');
			}

			// Log detailed error information
			const err = error as NodeError;
			console.error('Failed to download model:', {
				error: err,
				message: err.message,
				code: err.code,
				errno: err.errno,
				syscall: err.syscall,
				stack: err.stack
			});

			// Show user-friendly error message
			let errorMessage = 'Download failed';
			let showManualInstructions = false;

			if (err.message.includes('Cannot reach Hugging Face')) {
				errorMessage = err.message;
				showManualInstructions = true;
			} else if (err.message.includes('timeout') || err.message.includes('stalled')) {
				errorMessage = 'Download timed out - connection too slow or unstable';
				showManualInstructions = true;
			} else if (err.code === 'ENOSPC') {
				errorMessage = 'Not enough disk space';
			} else if (err.code === 'EACCES' || err.code === 'EPERM') {
				errorMessage = 'Permission denied - check antivirus or folder permissions';
			} else if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND') {
				errorMessage = 'Network connection issue - check firewall/proxy settings';
				showManualInstructions = true;
			} else if (err.message) {
				errorMessage = err.message;
			}

			modal.setError(errorMessage);

			// Show manual download instructions if network-related
			if (showManualInstructions) {
				console.debug('\n═══════════════════════════════════════════════════════════');
				console.debug('MANUAL DOWNLOAD INSTRUCTIONS:');
				console.debug('═══════════════════════════════════════════════════════════');
				console.debug(`1. Open in browser: ${this.modelUrls[modelSize]}`);
				console.debug(`2. Save the file as: ggml-${modelSize}.bin`);
				console.debug(`3. Copy the file to: ${this.modelsDir}`);
				console.debug('4. Restart Obsidian');
				console.debug('═══════════════════════════════════════════════════════════\n');

				new Notice('Download failed. See console (Ctrl+Shift+I) for manual download instructions.', 10000);
			}

			// Clean up temp file
			if (fs.existsSync(tempPath)) {
				fs.unlinkSync(tempPath);
			}

			throw error;
		}
	}

	private async testConnection(url: string): Promise<boolean> {
		return new Promise((resolve) => {
			const urlObj = new URL(url);
			const request = https.get({
				hostname: urlObj.hostname,
				path: '/',
				timeout: 10000
			}, (response) => {
				response.destroy();
				resolve(true);
			});

			request.on('error', (error: NodeError) => {
				console.error('Connection test failed:', {
					hostname: urlObj.hostname,
					error: error.message,
					code: error.code
				});
				resolve(false);
			});

			request.on('timeout', () => {
				request.destroy();
				console.error('Connection test timeout:', urlObj.hostname);
				resolve(false);
			});
		});
	}

	private downloadWithRedirects(
		url: string,
		destPath: string,
		onProgress: (downloaded: number, total: number) => void,
		onStreamCreated?: (request: ClientRequest, stream: fs.WriteStream) => void,
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

					// Clear connection timeout - we've connected successfully
					clearTimeout(connectionTimeout);

					// Create write stream
					const fileStream = fs.createWriteStream(destPath);

					if (onStreamCreated) {
						onStreamCreated(request, fileStream);
					}

					// Start inactivity monitoring
					resetInactivityTimeout();

					// Track progress
					response.on('data', (chunk: Buffer) => {
						downloadedSize += chunk.length;
						onProgress(downloadedSize, totalSize);
						// Reset inactivity timeout - we're receiving data
						resetInactivityTimeout();
					});

					// Pipe to file
					response.pipe(fileStream);

					// Wait for both 'finish' and 'close' events
					fileStream.on('finish', () => {
						fileStream.close();
					});

					fileStream.on('close', () => {
						// Clean up timeouts
						clearTimeout(connectionTimeout);
						if (inactivityTimeout) {
							clearTimeout(inactivityTimeout);
						}
						// Only resolve after file is fully closed
						resolve();
					});

					fileStream.on('error', (error: NodeError) => {
						console.error('File stream error during download:', {
							error: error.message,
							code: error.code,
							downloadedSize,
							totalSize
						});
						// Clean up timeouts
						clearTimeout(connectionTimeout);
						if (inactivityTimeout) {
							clearTimeout(inactivityTimeout);
						}
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

					response.on('error', (error: NodeError) => {
						console.error('Response stream error during download:', {
							error: error.message,
							code: error.code,
							downloadedSize,
							totalSize
						});
						// Clean up timeouts
						clearTimeout(connectionTimeout);
						if (inactivityTimeout) {
							clearTimeout(inactivityTimeout);
						}
						fileStream.close();
						if (fs.existsSync(destPath)) {
							fs.unlinkSync(destPath);
						}
						reject(error);
					});
				});

				request.on('error', (error: NodeError) => {
					console.error('Request error during download:', {
						error: error.message,
						code: error.code,
						url: currentUrl
					});
					// Clean up timeouts
					clearTimeout(connectionTimeout);
					if (inactivityTimeout) {
						clearTimeout(inactivityTimeout);
					}
					reject(error);
				});

				// Set initial connection timeout (30 seconds to establish connection)
				// This will be cleared once we start receiving data
				let connectionTimeout = setTimeout(() => {
					console.error('Connection timeout triggered - no response from server');
					request.destroy();
					reject(new Error('Connection timeout - unable to reach server'));
				}, 30000);

				// Set inactivity timeout (resets every time we receive data)
				// Increased to 120 seconds to handle slow connections better
				let inactivityTimeout: NodeJS.Timeout | null = null;
				let lastProgressTime = Date.now();
				const resetInactivityTimeout = () => {
					if (inactivityTimeout) {
						clearTimeout(inactivityTimeout);
					}
					lastProgressTime = Date.now();
					// If no data received for 120 seconds, consider it stalled
					inactivityTimeout = setTimeout(() => {
						const stalledDuration = Math.round((Date.now() - lastProgressTime) / 1000);
						console.error(`Download stalled - no data received for ${stalledDuration} seconds`);
						request.destroy();
						reject(new Error(`Download stalled - no data received for ${stalledDuration} seconds`));
					}, 120000);
				};
			};

			download(url, 0);
		});
	}

	getModelPath(modelSize: ModelSize): string {
		return path.join(this.modelsDir, `ggml-${modelSize}.bin`);
	}

	getModelUrl(modelSize: ModelSize): string {
		return this.modelUrls[modelSize];
	}

	getModelsDir(): string {
		return this.modelsDir;
	}

	validateModel(modelSize: ModelSize): boolean {
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
