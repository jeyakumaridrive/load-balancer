// @flow

import { getLocalVideoTrack } from '../../features/base/tracks';

import { VIRTUAL_BACKGROUND_DISABLED, VIRTUAL_BACKGROUND_ENABLED } from './actionTypes';
import { getVirtualBackgroundEffect } from './functions';
import logger from './logger';

import { setFollowMe, setStartMutedPolicy } from '../base/conference';
import { openDialog } from '../base/dialog';
import { i18next } from '../base/i18n';
import { VirtualBackgroundDialog } from './components';
import { getVirtulBackgroundTabProps } from './functions';

declare var APP: Object;

/**
 * Opens {@code VirtualBackgroundDialog}.
 *
 * @param {string} defaultTab - The tab in {@code VirtualBackgroundDialog} that should be
 * displayed initially.
 * @returns {Function}
 */
export function openVirtualBackgroundDialog(defaultTab: string) {
    return openDialog(VirtualBackgroundDialog, { defaultTab });
}


/**
 * Submits the virtual background settings from the dialog.
 *
 * @param {Object} newState - The new settings.
 * @returns {Function}
 */
export function submitVirtualBackgroundTab(newState: Object): Function {
    return (dispatch, getState) => {
        const currentState = getVirtulBackgroundTabProps(getState());
        
        alert('submit vb tab');
        if (newState.displayName !== currentState.displayName) {
            APP.conference.changeLocalDisplayName(newState.displayName);
        }

        if (newState.email !== currentState.email) {
            APP.conference.changeLocalEmail(newState.email);
        }
    };
}


/**
* Signals the local participant is switching between virtual background video.
*
* @param {boolean} enabled - If true enables video virtual background, false otherwise.
* @returns {Promise}
*/
export function toggleVirtualBackgroundEffect(enabled: boolean) {
    return function(dispatch: (Object) => Object, getState: () => any) {
        const state = getState();

        if (state['features/virtual-background'].virtualBackgroundEnabled !== enabled) {
            const { jitsiTrack } = getLocalVideoTrack(state['features/base/tracks']);

            return getVirtualBackgroundEffect()
                .then(virtualBackgroundEffectInstance =>
                    jitsiTrack.setEffect(enabled ? virtualBackgroundEffectInstance : undefined)
                        .then(() => {
                            enabled ? dispatch(virtualBackgroundEnabled()) : dispatch(virtualBackgroundDisabled());
                            /*alert('if');
                            alert(state['features/virtual-background'].virtualBackgroundEnabled);
                            alert(enabled); */
                        })
                        .catch(error => {
                            enabled ? dispatch(virtualBackgroundDisabled()) : dispatch(virtualBackgroundEnabled());
                            logger.error('setEffect failed with error:', error);
                        })
                )
                .catch(error => {
                    dispatch(virtualBackgroundDisabled());
                    logger.error('getVirtualBackgroundEffect failed with error:', error);
                });
        }
        else {
            /*alert('else');
            alert(state['features/virtual-background'].virtualBackgroundEnabled);
            alert(enabled);*/
        }

        return Promise.resolve();
    };
}

/**
 * Signals the local participant that the virtual background has been enabled.
 *
 * @returns {{
 *      type: VIRTUAL_BACKGROUND_ENABLED
 * }}
 */
export function virtualBackgroundEnabled() {
    return {
        type: VIRTUAL_BACKGROUND_ENABLED
    };
}

/**
 * Signals the local participant that the virtual background has been disabled.
 *
 * @returns {{
 *      type: VIRTUAL_BACKGROUND_DISABLED
 * }}
 */
export function virtualBackgroundDisabled() {
    return {
        type: VIRTUAL_BACKGROUND_DISABLED
    };
}
