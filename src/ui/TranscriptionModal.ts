import { Modal, App, ButtonComponent } from 'obsidian';

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
