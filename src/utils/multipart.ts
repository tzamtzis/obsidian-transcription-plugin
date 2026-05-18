// Multipart/form-data helpers.

/**
 * Sanitize a file name before placing it in a multipart
 * `Content-Disposition` header.
 *
 * The name is user-controlled (derived from a vault file name). A literal
 * double quote or a CR/LF would let it break out of the header line and
 * inject additional multipart parts. Conservatively replace any of those
 * characters with `_`, and fall back to a safe default if nothing usable
 * remains.
 */
export function sanitizeMultipartFilename(fileName: string): string {
	const sanitized = fileName.replace(/[\r\n"]/g, '_').trim();
	return sanitized.length > 0 ? sanitized : 'audio.m4a';
}
