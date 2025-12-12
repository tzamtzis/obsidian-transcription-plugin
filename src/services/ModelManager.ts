import { Notice, requestUrl } from 'obsidian';
import AudioTranscriptionPlugin from '../main';
import { ModelSize } from '../settings';
import * as path from 'path';
import * as fs from 'fs';

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
		onProgress?: (progress: number) => void
	): Promise<void> {
		const url = this.modelUrls[modelSize];
		const modelPath = this.getModelPath(modelSize);

		try {
			new Notice(`Starting download of ${modelSize} model...`);

			// TODO: Implement actual download with progress tracking
			// This is a placeholder implementation
			// In reality, we'd need to use streaming download with progress callbacks

			// For now, we'll use a simple fetch with Obsidian's requestUrl
			const response = await requestUrl({
				url: url,
				method: 'GET'
			});

			// Write the binary data to file
			fs.writeFileSync(modelPath, Buffer.from(response.arrayBuffer));

			new Notice(`${modelSize} model downloaded successfully!`);
		} catch (error) {
			console.error('Failed to download model:', error);
			new Notice(`Failed to download model: ${error.message}`);
			throw error;
		}
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
