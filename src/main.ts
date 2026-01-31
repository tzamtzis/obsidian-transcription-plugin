import { Plugin, TFile, Notice, Menu } from 'obsidian';
import { AudioTranscriptionSettingTab, AudioTranscriptionSettings, DEFAULT_SETTINGS, Language } from './settings';
import { TranscriptionService } from './services/TranscriptionService';
import { ModelManager } from './services/ModelManager';
import { OverwriteConfirmationModal, LanguageSelectionModal } from './ui/TranscriptionModal';

export default class AudioTranscriptionPlugin extends Plugin {
	settings: AudioTranscriptionSettings;
	transcriptionService: TranscriptionService;
	modelManager: ModelManager;
	ribbonIconEl: HTMLElement | null = null;

	async onload() {
		console.debug('Loading Audio Transcription Plugin');

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
		console.debug('Unloading Audio Transcription Plugin');
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
		// Step 1: Ask user to select language and optionally override custom instructions
		const result = await new Promise<{ language: Language; customInstructions?: string } | null>((resolve) => {
			const modal = new LanguageSelectionModal(
				this.app,
				this.settings.favoriteLanguages,
				this.settings.language,
				this.settings.customInstructions
			);
			modal.setConfirmCallback((language, customInstructions) => {
				resolve({ language, customInstructions });
			});
			modal.setCancelCallback(() => {
				resolve(null);
			});
			modal.open();
		});

		if (!result) {
			// User cancelled language selection
			return;
		}

		const selectedLanguage = result.language;
		const customInstructionsOverride = result.customInstructions;

		// Step 2: Check if already transcribed
		const mdFile = this.getMarkdownFileName(file);
		const existingFile = this.app.vault.getAbstractFileByPath(mdFile);
		let shouldOverwrite = false;

		if (existingFile && existingFile instanceof TFile) {
			const content = await this.app.vault.read(existingFile);
			if (this.hasTranscriptionContent(content)) {
				// Show overwrite confirmation modal
				const confirmed = await new Promise<boolean>((resolve) => {
					const modal = new OverwriteConfirmationModal(this.app, mdFile);
					modal.setConfirmCallback((overwrite) => {
						resolve(overwrite);
					});
					modal.open();
				});

				if (!confirmed) {
					// User chose not to overwrite, just open the existing file
					await this.app.workspace.openLinkText(mdFile, '', true);
					return;
				}

				shouldOverwrite = true;
			}
		}

		// Step 3: Check if model is available (for local processing)
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

		// Step 4: Start transcription with selected language and custom instructions
		try {
			await this.transcriptionService.transcribe(file, shouldOverwrite, selectedLanguage, customInstructionsOverride);
		} catch (error) {
			console.error('Transcription failed:', error);
			new Notice(`Transcription failed: ${error.message}`);
		}
	}

	private getMarkdownFileName(audioFile: TFile): string {
		const baseName = audioFile.basename;
		const outputFolder = this.settings.outputFolder || '';

		if (outputFolder) {
			// Use specified output folder
			return `${outputFolder}/${baseName}.md`;
		} else {
			// Place in same directory as audio file
			const audioDir = audioFile.parent?.path || '';
			return audioDir ? `${audioDir}/${baseName}.md` : `${baseName}.md`;
		}
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
