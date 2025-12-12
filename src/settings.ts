import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import AudioTranscriptionPlugin from './main';

export type ModelSize = 'tiny' | 'base' | 'small' | 'medium' | 'large';
export type ProcessingMode = 'local' | 'cloud-whisper' | 'cloud-openrouter';
export type Language = 'auto' | 'en' | 'el' | 'multilingual';

export interface AudioTranscriptionSettings {
	// Transcription settings
	processingMode: ProcessingMode;
	modelSize: ModelSize;
	language: Language;
	enableDiarization: boolean;

	// Analysis settings (cloud-only via OpenRouter)
	customInstructions: string;

	// API Keys
	openaiApiKey: string;
	openrouterApiKey: string;
	openrouterModelName: string;

	// Output settings
	outputFolder: string;
	includeTimestamps: boolean;
	autoCreateTags: boolean;
	skipIfAnalyzed: boolean;
}

export const DEFAULT_SETTINGS: AudioTranscriptionSettings = {
	processingMode: 'local',
	modelSize: 'medium',
	language: 'auto',
	enableDiarization: false,
	customInstructions: '',
	openaiApiKey: '',
	openrouterApiKey: '',
	openrouterModelName: 'meta-llama/llama-3.2-3b-instruct',
	outputFolder: 'Transcriptions',
	includeTimestamps: true,
	autoCreateTags: true,
	skipIfAnalyzed: true
};

export class AudioTranscriptionSettingTab extends PluginSettingTab {
	plugin: AudioTranscriptionPlugin;

	constructor(app: App, plugin: AudioTranscriptionPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Audio Transcription Settings' });

		// ========================================
		// TRANSCRIPTION SETTINGS
		// ========================================
		containerEl.createEl('h3', { text: 'Transcription Settings' });

		new Setting(containerEl)
			.setName('Processing mode')
			.setDesc('Choose where to process your audio files')
			.addDropdown(dropdown => dropdown
				.addOption('local', 'Local (Whisper.cpp) - Private, no internet needed')
				.addOption('cloud-whisper', 'Cloud (OpenAI Whisper) - Faster, requires API key')
				.addOption('cloud-openrouter', 'Cloud (OpenRouter) - Use custom models')
				.setValue(this.plugin.settings.processingMode)
				.onChange(async (value: ProcessingMode) => {
					this.plugin.settings.processingMode = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh to show/hide relevant settings
				}));

		// Show model size only for local processing
		if (this.plugin.settings.processingMode === 'local') {
			new Setting(containerEl)
				.setName('Model size (local)')
				.setDesc('Larger models are more accurate but slower. Medium recommended for Greek.')
				.addDropdown(dropdown => dropdown
					.addOption('tiny', 'Tiny (75 MB) - Very fast, basic accuracy')
					.addOption('base', 'Base (142 MB) - Fast, good accuracy')
					.addOption('small', 'Small (466 MB) - Moderate speed, very good accuracy')
					.addOption('medium', 'Medium (1.5 GB) - Recommended, excellent accuracy')
					.addOption('large', 'Large (2.9 GB) - Best accuracy, slower')
					.setValue(this.plugin.settings.modelSize)
					.onChange(async (value: ModelSize) => {
						this.plugin.settings.modelSize = value;
						await this.plugin.saveSettings();
					}));
		}

		new Setting(containerEl)
			.setName('Default language')
			.setDesc('Select the primary language of your audio files')
			.addDropdown(dropdown => dropdown
				.addOption('auto', 'Auto-detect - Let the AI figure it out')
				.addOption('en', 'English only')
				.addOption('el', 'Greek only')
				.addOption('multilingual', 'Multilingual (both English and Greek)')
				.setValue(this.plugin.settings.language)
				.onChange(async (value: Language) => {
					this.plugin.settings.language = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Enable speaker diarization')
			.setDesc('Identify and label different speakers in the audio (requires cloud processing or advanced setup)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableDiarization)
				.onChange(async (value) => {
					this.plugin.settings.enableDiarization = value;
					await this.plugin.saveSettings();
				}));

		// ========================================
		// ANALYSIS SETTINGS
		// ========================================
		containerEl.createEl('h3', { text: 'Analysis Settings' });

		containerEl.createEl('p', {
			text: 'Analysis uses OpenRouter to extract summaries, key points, and action items from transcriptions.',
			cls: 'setting-item-description'
		});

		new Setting(containerEl)
			.setName('Custom analysis instructions')
			.setDesc('Add extra instructions for the AI to follow when analyzing transcripts')
			.addTextArea(text => text
				.setPlaceholder('Example: Focus on technical decisions and deadlines. Tag people using @name format.')
				.setValue(this.plugin.settings.customInstructions)
				.onChange(async (value) => {
					this.plugin.settings.customInstructions = value;
					await this.plugin.saveSettings();
				}))
			.then(setting => {
				setting.controlEl.querySelector('textarea')?.setAttribute('rows', '4');
			});

		// ========================================
		// API KEYS
		// ========================================
		containerEl.createEl('h3', { text: 'API Keys (for cloud processing)' });

		if (this.plugin.settings.processingMode === 'cloud-whisper') {
			new Setting(containerEl)
				.setName('OpenAI API key')
				.setDesc('Your OpenAI API key for Whisper API transcription')
				.addText(text => text
					.setPlaceholder('sk-...')
					.setValue(this.plugin.settings.openaiApiKey)
					.onChange(async (value) => {
						this.plugin.settings.openaiApiKey = value;
						await this.plugin.saveSettings();
					}))
				.then(setting => {
					setting.controlEl.querySelector('input')?.setAttribute('type', 'password');
				});
		}

		// OpenRouter is always needed for analysis
		new Setting(containerEl)
			.setName('OpenRouter API key')
			.setDesc('Required for AI-powered transcript analysis')
			.addText(text => text
				.setPlaceholder('sk-or-...')
				.setValue(this.plugin.settings.openrouterApiKey)
				.onChange(async (value) => {
					this.plugin.settings.openrouterApiKey = value;
					await this.plugin.saveSettings();
				}))
			.then(setting => {
				setting.controlEl.querySelector('input')?.setAttribute('type', 'password');
			});

		new Setting(containerEl)
			.setName('OpenRouter model name')
			.setDesc('The model to use for analysis (e.g., meta-llama/llama-3.2-3b-instruct)')
			.addText(text => text
				.setPlaceholder('meta-llama/llama-3.2-3b-instruct')
				.setValue(this.plugin.settings.openrouterModelName)
				.onChange(async (value) => {
					this.plugin.settings.openrouterModelName = value;
					await this.plugin.saveSettings();
				}));

		// ========================================
		// MODEL MANAGEMENT
		// ========================================
		if (this.plugin.settings.processingMode === 'local') {
			containerEl.createEl('h3', { text: 'Model Management' });

			const modelInfo = containerEl.createDiv();
			modelInfo.createEl('p', { text: 'Local models path: ./models/' });

			// Show model status
			const statusDiv = containerEl.createDiv({ cls: 'model-status' });
			this.displayModelStatus(statusDiv);

			new Setting(containerEl)
				.setName('Download model')
				.setDesc('Download the selected model for local transcription')
				.addButton(button => button
					.setButtonText('Download Model')
					.onClick(async () => {
						button.setDisabled(true);
						button.setButtonText('Downloading...');
						try {
							await this.plugin.modelManager.downloadModel(this.plugin.settings.modelSize);
							this.display(); // Refresh to update status
						} catch (error) {
							console.error('Failed to download model:', error);
						} finally {
							button.setDisabled(false);
							button.setButtonText('Download Model');
						}
					}));

			new Setting(containerEl)
				.setName('Download Whisper.cpp binary')
				.setDesc('Download the whisper.cpp executable for Windows (required for local processing)')
				.addButton(button => button
					.setButtonText('Download Binary')
					.onClick(async () => {
						button.setDisabled(true);
						button.setButtonText('Downloading...');
						try {
							await this.plugin.transcriptionService.localProcessor.downloadBinary((progress) => {
								button.setButtonText(`Downloading... ${progress}%`);
							});
							button.setButtonText('Download Complete!');
							setTimeout(() => {
								this.display(); // Refresh to update status
							}, 2000);
						} catch (error) {
							console.error('Failed to download binary:', error);
							new Notice(`Failed to download binary: ${error.message}`);
							button.setButtonText('Download Binary');
						} finally {
							button.setDisabled(false);
						}
					}));
		}

		// ========================================
		// OUTPUT SETTINGS
		// ========================================
		containerEl.createEl('h3', { text: 'Output Settings' });

		new Setting(containerEl)
			.setName('Output folder')
			.setDesc('Folder where transcription markdown files will be saved (leave empty for same folder as audio)')
			.addText(text => text
				.setPlaceholder('Transcriptions')
				.setValue(this.plugin.settings.outputFolder)
				.onChange(async (value) => {
					this.plugin.settings.outputFolder = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Include timestamps')
			.setDesc('Add timestamps to each segment in the transcription')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.includeTimestamps)
				.onChange(async (value) => {
					this.plugin.settings.includeTimestamps = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Auto-create tags')
			.setDesc('Automatically generate tags from the analysis')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoCreateTags)
				.onChange(async (value) => {
					this.plugin.settings.autoCreateTags = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Skip if already analyzed')
			.setDesc('Skip transcription if a markdown file with analysis already exists')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.skipIfAnalyzed)
				.onChange(async (value) => {
					this.plugin.settings.skipIfAnalyzed = value;
					await this.plugin.saveSettings();
				}));
	}

	private async displayModelStatus(containerEl: HTMLElement) {
		const models: ModelSize[] = ['tiny', 'base', 'small', 'medium', 'large'];
		const modelSizes = {
			tiny: '75 MB',
			base: '142 MB',
			small: '466 MB',
			medium: '1.5 GB',
			large: '2.9 GB'
		};

		containerEl.empty();
		containerEl.createEl('p', { text: 'Installed models:' });

		const list = containerEl.createEl('ul');

		for (const model of models) {
			const item = list.createEl('li');
			const exists = await this.plugin.modelManager.checkModelExists(model);
			const selected = model === this.plugin.settings.modelSize;

			const prefix = selected ? '� ' : '� ';
			const status = exists ? ` Installed (${modelSizes[model]})` : 'Not downloaded';
			item.textContent = `${prefix}${model}.bin - ${status}`;

			if (selected) {
				item.style.fontWeight = 'bold';
			}
		}
	}
}
