// @flow

import React from 'react';

import { createVideoVirtualBackgroundEvent, createVideoBlurEvent, createToolbarEvent, sendAnalytics } from '../../analytics';
import { translate } from '../../base/i18n';
import { IconVirtualBackground } from '../../base/icons';
import { connect } from '../../base/redux';
import { AbstractButton, BetaTag } from '../../base/toolbox/components';
import type { AbstractButtonProps } from '../../base/toolbox/components';
import { toggleVirtualBackgroundEffect } from '../actions';

import VideoBlurButton from '../../blur'; 
import { toggleBlurEffect } from '../../blur/actions';

import { openVirtualBackgroundDialog } from '../actions';
import { VIRTUAL_BACKGROUND_TABS } from '../constants';

//import { openSettingsDialog } from '../../settings/actions';
//import { SETTINGS_TABS } from '../../settings/constants';

/**
 * The type of the React {@code Component} props of {@link VideoVirtualBackgroundButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * True if the video background is virtual or false if it is not.
     */
    _isVideoVirtualBackground: boolean,
    
    /**
     * True if the video background is blurred or false if it is not.
     */
    _isVideoBlurred: boolean,
    
    /**
     * Whether we are in filmstrip only mode or not.
     */
    _filmstripOnly: boolean,
    
    /**
     * The default tab at which the settings dialog will be opened.
     */
    defaultTab: string,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function

};

/**
 * An abstract implementation of a button that toggles the video virtual background effect.
 */
class VideoVirtualBackgroundButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.videovirtualbackground';
    icon = IconVirtualBackground;
    label = 'toolbar.startvideovirtualbackground';
    tooltip = 'toolbar.startvideovirtualbackground';
    toggledLabel = 'toolbar.stopvideovirtualbackground';

    /**
     * Helper function to be implemented by subclasses, which returns
     * a React Element to display (a beta tag) at the end of the button.
     *
     * @override
     * @protected
     * @returns {ReactElement}
     */
    _getElementAfter() {
        return <BetaTag />;
    }

    /**
     * Handles clicking / pressing the button, and toggles the virtual background effect
     * state accordingly.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const {
            _isVideoVirtualBackground,
            defaultTab = VIRTUAL_BACKGROUND_TABS.VIRTUAL_BACKGROUND,
            dispatch } = this.props;
        
        
 
        if(_isVideoVirtualBackground) {
            const value = !_isVideoVirtualBackground;
            
            sendAnalytics(createVideoVirtualBackgroundEvent(value ? 'started' : 'stopped'));
            dispatch(toggleVirtualBackgroundEffect(value));
        }
        else {
            sendAnalytics(createToolbarEvent('virtualbackground'));
            //sendAnalytics(createToolbarEvent('settings'));
            //sendAnalytics(createVideoVirtualBackgroundEvent(value ? 'started' : 'stopped'));

            dispatch(openVirtualBackgroundDialog(defaultTab));
            //dispatch(openVirtualBackgroundSelectionPopup());
        }
 
        
        
        /*
        const { _isVideoVirtualBackground, dispatch } = this.props;
        const value = !_isVideoVirtualBackground;
        
        // stop blur effect
        if(APP.store.getState()['features/blur'].blurEnabled 
            && APP.store.getState()['features/blur'].blurEnabled == true) {
            var { _isVideoBlurred } = this.props;
            
            //alert(APP.store.getState()['features/blur'].blurEnabled);
            //APP.store.getState()['features/blur'].blurEnabled = false;
        
            _isVideoBlurred = APP.store.getState()['features/blur'].blurEnabled;
            // stop effect            
            var value_blur = !_isVideoBlurred; 
            //alert('value '+value);

            sendAnalytics(createVideoBlurEvent(value_blur ? 'started' : 'stopped'));
            dispatch(toggleBlurEffect(value_blur));
        }

        sendAnalytics(createVideoVirtualBackgroundEvent(value ? 'started' : 'stopped'));
        dispatch(toggleVirtualBackgroundEffect(value));
        */
    }

    /**
     * Returns {@code boolean} value indicating if the virtual background effect is
     * enabled or not.
     *
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._isVideoVirtualBackground;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code VideoVirtualBackgroundButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _isVideoVirtualBackground: boolean
 * }}
 */
function _mapStateToProps(state): Object {
    return {
        _isVideoVirtualBackground: Boolean(state['features/virtual-background'].virtualBackgroundEnabled)
    };
}

export default translate(connect(_mapStateToProps)(VideoVirtualBackgroundButton));
