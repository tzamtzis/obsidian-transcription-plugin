import { Modal, App } from 'obsidian';

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
