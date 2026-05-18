// Multipart/form-data helpers.

/**
 * Sanitize a file name before placing it in a multipart
 * `Content-Disposition` header.
 *
 * The name is user-controlled (derived from a vault file name). Inside the
 * quoted `filename="..."` value, several characters allow header injection:
 *   - `"` closes the quoted string early;
 *   - `\` is a quoted-pair escape — a trailing `\` escapes the closing quote
 *     we append, so the value runs unterminated into the next header/part;
 *   - CR/LF (and other control chars) can start a new header line or part.
 * Conservatively replace all of those — `\`, `"`, C0 controls (0x00-0x1F,
 * which includes CR/LF/TAB) and DEL (0x7F) — with `_`, and fall back to a
 * safe default if nothing usable remains.
 */
export function sanitizeMultipartFilename(fileName: string): string {
	// eslint-disable-next-line no-control-regex -- intentional: strip control chars
	const sanitized = fileName.replace(/[\\"\x00-\x1F\x7F]/g, '_').trim();
	return sanitized.length > 0 ? sanitized : 'audio.m4a';
}
