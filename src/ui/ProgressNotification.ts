import { Notice } from 'obsidian';

export class ProgressNotification {
	private notice: Notice;

	constructor() {
		this.notice = new Notice('Processing...', 0);
	}

	updateProgress(message: string, progress: number) {
		const rounded = Math.round(progress);
		this.notice.setMessage(`${message} (${rounded}%)`);
	}

	hide() {
		this.notice.hide();
	}
}
