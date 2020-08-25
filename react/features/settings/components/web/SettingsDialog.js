// @flow

import React, { Component } from 'react';

import { getAvailableDevices } from '../../../base/devices';
import { DialogWithTabs, hideDialog } from '../../../base/dialog';
import { connect } from '../../../base/redux';
import { isCalendarEnabled } from '../../../calendar-sync';
import {
    DeviceSelection,
    getDeviceSelectionDialogProps,
    submitDeviceSelectionTab
} from '../../../device-selection';
import VideoQualitySlider from '../../../video-quality/components/VideoQualitySlider.web.js';

VideoQualitySlider

import CalendarTab from './CalendarTab';
import MoreTab from './MoreTab';
import ProfileTab from './ProfileTab';
import VirtualBackgroundTab from './VirtualBackgroundTab';
import { getMoreTabProps, getProfileTabProps, getVirtulBackgroundTabProps } from '../../functions';
import { submitMoreTab, submitProfileTab } from '../../actions';
import { SETTINGS_TABS } from '../../constants'; 

import VideoVirtualBackgroundButton from '../../../virtual-background'; 
import { toggleVirtualBackgroundEffect } from '../../../virtual-background/actions';
import { createVideoVirtualBackgroundEvent, sendAnalytics } from '../../../analytics';

declare var APP: Object;
declare var interfaceConfig: Object;

/**
 * The type of the React {@code Component} props of
 * {@link ConnectedSettingsDialog}.
 */
type Props = {

    /**
     * Which settings tab should be initially displayed. If not defined then
     * the first tab will be displayed.
     */
    defaultTab: string,

    /**
     * Information about the tabs to be rendered.
     */
    _tabs: Array<Object>,
    
    /**
     * True if the video background is virtual or false if it is not.
     */
    _isVideoVirtualBackground: boolean,

    /**
     * Invoked to save changed settings.
     */
    dispatch: Function
};

/**
 * A React {@code Component} for displaying a dialog to modify local settings
 * and conference-wide (moderator) settings. This version is connected to
 * redux to get the current settings.
 *
 * @extends Component
 */
class SettingsDialog extends Component<Props> {
    /**
     * Initializes a new {@code ConnectedSettingsDialog} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code ConnectedSettingsDialog} instance with.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._closeDialog = this._closeDialog.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _tabs, defaultTab, dispatch } = this.props;
        const onSubmit = this._closeDialog;
        const defaultTabIdx
            = _tabs.findIndex(({ name }) => name === defaultTab);
        const tabs = _tabs.map(tab => {
            return {
                ...tab,
                onMount: tab.onMount
                    ? (...args) => dispatch(tab.onMount(...args))
                    : undefined,
                submit: (...args) => tab.submit
                    && dispatch(tab.submit(...args))
            };
        });
        
        return (
            <DialogWithTabs
                closeDialog = { this._closeDialog }
                cssClassName = 'settings-dialog'
                defaultTab = {
                    defaultTabIdx === -1 ? undefined : defaultTabIdx
                }
                onSubmit = { onSubmit }
                tabs = { tabs }
                >   
                <div className='video-quality-section'>
                    <div className="video-quality-selector-label">Video Quality</div>
                    <VideoQualitySlider />
                </div>                
            </DialogWithTabs>
        );
    }

    _closeDialog: () => void;

    /**
     * Callback invoked to close the dialog without saving changes.
     *
     * @private
     * @returns {void}
     */
    _closeDialog() {
        this.props.dispatch(hideDialog());
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code ConnectedSettingsDialog} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     tabs: Array<Object>
 * }}
 */
function _mapStateToProps(state) {
    const configuredTabs = interfaceConfig.SETTINGS_SECTIONS || [];
    const jwt = state['features/base/jwt'];

    // The settings sections to display.
    const showVirtualBackgroundSettings = configuredTabs.includes('virtual_background');
    const showDeviceSettings = configuredTabs.includes('devices');
    const moreTabProps = getMoreTabProps(state);
    const { showModeratorSettings, showLanguageSettings } = moreTabProps;
    const showProfileSettings
        = configuredTabs.includes('profile') && jwt.isGuest;
    const showCalendarSettings
        = configuredTabs.includes('calendar') && isCalendarEnabled(state);
    const tabs = [];
    
    if (showDeviceSettings) {
        tabs.push({
            name: SETTINGS_TABS.DEVICES,
            component: DeviceSelection,
            label: 'settings.devices',
            onMount: getAvailableDevices,
            props: getDeviceSelectionDialogProps(state),
            propsUpdateFunction: (tabState, newProps) => {
                // Ensure the device selection tab gets updated when new devices
                // are found by taking the new props and only preserving the
                // current user selected devices. If this were not done, the
                // tab would keep using a copy of the initial props it received,
                // leaving the device list to become stale.

                return {
                    ...newProps,
                    selectedAudioInputId: tabState.selectedAudioInputId,
                    selectedAudioOutputId: tabState.selectedAudioOutputId,
                    selectedVideoInputId: tabState.selectedVideoInputId
                };
            },
            styles: 'settings-pane devices-pane',
            submit: submitDeviceSelectionTab
        });
    }

    if (showProfileSettings) {
        tabs.push({
            name: SETTINGS_TABS.PROFILE,
            component: ProfileTab,
            label: 'profile.title',
            props: getProfileTabProps(state),
            styles: 'settings-pane profile-pane',
            submit: submitProfileTab
        });
    }

    if (showCalendarSettings) {
        tabs.push({
            name: SETTINGS_TABS.CALENDAR,
            component: CalendarTab,
            label: 'settings.calendar.title',
            styles: 'settings-pane calendar-pane'
        });
    }

    if (showModeratorSettings || showLanguageSettings) {
        tabs.push({
            name: SETTINGS_TABS.MORE,
            component: MoreTab,
            label: 'settings.more',
            props: moreTabProps,
            propsUpdateFunction: (tabState, newProps) => {
                // Updates tab props, keeping users selection

                return {
                    ...newProps,
                    currentLanguage: tabState.currentLanguage,
                    followMeEnabled: tabState.followMeEnabled,
                    startAudioMuted: tabState.startAudioMuted,
                    startVideoMuted: tabState.startVideoMuted
                };
            },
            styles: 'settings-pane more-pane',
            submit: submitMoreTab
        });
    }
    
    // option to select or upload custom virtual background
    //alert('here');
    tabs.push({
        name: SETTINGS_TABS.VIRTUAL_BACKGROUND,
        component: VirtualBackgroundTab,
        label: 'settings.virtual_background',
        props: getVirtulBackgroundTabProps(state),
        styles: 'settings-pane virtual_background-pane',
        submit: submitProfileTab

    });
    

    return { _tabs: tabs };
}

export default connect(_mapStateToProps)(SettingsDialog);