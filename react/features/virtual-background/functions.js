// @flow
import { toState } from '../base/redux'
import { getJitsiMeetGlobalNS, loadScript } from '../base/util';

declare var interfaceConfig: Object

/** 
 * Returns promise that resolves with the virtual background effect instance.
 *
 * @returns {Promise<JitsiStreamVirtualBackgroundEffect>} - Resolves with the virtual background effect instance.
 */
export function getVirtualBackgroundEffect() {
    const ns = getJitsiMeetGlobalNS();

    if (ns.effects && ns.effects.createVirtualBackgroundEffect) {
        return ns.effects.createVirtualBackgroundEffect();
    }
    
    //return loadScript('libs/video-blur-effect.min.js').then(() => ns.effects.createVirtualBackgroundEffect());
    return loadScript('libs/video-virtual-background-effect.min.js').then(() => ns.effects.createVirtualBackgroundEffect());
}


/**
 * Returns the properties for the "Profile" tab from settings dialog from Redux
 * state.
 *
 * @param {(Function|Object)} stateful -The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state.
 * @returns {Object} - The properties for the "Profile" tab from settings
 * dialog.
 */
export function getVirtulBackgroundTabProps(stateful: Object | Function) {
    const state = toState(stateful);
    return {
        virtualBackground: window.$default_virtual_background
    };
}