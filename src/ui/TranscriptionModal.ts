import { Modal, App, ButtonComponent, Notice } from 'obsidian';
import { ModelSize, Language, LANGUAGE_NAMES } from '../settings';

export class ManualDownloadInstructionsModal extends Modal {
	constructor(app: App, private modelSize: ModelSize, private modelUrl: string, private modelsDir: string) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('manual-download-modal');

		// Title
		contentEl.createEl('h2', { text: 'Automatic download failed' });

		// Error explanation
		const errorSection = contentEl.createDiv({ cls: 'download-error-section' });
		errorSection.createEl('h3', { text: 'What went wrong' });
		errorSection.createEl('p', {
			text: 'Both download attempts failed. This is usually caused by:',
			cls: 'error-intro'
		});

		const causesList = errorSection.createEl('ul', { cls: 'causes-list' });
		causesList.createEl('li', { text: 'Antivirus or firewall blocking the connection to Hugging Face.' });
		causesList.createEl('li', { text: 'Network proxy or corporate firewall restrictions.' });
		causesList.createEl('li', { text: 'Slow or unstable internet connection.' });
		causesList.createEl('li', { text: 'Windows Defender blocking downloads.' });

		// Manual instructions
		const instructionsSection = contentEl.createDiv({ cls: 'download-instructions-section' });
		instructionsSection.createEl('h3', { text: 'Manual download instructions' });

		const steps = instructionsSection.createEl('ol', { cls: 'instruction-steps' });

		// Step 1
		const step1 = steps.createEl('li');
		step1.createEl('strong', { text: 'Download the file:' });
		step1.createEl('br');
		const urlLink = step1.createEl('a', {
			text: this.modelUrl,
			href: this.modelUrl,
			cls: 'download-link'
		});
		urlLink.setAttr('target', '_blank');
		const copyUrlBtn = step1.createEl('button', { text: 'Copy URL', cls: 'copy-button' });
		copyUrlBtn.onclick = () => {
			void navigator.clipboard.writeText(this.modelUrl);
			new Notice('URL copied to clipboard!');
		};

		// Step 2
		const step2 = steps.createEl('li');
		step2.createEl('strong', { text: 'Save the file as:' });
		step2.createEl('br');
		step2.createEl('code', { text: `ggml-${this.modelSize}.bin`, cls: 'filename' });
		const copyFileBtn = step2.createEl('button', { text: 'Copy', cls: 'copy-button' });
		copyFileBtn.onclick = () => {
			void navigator.clipboard.writeText(`ggml-${this.modelSize}.bin`);
			new Notice('Filename copied to clipboard!');
		};

		// Step 3
		const step3 = steps.createEl('li');
		step3.createEl('strong', { text: 'Copy the file to this folder:' });
		step3.createEl('br');
		step3.createEl('code', { text: this.modelsDir, cls: 'filepath' });
		const copyPathBtn = step3.createEl('button', { text: 'Copy path', cls: 'copy-button' });
		copyPathBtn.onclick = () => {
			void navigator.clipboard.writeText(this.modelsDir);
			new Notice('Path copied to clipboard!');
		};
		step3.createEl('br');
		const openFolderBtn = step3.createEl('button', { text: 'Open folder', cls: 'open-folder-button' });
		openFolderBtn.onclick = () => {
			window.require('electron').shell.openPath(this.modelsDir);
		};

		// Step 4
		const step4 = steps.createEl('li');
		step4.createEl('strong', { text: 'Restart Obsidian' });
		step4.createEl('br');
		step4.createEl('span', { text: 'The model will be detected automatically after restart.' });

		// Troubleshooting section
		const troubleshootSection = contentEl.createDiv({ cls: 'troubleshooting-section' });
		troubleshootSection.createEl('h3', { text: 'If download still fails in browser' });
		const troubleshootList = troubleshootSection.createEl('ul');
		troubleshootList.createEl('li', { text: 'Temporarily disable your antivirus/firewall.' });
		troubleshootList.createEl('li', { text: 'Try downloading from a different network (mobile hotspot).' });
		troubleshootList.createEl('li', { text: 'Use a VPN if Hugging Face is blocked in your region.' });

		// Close button
		const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
		new ButtonComponent(buttonContainer)
			.setButtonText('Close')
			.setCta()
			.onClick(() => this.close());
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

export class ModelDownloadModal extends Modal {
	private progressBar: HTMLDivElement;
	private progressText: HTMLDivElement;
	private statusText: HTMLDivElement;
	private cancelButton: ButtonComponent;
	private onCancel?: () => void;
	private cancelled: boolean = false;

	constructor(app: App, private modelName: string) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl('h2', { text: `Downloading ${this.modelName} model` });

		// Status text
		this.statusText = contentEl.createDiv({ cls: 'model-download-status' });
		this.statusText.setText('Initializing download...');

		// Progress container
		const progressContainer = contentEl.createDiv({ cls: 'model-download-progress-container' });

		// Progress bar background
		const progressBg = progressContainer.createDiv({ cls: 'model-download-progress-bg' });

		// Progress bar fill
		this.progressBar = progressBg.createDiv({ cls: 'model-download-progress-bar' });
		this.progressBar.setCssProps({ '--progress-width': '0%' });

		// Progress text
		this.progressText = contentEl.createDiv({ cls: 'model-download-progress-text' });
		this.progressText.setText('0 mb of 0 mb (0%)');

		// Info text
		contentEl.createEl('p', {
			text: 'This is a one-time download. The model will be saved to your plugin folder.',
			cls: 'model-download-info'
		});

		// Cancel button
		const buttonContainer = contentEl.createDiv({ cls: 'model-download-buttons' });
		this.cancelButton = new ButtonComponent(buttonContainer)
			.setButtonText('Cancel download')
			.onClick(() => {
				this.cancelled = true;
				if (this.onCancel) {
					this.onCancel();
				}
				this.close();
			});

	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	updateProgress(downloaded: number, total: number) {
		if (this.cancelled) return;

		const percentage = total > 0 ? (downloaded / total) * 100 : 0;
		const downloadedMB = Math.floor(downloaded / (1024 * 1024));
		const totalMB = Math.ceil(total / (1024 * 1024));

		this.progressBar.setCssProps({ '--progress-width': `${percentage}%` });
		this.progressText.setText(`${downloadedMB} MB of ${totalMB} MB (${Math.round(percentage)}%)`);

		// Update status
		if (percentage < 100) {
			const remainingMB = Math.ceil((total - downloaded) / (1024 * 1024));
			this.statusText.setText(`Downloading... ${remainingMB} MB remaining`);
		}
	}

	setStatus(status: string) {
		this.statusText.setText(status);
	}

	setError(error: string) {
		this.statusText.setText(`Error: ${error}`);
		this.statusText.addClass('model-download-status-error');
		this.cancelButton.setButtonText('Close');
	}

	setComplete() {
		this.progressBar.setCssProps({ '--progress-width': '100%' });
		this.statusText.setText('Download complete!');
		this.statusText.addClass('model-download-status-success');
		this.cancelButton.setButtonText('Close');
	}

	setCancelCallback(callback: () => void) {
		this.onCancel = callback;
	}

	isCancelled(): boolean {
		return this.cancelled;
	}
}

export class OverwriteConfirmationModal extends Modal {
	private onConfirm?: (overwrite: boolean) => void;
	private fileName: string;
	private confirmed: boolean = false;

	constructor(app: App, fileName: string) {
		super(app);
		this.fileName = fileName;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('overwrite-confirmation-modal');

		// Title
		contentEl.createEl('h2', { text: 'Transcription already exists' });

		// Message
		const messageDiv = contentEl.createDiv({ cls: 'overwrite-message' });
		messageDiv.createEl('p', {
			text: `A transcription already exists for this audio file:`
		});
		messageDiv.createEl('code', {
			text: this.fileName,
			cls: 'filename-display'
		});
		messageDiv.createEl('p', {
			text: 'Would you like to overwrite it with a new transcription?'
		});

		// Warning note
		const warningDiv = contentEl.createDiv({ cls: 'overwrite-warning' });
		warningDiv.createEl('p', {
			text: 'Note: overwriting will replace all existing content in the file.'
		});

		// Buttons
		const buttonContainer = contentEl.createDiv({ cls: 'overwrite-buttons' });

		new ButtonComponent(buttonContainer)
			.setButtonText('Overwrite')
			.setCta()
			.onClick(() => {
				this.confirmed = true;
				if (this.onConfirm) {
					this.onConfirm(true);
				}
				this.close();
			});

		new ButtonComponent(buttonContainer)
			.setButtonText('Cancel')
			.onClick(() => {
				this.confirmed = true;
				if (this.onConfirm) {
					this.onConfirm(false);
				}
				this.close();
			});

	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();

		// If modal was closed without clicking a button, treat as cancel
		if (!this.confirmed && this.onConfirm) {
			this.onConfirm(false);
		}
	}

	setConfirmCallback(callback: (overwrite: boolean) => void) {
		this.onConfirm = callback;
	}
}

export class LanguageSelectionModal extends Modal {
	private onConfirm?: (language: Language, customInstructions?: string) => void;
	private onCancel?: () => void;
	private favoriteLanguages: Language[];
	private selectedLanguage: Language;
	private customInstructionsOverride: string;
	private defaultCustomInstructions: string;
	private confirmed: boolean = false;

	constructor(app: App, favoriteLanguages: Language[], defaultLanguage: Language = 'auto', defaultCustomInstructions: string = '') {
		super(app);
		this.favoriteLanguages = favoriteLanguages;
		this.selectedLanguage = defaultLanguage;
		this.defaultCustomInstructions = defaultCustomInstructions;
		this.customInstructionsOverride = defaultCustomInstructions;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('language-selection-modal');

		// Title
		contentEl.createEl('h2', { text: 'Select transcription language' });

		// Message
		const messageDiv = contentEl.createDiv({ cls: 'language-selection-message' });
		messageDiv.createEl('p', {
			text: 'Choose the language for this transcription:'
		});

		// Language options
		const optionsContainer = contentEl.createDiv({ cls: 'language-options-container' });

		for (const lang of this.favoriteLanguages) {
			const optionDiv = optionsContainer.createDiv({ cls: 'language-option' });
			if (lang === this.selectedLanguage) {
				optionDiv.addClass('selected');
			}

			const radio = optionDiv.createEl('input', { type: 'radio' });
			radio.name = 'language';
			radio.value = lang;
			radio.checked = lang === this.selectedLanguage;

			const label = optionDiv.createEl('label');
			label.textContent = LANGUAGE_NAMES[lang];
			label.prepend(radio);

			optionDiv.addEventListener('click', () => {
				// Remove selected class from all options
				optionsContainer.querySelectorAll('.language-option').forEach(el => {
					el.removeClass('selected');
				});
				// Add selected class to clicked option
				optionDiv.addClass('selected');
				radio.checked = true;
				this.selectedLanguage = lang;
			});
		}

		// Info text
		const infoDiv = contentEl.createDiv({ cls: 'language-selection-info' });
		infoDiv.createEl('p', {
			text: 'Tip: you can configure your favorite languages in the plugin settings.'
		});
		infoDiv.createEl('p', {
			text: 'For mixed language content (for example, english and greek), select "auto-detect".'
		});

		// Custom instructions override (collapsible)
		const advancedSection = contentEl.createEl('details', { cls: 'language-selection-advanced' });
		const summary = advancedSection.createEl('summary', { cls: 'language-selection-advanced-summary' });
		summary.setText('Advanced: override analysis instructions');

		const advancedContent = advancedSection.createDiv({ cls: 'language-selection-advanced-content' });
		advancedContent.createEl('p', {
			text: 'Optionally override the default analysis instructions for this transcription only:',
			cls: 'advanced-description'
		});

		const textarea = advancedContent.createEl('textarea', {
			cls: 'custom-instructions-textarea',
			placeholder: 'Enter custom analysis instructions (leave empty to use default settings)'
		});
		textarea.value = this.customInstructionsOverride;
		textarea.addEventListener('input', () => {
			this.customInstructionsOverride = textarea.value;
		});

		// Show current default if available
		if (this.defaultCustomInstructions) {
			const defaultNote = advancedContent.createDiv({ cls: 'default-instructions-note' });
			defaultNote.createEl('p', {
				text: 'Current default instructions:',
				cls: 'default-instructions-label'
			});
			const defaultText = defaultNote.createEl('div', {
				cls: 'default-instructions-text'
			});
			defaultText.setText(this.defaultCustomInstructions);
		}

		// Buttons
		const buttonContainer = contentEl.createDiv({ cls: 'language-selection-buttons' });

		new ButtonComponent(buttonContainer)
			.setButtonText('Start transcription')
			.setCta()
			.onClick(() => {
				this.confirmed = true;
				if (this.onConfirm) {
					// Pass empty string if override is same as default
					const override = this.customInstructionsOverride !== this.defaultCustomInstructions
						? this.customInstructionsOverride
						: undefined;
					this.onConfirm(this.selectedLanguage, override);
				}
				this.close();
			});

		new ButtonComponent(buttonContainer)
			.setButtonText('Cancel')
			.onClick(() => {
				this.confirmed = true;
				if (this.onCancel) {
					this.onCancel();
				}
				this.close();
			});

	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();

		// If modal was closed without clicking a button, treat as cancel
		if (!this.confirmed && this.onCancel) {
			this.onCancel();
		}
	}

	setConfirmCallback(callback: (language: Language, customInstructions?: string) => void) {
		this.onConfirm = callback;
	}

	setCancelCallback(callback: () => void) {
		this.onCancel = callback;
	}
}

export class TranscriptionModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText('Transcription in progress...');
		// TODO: Implement progress UI
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
