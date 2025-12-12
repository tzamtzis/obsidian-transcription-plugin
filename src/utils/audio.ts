// Audio utility functions

export function isAudioFile(filename: string): boolean {
	const audioExtensions = ['m4a', 'mp3', 'wav', 'ogg', 'flac'];
	const ext = filename.split('.').pop()?.toLowerCase();
	return ext ? audioExtensions.includes(ext) : false;
}

export function formatDuration(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);

	if (hours > 0) {
		const minPadded = minutes.toString().padStart(2, '0');
		const secPadded = secs.toString().padStart(2, '0');
		return `${hours}:${minPadded}:${secPadded}`;
	}
	const secPadded = secs.toString().padStart(2, '0');
	return `${minutes}:${secPadded}`;
}

// TODO: Add audio chunking utilities for long files
