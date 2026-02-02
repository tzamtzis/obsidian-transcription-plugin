import { App, Modal } from 'obsidian';

export class TranscriptionProgressModal extends Modal {
	private progressBar: HTMLDivElement;
	private progressFill: HTMLDivElement;
	private statusText: HTMLDivElement;
	private percentText: HTMLDivElement;
	private cancelButton: HTMLButtonElement;
	private currentProgress: number = 0;
	private currentStep: string = '';
	private onCancelCallback?: () => void;
	private cancelled: boolean = false;

	constructor(app: App, onCancel?: () => void) {
		super(app);
		this.onCancelCallback = onCancel;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('transcription-progress-modal');

		// Title
		contentEl.createEl('h2', { text: 'Transcribing audio' });

		// Status text
		this.statusText = contentEl.createDiv({ cls: 'progress-status' });
		this.statusText.setText('Initializing...');

		// Progress bar container
		const progressContainer = contentEl.createDiv({ cls: 'progress-container' });
		this.progressBar = progressContainer.createDiv({ cls: 'progress-bar' });
		this.progressFill = this.progressBar.createDiv({ cls: 'progress-fill' });

		// Percentage text
		this.percentText = contentEl.createDiv({ cls: 'progress-percent' });
		this.percentText.setText('0%');

		// Cancel button
		const buttonContainer = contentEl.createDiv({ cls: 'button-container' });
		this.cancelButton = buttonContainer.createEl('button', {
			text: 'Cancel',
			cls: 'mod-warning'
		});
		this.cancelButton.addEventListener('click', () => {
			this.handleCancel();
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	updateProgress(step: string, progress: number, message?: string) {
		if (this.cancelled) return;

		this.currentStep = step;
		this.currentProgress = Math.min(100, Math.max(0, progress));

		// Update status text
		const statusMessage = message || this.getStepMessage(step);
		this.statusText.setText(statusMessage);

		// Update progress bar using CSS custom property
		this.progressFill.style.setProperty('--progress-width', `${this.currentProgress}%`);

		// Update percentage
		this.percentText.setText(`${Math.round(this.currentProgress)}%`);

		// Change color based on step
		this.updateProgressColor(step);
	}

	private getStepMessage(step: string): string {
		const messages: Record<string, string> = {
			'validation': '🔍 Validating configuration...',
			'transcription': '🎙️ Transcribing audio...',
			'analysis': '🤖 Analyzing content...',
			'saving': '💾 Creating markdown file...',
			'complete': '✅ Transcription complete!'
		};
		return messages[step] || `Processing: ${step}`;
	}

	private updateProgressColor(step: string) {
		// Remove all color classes
		this.progressFill.removeClass('progress-validation', 'progress-transcription', 'progress-analysis', 'progress-saving', 'progress-complete');

		// Add appropriate color class
		const colorMap: Record<string, string> = {
			'validation': 'progress-validation',
			'transcription': 'progress-transcription',
			'analysis': 'progress-analysis',
			'saving': 'progress-saving',
			'complete': 'progress-complete'
		};

		const colorClass = colorMap[step];
		if (colorClass) {
			this.progressFill.addClass(colorClass);
		}
	}

	private handleCancel() {
		if (this.cancelled) return;

		this.cancelled = true;
		this.statusText.setText('⚠️ Cancelling transcription...');
		this.cancelButton.disabled = true;
		this.cancelButton.setText('Cancelling...');

		if (this.onCancelCallback) {
			this.onCancelCallback();
		}
	}

	markComplete() {
		this.updateProgress('complete', 100, '✅ Transcription complete!');
		this.cancelButton.addClass('audio-transcription-hidden');

		// Auto-close after 2 seconds
		setTimeout(() => {
			this.close();
		}, 2000);
	}

	markError(errorMessage: string) {
		this.statusText.setText(`❌ ${errorMessage}`);
		this.progressFill.addClass('progress-error');
		this.cancelButton.setText('Close');
		this.cancelButton.removeClass('mod-warning');
		this.cancelButton.addEventListener('click', () => {
			this.close();
		});
	}

	isCancelled(): boolean {
		return this.cancelled;
	}
}
