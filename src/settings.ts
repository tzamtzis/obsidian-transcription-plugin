import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import AudioTranscriptionPlugin from './main';
import { ManualDownloadInstructionsModal } from './ui/TranscriptionModal';
import * as os from 'os';

export type ModelSize = 'tiny' | 'base' | 'small' | 'medium' | 'large';
export type ProcessingMode = 'local' | 'cloud-whisper' | 'cloud-openrouter';
export type Language =
	| 'auto'
	| 'en' // English
	| 'zh' // Chinese (Mandarin)
	| 'es' // Spanish
	| 'hi' // Hindi
	| 'ar' // Arabic
	| 'pt' // Portuguese
	| 'bn' // Bengali
	| 'ru' // Russian
	| 'ja' // Japanese
	| 'de' // German
	| 'fr' // French
	| 'ur' // Urdu
	| 'it' // Italian
	| 'tr' // Turkish
	| 'ko' // Korean
	| 'vi' // Vietnamese
	| 'pl' // Polish
	| 'uk' // Ukrainian
	| 'nl' // Dutch
	| 'el' // Greek
	| 'multilingual'; // Mixed languages

export const LANGUAGE_NAMES: Record<Language, string> = {
	'auto': 'Auto-detect',
	'en': 'English',
	'zh': 'Chinese (Mandarin)',
	'es': 'Spanish',
	'hi': 'Hindi',
	'ar': 'Arabic',
	'pt': 'Portuguese',
	'bn': 'Bengali',
	'ru': 'Russian',
	'ja': 'Japanese',
	'de': 'German',
	'fr': 'French',
	'ur': 'Urdu',
	'it': 'Italian',
	'tr': 'Turkish',
	'ko': 'Korean',
	'vi': 'Vietnamese',
	'pl': 'Polish',
	'uk': 'Ukrainian',
	'nl': 'Dutch',
	'el': 'Greek',
	'multilingual': 'Mixed (English & Greek)'
};

export interface RecentTranscription {
	audioFileName: string;
	markdownPath: string;
	transcribedDate: string;
	duration: string;
	language: string;
}

export interface AudioTranscriptionSettings {
	// Transcription settings
	processingMode: ProcessingMode;
	modelSize: ModelSize;
	language: Language;
	favoriteLanguages: Language[];
	enableDiarization: boolean;
	speakerCount: number;

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

	// UI settings
	ribbonIcon: string;

	// Recent transcriptions
	recentTranscriptions: RecentTranscription[];
	maxRecentTranscriptions: number;
}

export const DEFAULT_SETTINGS: AudioTranscriptionSettings = {
	processingMode: 'local',
	modelSize: 'medium',
	language: 'auto',
	favoriteLanguages: ['auto', 'en', 'el', 'multilingual'],
	enableDiarization: false,
	speakerCount: 2,
	customInstructions: '',
	openaiApiKey: '',
	openrouterApiKey: '',
	openrouterModelName: 'meta-llama/llama-3.2-3b-instruct',
	outputFolder: '',
	includeTimestamps: true,
	autoCreateTags: true,
	skipIfAnalyzed: true,
	ribbonIcon: 'microphone',
	recentTranscriptions: [],
	maxRecentTranscriptions: 10
};

export class AudioTranscriptionSettingTab extends PluginSettingTab {
	plugin: AudioTranscriptionPlugin;

	constructor(app: App, plugin: AudioTranscriptionPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	async display(): Promise<void> {
		const { containerEl } = this;
		containerEl.empty();

		// Add styles for recent transcriptions
		this.addRecentTranscriptionsStyles();

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
						this.display(); // Refresh to update recommendation
					}));

			// Show system-based recommendation
			const recommendationDiv = containerEl.createDiv({ cls: 'setting-item-description' });
			recommendationDiv.style.marginTop = '-8px';
			recommendationDiv.style.marginBottom = '16px';
			recommendationDiv.style.paddingLeft = '0';
			recommendationDiv.style.fontSize = '13px';
			recommendationDiv.setText(this.getModelRecommendationText());
		}

		new Setting(containerEl)
			.setName('Favorite languages')
			.setDesc('Select the languages you commonly transcribe. You will be asked to choose from these before each transcription.')
			.setClass('favorite-languages-setting');

		// Create checkboxes for all languages
		const favLangContainer = containerEl.createDiv({ cls: 'favorite-languages-container' });

		const allLanguages: Language[] = [
			'auto', 'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'zh',
			'ar', 'hi', 'tr', 'ko', 'nl', 'pl', 'uk', 'vi', 'bn', 'ur', 'el', 'multilingual'
		];

		for (const lang of allLanguages) {
			const langDiv = favLangContainer.createDiv({ cls: 'favorite-language-item' });
			const checkbox = langDiv.createEl('input', { type: 'checkbox' });
			checkbox.checked = this.plugin.settings.favoriteLanguages.includes(lang);
			checkbox.addEventListener('change', async () => {
				if (checkbox.checked) {
					if (!this.plugin.settings.favoriteLanguages.includes(lang)) {
						this.plugin.settings.favoriteLanguages.push(lang);
					}
				} else {
					this.plugin.settings.favoriteLanguages = this.plugin.settings.favoriteLanguages.filter(l => l !== lang);
				}
				await this.plugin.saveSettings();
			});

			const label = langDiv.createEl('label');
			label.textContent = LANGUAGE_NAMES[lang];
			label.prepend(checkbox);
		}

		// Add styles for the favorite languages UI
		this.addFavoriteLanguagesStyles();

		new Setting(containerEl)
			.setName('Enable speaker diarization')
			.setDesc('Identify and label different speakers in the audio')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableDiarization)
				.onChange(async (value) => {
					this.plugin.settings.enableDiarization = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh to show/hide speaker count
				}));

		// Show diarization info and speaker count when enabled
		if (this.plugin.settings.enableDiarization) {
			// Info about diarization status
			const infoDiv = containerEl.createDiv({ cls: 'setting-item-description' });
			infoDiv.style.marginTop = '-8px';
			infoDiv.style.marginBottom = '12px';
			infoDiv.style.padding = '8px 12px';
			infoDiv.style.backgroundColor = 'var(--background-secondary)';
			infoDiv.style.borderRadius = '4px';
			infoDiv.style.fontSize = '13px';

			infoDiv.innerHTML = `
				<strong>ℹ️ Speaker Diarization Status:</strong><br/>
				<span style="color: var(--text-muted);">
				Currently, the plugin structure supports speaker labels, but automatic speaker detection is not yet implemented.<br/><br/>
				<strong>Future options:</strong><br/>
				• Cloud services (AssemblyAI, Deepgram) - Coming soon<br/>
				• Local diarization (pyannote-audio) - Requires Python setup<br/><br/>
				For now, you can manually edit speaker labels in the generated markdown files.
				</span>
			`;

			// Speaker count setting
			new Setting(containerEl)
				.setName('Expected speaker count')
				.setDesc('Number of speakers expected in the audio (used when diarization is implemented)')
				.addSlider(slider => slider
					.setLimits(2, 10, 1)
					.setValue(this.plugin.settings.speakerCount)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.speakerCount = value;
						await this.plugin.saveSettings();
					}));
		}

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
							new Notice(`Successfully downloaded ${this.plugin.settings.modelSize} model!`);
						} catch (error) {
							console.error('Failed to download model:', error);
							const errorMessage = error.message || 'Unknown error occurred';

							// Show manual download instructions modal for network-related errors
							const isNetworkError =
								errorMessage.includes('timeout') ||
								errorMessage.includes('stalled') ||
								errorMessage.includes('Cannot reach') ||
								errorMessage.includes('Network connection') ||
								errorMessage.includes('Connection timeout');

							if (isNetworkError) {
								// Show detailed manual download instructions in a modal
								const modelUrl = this.plugin.modelManager.getModelUrl(this.plugin.settings.modelSize);
								const modelsDir = this.plugin.modelManager.getModelsDir();
								const modal = new ManualDownloadInstructionsModal(
									this.app,
									this.plugin.settings.modelSize,
									modelUrl,
									modelsDir
								);
								modal.open();
							} else {
								// Show standard error notice for non-network errors
								new Notice(`Failed to download model: ${errorMessage}`, 8000);

								if (errorMessage.includes('ENOSPC')) {
									new Notice('Error: Not enough disk space. Please free up space and try again', 8000);
								} else if (errorMessage.includes('EACCES')) {
									new Notice('Error: Permission denied. Check folder permissions', 8000);
								}
							}
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

		// ========================================
		// UI SETTINGS
		// ========================================
		containerEl.createEl('h3', { text: 'UI Settings' });

		new Setting(containerEl)
			.setName('Ribbon icon')
			.setDesc('Choose the icon displayed in the sidebar ribbon')
			.addDropdown(dropdown => dropdown
				.addOption('microphone', '🎤 Microphone')
				.addOption('audio-file', '🎵 Audio File')
				.addOption('headphones', '🎧 Headphones')
				.addOption('mic', '🎙️ Mic')
				.addOption('audio-lines', '🎚️ Audio Lines')
				.addOption('volume-2', '🔊 Volume')
				.addOption('radio', '📻 Radio')
				.addOption('podcast', '🎙️ Podcast')
				.setValue(this.plugin.settings.ribbonIcon)
				.onChange(async (value) => {
					this.plugin.settings.ribbonIcon = value;
					await this.plugin.saveSettings();
					this.plugin.updateRibbonIcon(value);
				}));

		// ========================================
		// RECENT TRANSCRIPTIONS
		// ========================================
		containerEl.createEl('h3', { text: 'Recent Transcriptions' });

		if (this.plugin.settings.recentTranscriptions.length === 0) {
			containerEl.createEl('p', {
				text: 'No recent transcriptions yet. Your transcriptions will appear here.',
				cls: 'setting-item-description'
			});
		} else {
			// Display recent transcriptions list
			const listContainer = containerEl.createDiv({ cls: 'recent-transcriptions-list' });

			for (const recent of this.plugin.settings.recentTranscriptions) {
				const itemDiv = listContainer.createDiv({ cls: 'recent-transcription-item' });

				// Create clickable link
				const link = itemDiv.createEl('a', {
					text: recent.audioFileName,
					cls: 'recent-transcription-link'
				});
				link.addEventListener('click', async (e) => {
					e.preventDefault();
					await this.plugin.app.workspace.openLinkText(recent.markdownPath, '', true);
				});

				// Add metadata
				const metadata = itemDiv.createDiv({ cls: 'recent-transcription-meta' });
				const dateObj = new Date(recent.transcribedDate);
				const formattedDate = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
				metadata.setText(`${formattedDate} • ${recent.duration} • ${recent.language.toUpperCase()}`);
			}

			// Add clear button
			new Setting(containerEl)
				.setName('Clear history')
				.setDesc('Remove all entries from recent transcriptions')
				.addButton(button => button
					.setButtonText('Clear All')
					.setWarning()
					.onClick(async () => {
						this.plugin.settings.recentTranscriptions = [];
						await this.plugin.saveSettings();
						this.display(); // Refresh to show empty state
					}));
		}

		// Add some spacing
		containerEl.createEl('div', { cls: 'setting-item-separator' });

		// ========================================
		// STATUS INFORMATION
		// ========================================
		if (this.plugin.settings.processingMode === 'local') {
			containerEl.createEl('h3', { text: 'System Status' });

			// Binary status
			const binaryStatusDiv = containerEl.createDiv({ cls: 'status-section' });
			await this.displayBinaryStatus(binaryStatusDiv);

			// Add some spacing
			containerEl.createEl('div', { cls: 'setting-item-separator' });
		}
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
		list.style.listStyle = 'none';
		list.style.paddingLeft = '1em';

		for (const model of models) {
			const item = list.createEl('li');
			item.style.marginBottom = '0.5em';
			item.style.fontFamily = 'var(--font-monospace)';
			const exists = await this.plugin.modelManager.checkModelExists(model);
			const selected = model === this.plugin.settings.modelSize;

			const prefix = selected ? '> ' : '  ';
			const statusIcon = exists ? '[OK]' : '[  ]';
			const statusText = exists ? `Installed (${modelSizes[model]})` : 'Not downloaded';
			item.textContent = `${prefix}${statusIcon} ${model}.bin - ${statusText}`;

			if (selected) {
				item.style.fontWeight = 'bold';
				item.style.color = 'var(--interactive-accent)';
			}
		}
	}

	private async displayBinaryStatus(containerEl: HTMLElement) {
		containerEl.empty();

		const setting = new Setting(containerEl)
			.setName('Whisper.cpp Binary')
			.setDesc('Status of the local transcription binary');

		// Check if binary exists
		const binaryExists = await this.plugin.transcriptionService.localProcessor.checkBinaryExists();

		if (binaryExists) {
			setting.setDesc('✅ Binary installed and ready');
			setting.descEl.style.color = 'var(--text-success)';
		} else {
			setting.setDesc('❌ Binary not installed. Download it from Model Management section above.');
			setting.descEl.style.color = 'var(--text-error)';
		}

		// Add current model status
		const modelSetting = new Setting(containerEl)
			.setName('Selected Model')
			.setDesc('Status of the currently selected Whisper model');

		const modelExists = await this.plugin.modelManager.checkModelExists(this.plugin.settings.modelSize);
		const modelName = `${this.plugin.settings.modelSize}.bin`;

		if (modelExists) {
			modelSetting.setDesc(`✅ Model "${modelName}" is installed`);
			modelSetting.descEl.style.color = 'var(--text-success)';
		} else {
			modelSetting.setDesc(`❌ Model "${modelName}" is not installed. Download it from Model Management section above.`);
			modelSetting.descEl.style.color = 'var(--text-error)';
		}
	}

	private getSystemSpecs(): { totalMemoryGB: number; cpuCores: number } {
		const totalMemoryBytes = os.totalmem();
		const totalMemoryGB = Math.round(totalMemoryBytes / (1024 * 1024 * 1024));
		const cpuCores = os.cpus().length;
		return { totalMemoryGB, cpuCores };
	}

	private getRecommendedModelSize(): ModelSize {
		const { totalMemoryGB } = this.getSystemSpecs();

		// Model memory requirements (approximate):
		// Tiny: ~400 MB RAM
		// Base: ~600 MB RAM
		// Small: ~1.5 GB RAM
		// Medium: ~3 GB RAM
		// Large: ~6 GB RAM

		if (totalMemoryGB < 4) {
			return 'tiny';
		} else if (totalMemoryGB < 8) {
			return 'base';
		} else if (totalMemoryGB < 12) {
			return 'small';
		} else if (totalMemoryGB < 20) {
			return 'medium';
		} else {
			return 'large';
		}
	}

	private getModelRecommendationText(): string {
		const { totalMemoryGB, cpuCores } = this.getSystemSpecs();
		const recommended = this.getRecommendedModelSize();
		const current = this.plugin.settings.modelSize;

		let text = `System: ${totalMemoryGB} GB RAM, ${cpuCores} CPU cores. `;

		if (current === recommended) {
			text += `✅ "${current}" model is optimal for your system.`;
		} else {
			const comparison = this.compareModelSize(current, recommended);
			if (comparison > 0) {
				text += `⚠️ "${current}" model may be slow. Consider "${recommended}" for better performance.`;
			} else {
				text += `💡 Your system can handle "${recommended}" for better accuracy.`;
			}
		}

		return text;
	}

	private compareModelSize(a: ModelSize, b: ModelSize): number {
		const sizes: ModelSize[] = ['tiny', 'base', 'small', 'medium', 'large'];
		return sizes.indexOf(a) - sizes.indexOf(b);
	}

	private addRecentTranscriptionsStyles() {
		// Check if styles already added
		if (document.getElementById('recent-transcriptions-styles')) {
			return;
		}

		const style = document.createElement('style');
		style.id = 'recent-transcriptions-styles';
		style.textContent = `
			.recent-transcriptions-list {
				margin-bottom: 16px;
			}

			.recent-transcription-item {
				padding: 8px 12px;
				margin-bottom: 8px;
				background-color: var(--background-secondary);
				border-radius: 4px;
				border-left: 3px solid var(--interactive-accent);
			}

			.recent-transcription-item:hover {
				background-color: var(--background-secondary-alt);
			}

			.recent-transcription-link {
				color: var(--text-normal);
				text-decoration: none;
				font-weight: 500;
				cursor: pointer;
			}

			.recent-transcription-link:hover {
				color: var(--interactive-accent);
			}

			.recent-transcription-meta {
				font-size: 12px;
				color: var(--text-muted);
				margin-top: 4px;
			}
		`;
		document.head.appendChild(style);
	}

	private addFavoriteLanguagesStyles() {
		// Check if styles already added
		if (document.getElementById('favorite-languages-styles')) {
			return;
		}

		const style = document.createElement('style');
		style.id = 'favorite-languages-styles';
		style.textContent = `
			.favorite-languages-container {
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
				gap: 8px;
				margin-top: 12px;
				margin-bottom: 16px;
				padding: 12px;
				background-color: var(--background-secondary);
				border-radius: 4px;
			}

			.favorite-language-item {
				display: flex;
				align-items: center;
			}

			.favorite-language-item label {
				display: flex;
				align-items: center;
				gap: 8px;
				cursor: pointer;
				font-size: 13px;
				color: var(--text-normal);
			}

			.favorite-language-item input[type="checkbox"] {
				cursor: pointer;
				width: 16px;
				height: 16px;
			}

			.favorite-language-item label:hover {
				color: var(--interactive-accent);
			}
		`;
		document.head.appendChild(style);
	}
}
