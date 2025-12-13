import { Plugin, TFile, Notice, Menu } from 'obsidian';
import { AudioTranscriptionSettingTab, AudioTranscriptionSettings, DEFAULT_SETTINGS } from './settings';
import { TranscriptionService } from './services/TranscriptionService';
import { ModelManager } from './services/ModelManager';

export default class AudioTranscriptionPlugin extends Plugin {
	settings: AudioTranscriptionSettings;
	transcriptionService: TranscriptionService;
	modelManager: ModelManager;
	ribbonIconEl: HTMLElement | null = null;

	async onload() {
		console.log('Loading Audio Transcription Plugin');

		await this.loadSettings();

		// Initialize services
		this.modelManager = new ModelManager(this);
		this.transcriptionService = new TranscriptionService(this);

		// Add ribbon icon for transcription
		this.ribbonIconEl = this.addRibbonIcon(
			this.settings.ribbonIcon,
			'Transcribe audio file',
			async () => {
				await this.selectAndTranscribeAudioFile();
			}
		);

		// Register file menu event for context menu
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu: Menu, file: TFile) => {
				if (this.isAudioFile(file)) {
					menu.addItem((item) => {
						item
							.setTitle('Transcribe audio file')
							.setIcon('microphone')
							.onClick(async () => {
								await this.transcribeAudioFile(file);
							});
					});
				}
			})
		);

		// Add settings tab
		this.addSettingTab(new AudioTranscriptionSettingTab(this.app, this));

		// Check for models on startup
		await this.checkModelsOnStartup();
	}

	onunload() {
		console.log('Unloading Audio Transcription Plugin');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	updateRibbonIcon(iconName: string) {
		if (this.ribbonIconEl) {
			// Update the icon using Obsidian's setIcon method
			const iconEl = this.ribbonIconEl.querySelector('.svg-icon');
			if (iconEl) {
				iconEl.empty();
				// Use Obsidian's icon system
				(this.app as any).setIcon(iconEl, iconName);
			}
		}
	}

	private isAudioFile(file: TFile): boolean {
		const audioExtensions = ['m4a', 'mp3', 'wav', 'ogg', 'flac'];
		return audioExtensions.includes(file.extension.toLowerCase());
	}

	private async selectAndTranscribeAudioFile() {
		// TODO: Implement file picker for audio files
		new Notice('Please right-click on an audio file to transcribe it.');
	}

	private async transcribeAudioFile(file: TFile) {
		// Check if already transcribed
		const mdFile = this.getMarkdownFileName(file);
		const existingFile = this.app.vault.getAbstractFileByPath(mdFile);

		if (existingFile && existingFile instanceof TFile) {
			const content = await this.app.vault.read(existingFile);
			if (this.hasTranscriptionContent(content)) {
				new Notice('Analysis already available for this file');
				await this.app.workspace.openLinkText(mdFile, '', true);
				return;
			}
		}

		// Check if model is available (for local processing)
		if (this.settings.processingMode === 'local') {
			const modelExists = await this.modelManager.checkModelExists(this.settings.modelSize);
			if (!modelExists) {
				const shouldDownload = await this.promptModelDownload();
				if (shouldDownload) {
					await this.modelManager.downloadModel(this.settings.modelSize);
				} else {
					return;
				}
			}
		}

		// Start transcription
		try {
			await this.transcriptionService.transcribe(file);
		} catch (error) {
			console.error('Transcription failed:', error);
			new Notice(`Transcription failed: ${error.message}`);
		}
	}

	private getMarkdownFileName(audioFile: TFile): string {
		const baseName = audioFile.basename;
		const outputFolder = this.settings.outputFolder || '';
		return outputFolder ? `${outputFolder}/${baseName}.md` : `${baseName}.md`;
	}

	private hasTranscriptionContent(content: string): boolean {
		// Check if the file contains transcription markers
		return content.includes('## Full Transcription') ||
		       content.includes('audio_file:') ||
		       content.includes('transcribed_date:');
	}

	private async promptModelDownload(): Promise<boolean> {
		return new Promise((resolve) => {
			const modal = new Notice('Model required. Please download it from settings.', 10000);
			// TODO: Implement proper modal for model download confirmation
			resolve(false);
		});
	}

	private async checkModelsOnStartup() {
		if (this.settings.processingMode === 'local') {
			const modelExists = await this.modelManager.checkModelExists(this.settings.modelSize);
			if (!modelExists) {
				new Notice('Audio Transcription: No model found. Please download a model in settings.', 8000);
			}
		}
	}
}
