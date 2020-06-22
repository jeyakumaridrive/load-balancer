// @flow

/**
 * Appends a suffix to the display name.
 *
 * @param {string} displayName - The display name.
 * @param {string} suffix - Suffix that will be appended.
 * @returns {string} The formatted display name.
 */
export function appendSuffix(displayName: string, suffix: string = '') {
	if(displayName != '' && displayName.match(/^[0-9]+$/) != null && displayName.match(/^[0-9]+$/).length > 0) {
		displayName = displayName.toString().replace(/^(.{5})(.*)(.{1})$/, "$1*****$3");
	}
    return `${displayName || suffix}${
        displayName && suffix && displayName !== suffix ? ` (${suffix})` : ''}`;
}
