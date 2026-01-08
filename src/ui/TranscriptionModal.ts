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
		contentEl.createEl('h2', { text: '⚠️ Automatic Download Failed' });

		// Error explanation
		const errorSection = contentEl.createDiv({ cls: 'download-error-section' });
		errorSection.createEl('h3', { text: 'What went wrong?' });
		errorSection.createEl('p', {
			text: 'Both download attempts failed. This is usually caused by:',
			cls: 'error-intro'
		});

		const causesList = errorSection.createEl('ul', { cls: 'causes-list' });
		causesList.createEl('li', { text: '🛡️ Antivirus or firewall blocking the connection to Hugging Face' });
		causesList.createEl('li', { text: '🌐 Network proxy or corporate firewall restrictions' });
		causesList.createEl('li', { text: '📶 Slow or unstable internet connection' });
		causesList.createEl('li', { text: '🔒 Windows Defender blocking downloads' });

		// Manual instructions
		const instructionsSection = contentEl.createDiv({ cls: 'download-instructions-section' });
		instructionsSection.createEl('h3', { text: '📥 Manual Download Instructions' });

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
		const copyUrlBtn = step1.createEl('button', { text: '📋 Copy URL', cls: 'copy-button' });
		copyUrlBtn.onclick = () => {
			navigator.clipboard.writeText(this.modelUrl);
			new Notice('URL copied to clipboard!');
		};

		// Step 2
		const step2 = steps.createEl('li');
		step2.createEl('strong', { text: 'Save the file as:' });
		step2.createEl('br');
		const fileName = step2.createEl('code', { text: `ggml-${this.modelSize}.bin`, cls: 'filename' });
		const copyFileBtn = step2.createEl('button', { text: '📋 Copy', cls: 'copy-button' });
		copyFileBtn.onclick = () => {
			navigator.clipboard.writeText(`ggml-${this.modelSize}.bin`);
			new Notice('Filename copied to clipboard!');
		};

		// Step 3
		const step3 = steps.createEl('li');
		step3.createEl('strong', { text: 'Copy the file to this folder:' });
		step3.createEl('br');
		const pathCode = step3.createEl('code', { text: this.modelsDir, cls: 'filepath' });
		const copyPathBtn = step3.createEl('button', { text: '📋 Copy Path', cls: 'copy-button' });
		copyPathBtn.onclick = () => {
			navigator.clipboard.writeText(this.modelsDir);
			new Notice('Path copied to clipboard!');
		};
		step3.createEl('br');
		const openFolderBtn = step3.createEl('button', { text: '📁 Open Folder', cls: 'open-folder-button' });
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
		troubleshootSection.createEl('h3', { text: '🔧 If download still fails in browser:' });
		const troubleshootList = troubleshootSection.createEl('ul');
		troubleshootList.createEl('li', { text: 'Temporarily disable your antivirus/firewall' });
		troubleshootList.createEl('li', { text: 'Try downloading from a different network (mobile hotspot)' });
		troubleshootList.createEl('li', { text: 'Use a VPN if Hugging Face is blocked in your region' });

		// Close button
		const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
		new ButtonComponent(buttonContainer)
			.setButtonText('Close')
			.setCta()
			.onClick(() => this.close());

		// Add styles
		this.addStyles();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	private addStyles() {
		const style = document.createElement('style');
		style.textContent = `
			.manual-download-modal {
				max-width: 700px;
			}

			.download-error-section,
			.download-instructions-section,
			.troubleshooting-section {
				margin: 1.5em 0;
				padding: 1em;
				background-color: var(--background-secondary);
				border-radius: 8px;
			}

			.download-error-section {
				border-left: 4px solid var(--text-error);
			}

			.download-instructions-section {
				border-left: 4px solid var(--interactive-accent);
			}

			.error-intro {
				margin-bottom: 0.5em;
				font-weight: 500;
			}

			.causes-list,
			.instruction-steps {
				margin-left: 1.5em;
				line-height: 1.8;
			}

			.causes-list li {
				margin: 0.5em 0;
			}

			.instruction-steps li {
				margin: 1.5em 0;
			}

			.download-link {
				color: var(--interactive-accent);
				word-break: break-all;
				text-decoration: underline;
			}

			.filename,
			.filepath {
				display: inline-block;
				background-color: var(--background-primary);
				padding: 0.4em 0.6em;
				border-radius: 4px;
				font-family: monospace;
				font-size: 0.9em;
				margin: 0.5em 0;
			}

			.filepath {
				display: block;
				word-break: break-all;
				margin: 0.5em 0;
			}

			.copy-button,
			.open-folder-button {
				margin-left: 0.5em;
				padding: 0.3em 0.8em;
				font-size: 0.85em;
				cursor: pointer;
				border: 1px solid var(--background-modifier-border);
				background-color: var(--background-secondary);
				color: var(--text-normal);
				border-radius: 4px;
			}

			.copy-button:hover,
			.open-folder-button:hover {
				background-color: var(--background-modifier-hover);
			}

			.open-folder-button {
				display: block;
				margin-top: 0.5em;
				margin-left: 0;
			}

			.modal-button-container {
				display: flex;
				justify-content: center;
				margin-top: 2em;
			}

			.troubleshooting-section {
				border-left: 4px solid var(--text-warning);
			}

			.troubleshooting-section ul {
				margin-left: 1.5em;
			}

			.troubleshooting-section li {
				margin: 0.5em 0;
			}
		`;
		this.contentEl.appendChild(style);
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

		contentEl.createEl('h2', { text: `Downloading ${this.modelName} Model` });

		// Status text
		this.statusText = contentEl.createDiv({ cls: 'model-download-status' });
		this.statusText.setText('Initializing download...');

		// Progress container
		const progressContainer = contentEl.createDiv({ cls: 'model-download-progress-container' });

		// Progress bar background
		const progressBg = progressContainer.createDiv({ cls: 'model-download-progress-bg' });

		// Progress bar fill
		this.progressBar = progressBg.createDiv({ cls: 'model-download-progress-bar' });
		this.progressBar.style.width = '0%';

		// Progress text
		this.progressText = contentEl.createDiv({ cls: 'model-download-progress-text' });
		this.progressText.setText('0 MB / 0 MB (0%)');

		// Info text
		contentEl.createEl('p', {
			text: 'This is a one-time download. The model will be saved to your plugin folder.',
			cls: 'model-download-info'
		});

		// Cancel button
		const buttonContainer = contentEl.createDiv({ cls: 'model-download-buttons' });
		this.cancelButton = new ButtonComponent(buttonContainer)
			.setButtonText('Cancel Download')
			.onClick(() => {
				this.cancelled = true;
				if (this.onCancel) {
					this.onCancel();
				}
				this.close();
			});

		// Add CSS styles
		this.addStyles();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	updateProgress(downloaded: number, total: number) {
		if (this.cancelled) return;

		const percentage = total > 0 ? (downloaded / total) * 100 : 0;
		const downloadedMB = Math.round(downloaded / (1024 * 1024));
		const totalMB = Math.round(total / (1024 * 1024));

		this.progressBar.style.width = `${percentage}%`;
		this.progressText.setText(`${downloadedMB} MB / ${totalMB} MB (${Math.round(percentage)}%)`);

		// Update status
		if (percentage < 100) {
			const remainingMB = Math.round((total - downloaded) / (1024 * 1024));
			this.statusText.setText(`Downloading... ${remainingMB} MB remaining`);
		}
	}

	setStatus(status: string) {
		this.statusText.setText(status);
	}

	setError(error: string) {
		this.statusText.setText(`Error: ${error}`);
		this.statusText.style.color = 'var(--text-error)';
		this.cancelButton.setButtonText('Close');
	}

	setComplete() {
		this.progressBar.style.width = '100%';
		this.statusText.setText('✓ Download complete!');
		this.statusText.style.color = 'var(--text-success)';
		this.cancelButton.setButtonText('Close');
	}

	setCancelCallback(callback: () => void) {
		this.onCancel = callback;
	}

	isCancelled(): boolean {
		return this.cancelled;
	}

	private addStyles() {
		// Add inline styles for the modal
		const style = document.createElement('style');
		style.textContent = `
			.model-download-status {
				margin: 1em 0;
				font-weight: 500;
				text-align: center;
			}

			.model-download-progress-container {
				margin: 1.5em 0;
			}

			.model-download-progress-bg {
				background-color: var(--background-modifier-border);
				border-radius: 4px;
				height: 24px;
				overflow: hidden;
			}

			.model-download-progress-bar {
				background-color: var(--interactive-accent);
				height: 100%;
				transition: width 0.3s ease;
				border-radius: 4px;
			}

			.model-download-progress-text {
				margin-top: 0.5em;
				text-align: center;
				font-family: monospace;
				font-size: 0.9em;
			}

			.model-download-info {
				color: var(--text-muted);
				font-size: 0.9em;
				text-align: center;
				margin: 1em 0;
			}

			.model-download-buttons {
				display: flex;
				justify-content: center;
				margin-top: 1.5em;
			}
		`;
		this.contentEl.appendChild(style);
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
		contentEl.createEl('h2', { text: 'Transcription Already Exists' });

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
			text: '⚠️ Note: Overwriting will replace all existing content in the file.'
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

		// Add styles
		this.addStyles();
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

	private addStyles() {
		const style = document.createElement('style');
		style.textContent = `
			.overwrite-confirmation-modal {
				max-width: 500px;
			}

			.overwrite-message {
				margin: 1.5em 0;
				line-height: 1.6;
			}

			.overwrite-message p {
				margin: 0.8em 0;
			}

			.filename-display {
				display: block;
				background-color: var(--background-secondary);
				padding: 0.5em 0.8em;
				border-radius: 4px;
				font-family: monospace;
				font-size: 0.9em;
				margin: 1em 0;
				word-break: break-all;
			}

			.overwrite-warning {
				background-color: var(--background-secondary);
				border-left: 4px solid var(--text-warning);
				padding: 1em;
				border-radius: 4px;
				margin: 1em 0;
			}

			.overwrite-warning p {
				margin: 0;
				color: var(--text-warning);
				font-size: 0.9em;
			}

			.overwrite-buttons {
				display: flex;
				justify-content: center;
				gap: 1em;
				margin-top: 2em;
			}
		`;
		this.contentEl.appendChild(style);
	}
}

export class LanguageSelectionModal extends Modal {
	private onConfirm?: (language: Language) => void;
	private onCancel?: () => void;
	private favoriteLanguages: Language[];
	private selectedLanguage: Language;
	private confirmed: boolean = false;

	constructor(app: App, favoriteLanguages: Language[], defaultLanguage: Language = 'auto') {
		super(app);
		this.favoriteLanguages = favoriteLanguages;
		this.selectedLanguage = defaultLanguage;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('language-selection-modal');

		// Title
		contentEl.createEl('h2', { text: 'Select Transcription Language' });

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
			text: '💡 Tip: You can configure your favorite languages in the plugin settings.'
		});
		infoDiv.createEl('p', {
			text: '🌐 For mixed language content (e.g., English & Greek), select "Auto-detect".'
		});

		// Buttons
		const buttonContainer = contentEl.createDiv({ cls: 'language-selection-buttons' });

		new ButtonComponent(buttonContainer)
			.setButtonText('Start Transcription')
			.setCta()
			.onClick(() => {
				this.confirmed = true;
				if (this.onConfirm) {
					this.onConfirm(this.selectedLanguage);
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

		// Add styles
		this.addStyles();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();

		// If modal was closed without clicking a button, treat as cancel
		if (!this.confirmed && this.onCancel) {
			this.onCancel();
		}
	}

	setConfirmCallback(callback: (language: Language) => void) {
		this.onConfirm = callback;
	}

	setCancelCallback(callback: () => void) {
		this.onCancel = callback;
	}

	private addStyles() {
		const style = document.createElement('style');
		style.textContent = `
			.language-selection-modal {
				max-width: 500px;
			}

			.language-selection-message {
				margin: 1em 0 1.5em 0;
			}

			.language-selection-message p {
				margin: 0;
				font-size: 14px;
			}

			.language-options-container {
				max-height: 400px;
				overflow-y: auto;
				margin-bottom: 1em;
				padding: 8px;
				background-color: var(--background-secondary);
				border-radius: 4px;
			}

			.language-option {
				padding: 12px;
				margin: 4px 0;
				background-color: var(--background-primary);
				border: 2px solid transparent;
				border-radius: 4px;
				cursor: pointer;
				transition: all 0.2s ease;
			}

			.language-option:hover {
				background-color: var(--background-modifier-hover);
				border-color: var(--interactive-accent-hover);
			}

			.language-option.selected {
				background-color: var(--interactive-accent);
				border-color: var(--interactive-accent);
				color: var(--text-on-accent);
			}

			.language-option label {
				display: flex;
				align-items: center;
				gap: 10px;
				cursor: pointer;
				font-size: 14px;
				width: 100%;
			}

			.language-option input[type="radio"] {
				cursor: pointer;
				width: 18px;
				height: 18px;
			}

			.language-option.selected label {
				color: var(--text-on-accent);
				font-weight: 500;
			}

			.language-selection-info {
				background-color: var(--background-secondary);
				padding: 12px;
				border-radius: 4px;
				margin: 1em 0;
			}

			.language-selection-info p {
				margin: 0;
				font-size: 13px;
				color: var(--text-muted);
			}

			.language-selection-buttons {
				display: flex;
				justify-content: center;
				gap: 1em;
				margin-top: 1.5em;
			}
		`;
		this.contentEl.appendChild(style);
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
