// @flow

declare var interfaceConfig: Object;

/**
 * Helper for getting the height of the toolbox.
 *
 * @returns {number} The height of the toolbox.
 */
export function getToolboxHeight() {
    const toolbox = document.getElementById('new-toolbox');

    return (toolbox && toolbox.clientHeight) || 0;
}

/**
 * Indicates if a toolbar button is enabled.
 *
 * @param {string} name - The name of the setting section as defined in
 * interface_config.js.
 * @returns {boolean} - True to indicate that the given toolbar button
 * is enabled, false - otherwise.
 */
export function isButtonEnabled(name: string) {
    return interfaceConfig.TOOLBAR_BUTTONS.indexOf(name) !== -1;
}


/**
 * Indicates if the toolbox is visible or not.
 *
 * @param {string} state - The state from the Redux store.
 * @returns {boolean} - True to indicate that the toolbox is visible, false -
 * otherwise.
 */
export function isToolboxVisible(state: Object) {
    const { iAmSipGateway } = state['features/base/config'];
    const {
        alwaysVisible,
        timeoutID,
        visible
    } = state['features/toolbox'];
    const { audioSettingsVisible, videoSettingsVisible } = state['features/settings'];

    return Boolean(!iAmSipGateway && (timeoutID || visible || alwaysVisible
                                      || audioSettingsVisible || videoSettingsVisible));
}

export function showToaster(message:string) {
    var x = document.getElementById("snackbar");
    x.className = "show";
    x.innerText = message;
    setTimeout(function () { x.className = x.className.replace("show", ""); }, 2000);
}