// Audio utility functions
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

export async function getAudioDuration(audioPath: string): Promise<number> {
	try {
		// Use ffprobe to get audio duration
		const { stdout } = await execAsync(
			`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`
		);
		const duration = parseFloat(stdout.trim());
		return isNaN(duration) ? 0 : duration;
	} catch (error) {
		console.error('Failed to get audio duration:', error);
		return 0;
	}
}

export function estimateTranscriptionTime(
	audioDurationSeconds: number,
	modelSize: 'tiny' | 'base' | 'small' | 'medium' | 'large',
	isLocal: boolean
): number {
	if (!isLocal) {
		// Cloud processing is typically very fast
		// Estimate ~0.1x realtime (10 min audio = 1 min processing)
		return audioDurationSeconds * 0.1;
	}

	// Local processing estimates based on model size (realtime multipliers)
	const realtimeMultipliers = {
		tiny: 0.15,    // Very fast: ~0.15x realtime
		base: 0.2,     // Fast: ~0.2x realtime
		small: 0.35,   // Moderate: ~0.35x realtime
		medium: 0.5,   // Slower: ~0.5x realtime
		large: 0.8     // Slow: ~0.8x realtime
	};

	const multiplier = realtimeMultipliers[modelSize] || 0.5;
	return audioDurationSeconds * multiplier;
}

export function formatEstimatedTime(seconds: number): string {
	if (seconds < 60) {
		return `~${Math.ceil(seconds)} seconds`;
	}

	const minutes = Math.ceil(seconds / 60);
	if (minutes < 60) {
		return `~${minutes} minute${minutes > 1 ? 's' : ''}`;
	}

	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;

	if (remainingMinutes === 0) {
		return `~${hours} hour${hours > 1 ? 's' : ''}`;
	}

	return `~${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
}

// TODO: Add audio chunking utilities for long files
