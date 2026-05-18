// Error normalization utilities.
//
// `catch` clauses and many Node/Electron callbacks surface values typed as
// `unknown`/`any`. These helpers narrow them safely so the rest of the codebase
// never has to touch `.message`/`.code` on an untyped value.

interface NodeErrorLike {
	code?: string;
	errno?: number;
	syscall?: string;
}

/** Best-effort human-readable message for any thrown value. */
export function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	if (typeof error === 'string') {
		return error;
	}
	if (error && typeof error === 'object' && 'message' in error) {
		const message: unknown = error.message;
		if (typeof message === 'string') {
			return message;
		}
	}
	return String(error);
}

/** Normalize any thrown value into an `Error` instance. */
export function toError(error: unknown): Error {
	return error instanceof Error ? error : new Error(getErrorMessage(error));
}

/** Extract a Node.js error code (e.g. `ENOSPC`, `EACCES`) if present. */
export function getNodeErrorCode(error: unknown): string | undefined {
	if (error && typeof error === 'object' && 'code' in error) {
		const code = (error as NodeErrorLike).code;
		return typeof code === 'string' ? code : undefined;
	}
	return undefined;
}
