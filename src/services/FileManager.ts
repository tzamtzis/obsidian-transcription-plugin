import { TFile, Vault } from 'obsidian';
import AudioTranscriptionPlugin from '../main';

export class FileManager {
	private plugin: AudioTranscriptionPlugin;

	constructor(plugin: AudioTranscriptionPlugin) {
		this.plugin = plugin;
	}

	findAudioFiles(vault: Vault): TFile[] {
		const audioExtensions = ['m4a', 'mp3', 'wav', 'ogg', 'flac'];
		return vault.getFiles().filter(file =>
			audioExtensions.includes(file.extension.toLowerCase())
		);
	}

	async readAudioFile(file: TFile): Promise<ArrayBuffer> {
		return await this.plugin.app.vault.readBinary(file);
	}
}
