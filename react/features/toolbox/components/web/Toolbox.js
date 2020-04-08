// @flow

import React, { Component } from 'react';

import {
    ACTION_SHORTCUT_TRIGGERED,
    createShortcutEvent,
    createToolbarEvent,
    sendAnalytics
} from '../../../analytics';
import { openDialog, toggleDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import {
    IconChat,
    IconExitFullScreen,
    IconFeedback,
    IconFullScreen,
    IconInvite,
    IconOpenInNew,
    IconPresentation,
    IconRaisedHand,
    IconRec,
    IconShareDesktop,
    IconShareVideo
} from '../../../base/icons';
import {
    getLocalParticipant,
    getParticipants,
    participantUpdated
} from '../../../base/participants';
import { connect, equals } from '../../../base/redux';
import { OverflowMenuItem } from '../../../base/toolbox';
import { getLocalVideoTrack, toggleScreensharing } from '../../../base/tracks';
import { VideoBlurButton } from '../../../blur';
import { ChatCounter, toggleChat } from '../../../chat';
import { SharedDocumentButton } from '../../../etherpad';
import { openFeedbackDialog } from '../../../feedback';
import {
    beginAddPeople,
    InfoDialogButton,
    isAddPeopleEnabled,
    isDialOutEnabled
} from '../../../invite';
import { openKeyboardShortcutsDialog } from '../../../keyboard-shortcuts';
import {
    LocalRecordingButton,
    LocalRecordingInfoDialog
} from '../../../local-recording';
import {
    LiveStreamButton,
    RecordButton
} from '../../../recording';
import {
    SETTINGS_TABS,
    SettingsButton,
    openSettingsDialog
} from '../../../settings';
import { toggleSharedVideo } from '../../../shared-video';
import { SpeakerStats } from '../../../speaker-stats';
import {
    TileViewButton,
    toggleTileView
} from '../../../video-layout';
import {
    OverflowMenuVideoQualityItem,
    VideoQualityDialog
} from '../../../video-quality';

import {
    setFullScreen,
    setOverflowMenuVisible,
    setToolbarHovered
} from '../../actions';
import AudioSettingsButton from './AudioSettingsButton';
import DownloadButton from '../DownloadButton';
import { isToolboxVisible } from '../../functions';
import HangupButton from '../HangupButton';
import HelpButton from '../HelpButton';
import OverflowMenuButton from './OverflowMenuButton';
import OverflowMenuProfileItem from './OverflowMenuProfileItem';
import MuteEveryoneButton from './MuteEveryoneButton';
import ToolbarButton from './ToolbarButton';
import VideoSettingsButton from './VideoSettingsButton';
import {
    ClosedCaptionButton
} from '../../../subtitles';

/**
 * The type of the React {@code Component} props of {@link Toolbox}.
 */
type Props = {

    /**
     * Whether or not the chat feature is currently displayed.
     */
    _chatOpen: boolean,

    /**
     * The {@code JitsiConference} for the current conference.
     */
    _conference: Object,

    /**
     * The tooltip key to use when screensharing is disabled. Or undefined
     * if non to be shown and the button to be hidden.
     */
    _desktopSharingDisabledTooltipKey: boolean,

    /**
     * Whether or not screensharing is initialized.
     */
    _desktopSharingEnabled: boolean,

    /**
     * Whether or not a dialog is displayed.
     */
    _dialog: boolean,

    /**
     * Whether or not call feedback can be sent.
     */
    _feedbackConfigured: boolean,

    /**
     * Whether or not the app is currently in full screen.
     */
    _fullScreen: boolean,

    /**
     * Whether or not the tile view is enabled.
     */
    _tileViewEnabled: boolean,

    /**
     * Whether or not invite should be hidden, regardless of feature
     * availability.
     */
    _hideInviteButton: boolean,

    /**
     * Whether or not the current user is logged in through a JWT.
     */
    _isGuest: boolean,

    /**
     * The ID of the local participant.
     */
    _localParticipantID: String,

    /**
     * The subsection of Redux state for local recording
     */
    _localRecState: Object,

    /**
     * Whether or not the overflow menu is visible.
     */
    _overflowMenuVisible: boolean,

    /**
     * Whether or not the local participant's hand is raised.
     */
    _raisedHand: boolean,

    /**
     * Whether or not the local participant is screensharing.
     */
    _screensharing: boolean,

    /**
     * Whether or not the local participant is sharing a YouTube video.
     */
    _sharingVideo: boolean,

    /**
     * Flag showing whether toolbar is visible.
     */
    _visible: boolean,

    /**
     * Set with the buttons which this Toolbox should display.
     */
    _visibleButtons: Set<string>,

    /**
     * Invoked to active other features of the app.
     */
    dispatch: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * The type of the React {@code Component} state of {@link Toolbox}.
 */
type State = {

    /**
     * The width of the browser's window.
     */
    windowWidth: number
};

declare var APP: Object;
declare var interfaceConfig: Object;

// XXX: We are not currently using state here, but in the future, when
// interfaceConfig is part of redux we will. This will have to be retrieved from the store.
const visibleButtons = new Set(interfaceConfig.TOOLBAR_BUTTONS);

/**
 * Implements the conference toolbox on React/Web.
 *
 * @extends Component
 */
class Toolbox extends Component<Props, State> {
    /**
     * Initializes a new {@code Toolbox} instance.
     *
     * @param {Props} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onMouseOut = this._onMouseOut.bind(this);
        this._onMouseOver = this._onMouseOver.bind(this);
        this._onResize = this._onResize.bind(this);
        this._onSetOverflowVisible = this._onSetOverflowVisible.bind(this);

        this._onShortcutToggleChat = this._onShortcutToggleChat.bind(this);
        this._onShortcutToggleFullScreen = this._onShortcutToggleFullScreen.bind(this);
        this._onShortcutToggleRaiseHand = this._onShortcutToggleRaiseHand.bind(this);
        this._onShortcutToggleScreenshare = this._onShortcutToggleScreenshare.bind(this);
        this._onShortcutToggleVideoQuality = this._onShortcutToggleVideoQuality.bind(this);
        this._onToolbarOpenFeedback = this._onToolbarOpenFeedback.bind(this);
        this._onToolbarOpenInvite = this._onToolbarOpenInvite.bind(this);
        this._onToolbarOpenKeyboardShortcuts = this._onToolbarOpenKeyboardShortcuts.bind(this);
        this._onToolbarOpenSpeakerStats = this._onToolbarOpenSpeakerStats.bind(this);
        this._onToolbarOpenVideoQuality = this._onToolbarOpenVideoQuality.bind(this);
        this._onToolbarToggleChat = this._onToolbarToggleChat.bind(this);
        this._onToolbarToggleFullScreen = this._onToolbarToggleFullScreen.bind(this);
        this._onToolbarToggleProfile = this._onToolbarToggleProfile.bind(this);
        this._onToolbarToggleRaiseHand = this._onToolbarToggleRaiseHand.bind(this);
        this._onToolbarToggleScreenshare = this._onToolbarToggleScreenshare.bind(this);
        this._onToolbarToggleSharedVideo = this._onToolbarToggleSharedVideo.bind(this);
        this._onToolbarOpenLocalRecordingInfoDialog = this._onToolbarOpenLocalRecordingInfoDialog.bind(this);
        this._onShortcutToggleTileView = this._onShortcutToggleTileView.bind(this);

        this.state = {
            windowWidth: window.innerWidth
        };
    }

    /**
     * Sets keyboard shortcuts for to trigger ToolbarButtons actions.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        const KEYBOARD_SHORTCUTS = [
            this._shouldShowButton('videoquality') && {
                character: 'A',
                exec: this._onShortcutToggleVideoQuality,
                helpDescription: 'keyboardShortcuts.videoQuality'
            },
            this._shouldShowButton('chat') && {
                character: 'C',
                exec: this._onShortcutToggleChat,
                helpDescription: 'keyboardShortcuts.toggleChat'
            },
            this._shouldShowButton('desktop') && {
                character: 'D',
                exec: this._onShortcutToggleScreenshare,
                helpDescription: 'keyboardShortcuts.toggleScreensharing'
            },
            this._shouldShowButton('raisehand') && {
                character: 'R',
                exec: this._onShortcutToggleRaiseHand,
                helpDescription: 'keyboardShortcuts.raiseHand'
            },
            this._shouldShowButton('fullscreen') && {
                character: 'S',
                exec: this._onShortcutToggleFullScreen,
                helpDescription: 'keyboardShortcuts.fullScreen'
            },
            this._shouldShowButton('tileview') && {
                character: 'W',
                exec: this._onShortcutToggleTileView,
                helpDescription: 'toolbar.tileViewToggle'
            }
        ];

        KEYBOARD_SHORTCUTS.forEach(shortcut => {
            if (typeof shortcut === 'object') {
                APP.keyboardshortcut.registerShortcut(
                    shortcut.character,
                    null,
                    shortcut.exec,
                    shortcut.helpDescription);
            }
        });

        window.addEventListener('resize', this._onResize);
    }

    /**
     * Update the visibility of the {@code OverflowMenuButton}.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps) {
        // Ensure the dialog is closed when the toolbox becomes hidden.
        if (prevProps._overflowMenuVisible && !this.props._visible) {
            this._onSetOverflowVisible(false);
        }

        if (prevProps._overflowMenuVisible
            && !prevProps._dialog
            && this.props._dialog) {
            this._onSetOverflowVisible(false);
            this.props.dispatch(setToolbarHovered(false));
        }
    }

    /**
     * Removes keyboard shortcuts registered by this component.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        [ 'A', 'C', 'D', 'R', 'S' ].forEach(letter =>
            APP.keyboardshortcut.unregisterShortcut(letter));

        window.removeEventListener('resize', this._onResize);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _visible, _visibleButtons } = this.props;
        const rootClassNames = `new-toolbox ${_visible ? 'visible' : ''} ${
            _visibleButtons.size ? '' : 'no-buttons'}`;

        return (
            <div
                className = { rootClassNames }
                id = 'new-toolbox'
                onMouseOut = { this._onMouseOut }
                onMouseOver = { this._onMouseOver }>
                <div className = 'toolbox-background' />
                { this._renderToolboxContent() }
            </div>
        );
    }

    /**
     * Callback invoked to display {@code FeedbackDialog}.
     *
     * @private
     * @returns {void}
     */
    _doOpenFeedback() {
        const { _conference } = this.props;

        this.props.dispatch(openFeedbackDialog(_conference));
    }

    /**
     * Dispatches an action to display {@code KeyboardShortcuts}.
     *
     * @private
     * @returns {void}
     */
    _doOpenKeyboardShorcuts() {
        this.props.dispatch(openKeyboardShortcutsDialog());
    }

    /**
     * Callback invoked to display {@code SpeakerStats}.
     *
     * @private
     * @returns {void}
     */
    _doOpenSpeakerStats() {
        this.props.dispatch(openDialog(SpeakerStats, {
            conference: this.props._conference
        }));
    }

    /**
     * Dispatches an action to open the video quality dialog.
     *
     * @private
     * @returns {void}
     */
    _doOpenVideoQuality() {
        this.props.dispatch(openDialog(VideoQualityDialog));
    }

    /**
     * Dispatches an action to toggle the display of chat.
     *
     * @private
     * @returns {void}
     */
    _doToggleChat() {
        this.props.dispatch(toggleChat());
    }

    /**
     * Dispatches an action to toggle screensharing.
     *
     * @private
     * @returns {void}
     */
    _doToggleFullScreen() {
        const fullScreen = !this.props._fullScreen;

        this.props.dispatch(setFullScreen(fullScreen));
    }

    /**
     * Dispatches an action to show or hide the profile edit panel.
     *
     * @private
     * @returns {void}
     */
    _doToggleProfile() {
        this.props.dispatch(openSettingsDialog(SETTINGS_TABS.PROFILE));
    }

    /**
     * Dispatches an action to toggle the local participant's raised hand state.
     *
     * @private
     * @returns {void}
     */
    _doToggleRaiseHand() {
        const { _localParticipantID, _raisedHand } = this.props;

        this.props.dispatch(participantUpdated({
            // XXX Only the local participant is allowed to update without
            // stating the JitsiConference instance (i.e. participant property
            // `conference` for a remote participant) because the local
            // participant is uniquely identified by the very fact that there is
            // only one local participant.

            id: _localParticipantID,
            local: true,
            raisedHand: !_raisedHand
        }));
    }

    /**
     * Dispatches an action to toggle screensharing.
     *
     * @private
     * @returns {void}
     */
    _doToggleScreenshare() {
        if (this.props._desktopSharingEnabled) {
            this.props.dispatch(toggleScreensharing());
        }
    }

    /**
     * Dispatches an action to toggle YouTube video sharing.
     *
     * @private
     * @returns {void}
     */
    _doToggleSharedVideo() {
        this.props.dispatch(toggleSharedVideo());
    }

    /**
     * Dispatches an action to toggle the video quality dialog.
     *
     * @private
     * @returns {void}
     */
    _doToggleVideoQuality() {
        this.props.dispatch(toggleDialog(VideoQualityDialog));
    }

    /**
     * Dispaches an action to toggle tile view.
     *
     * @private
     * @returns {void}
     */
    _doToggleTileView() {
        this.props.dispatch(toggleTileView());
    }

    _onMouseOut: () => void;

    /**
     * Dispatches an action signaling the toolbar is not being hovered.
     *
     * @private
     * @returns {void}
     */
    _onMouseOut() {
        this.props.dispatch(setToolbarHovered(false));
    }

    _onMouseOver: () => void;

    /**
     * Dispatches an action signaling the toolbar is being hovered.
     *
     * @private
     * @returns {void}
     */
    _onMouseOver() {
        this.props.dispatch(setToolbarHovered(true));
    }

    _onResize: () => void;

    /**
     * A window resize handler used to calculate the number of buttons we can
     * fit in the toolbar.
     *
     * @private
     * @returns {void}
     */
    _onResize() {
        const width = window.innerWidth;

        if (this.state.windowWidth !== width) {
            this.setState({ windowWidth: width });
        }
    }


    _onSetOverflowVisible: (boolean) => void;

    /**
     * Sets the visibility of the overflow menu.
     *
     * @param {boolean} visible - Whether or not the overflow menu should be
     * displayed.
     * @private
     * @returns {void}
     */
    _onSetOverflowVisible(visible) {
        this.props.dispatch(setOverflowMenuVisible(visible));
    }

    _onShortcutToggleChat: () => void;

    /**
     * Creates an analytics keyboard shortcut event and dispatches an action for
     * toggling the display of chat.
     *
     * @private
     * @returns {void}
     */
    _onShortcutToggleChat() {
        sendAnalytics(createShortcutEvent(
            'toggle.chat',
            {
                enable: !this.props._chatOpen
            }));

        this._doToggleChat();
    }

    _onShortcutToggleVideoQuality: () => void;

    /**
    * Creates an analytics keyboard shortcut event and dispatches an action for
    * toggling the display of Video Quality.
    *
    * @private
    * @returns {void}
    */
    _onShortcutToggleVideoQuality() {
        sendAnalytics(createShortcutEvent('video.quality'));

        this._doToggleVideoQuality();
    }

    _onShortcutToggleTileView: () => void;

    /**
     * Dispatches an action for toggling the tile view.
     *
     * @private
     * @returns {void}
     */
    _onShortcutToggleTileView() {
        sendAnalytics(createShortcutEvent(
            'toggle.tileview',
            {
                enable: !this.props._tileViewEnabled
            }));

        this._doToggleTileView();
    }

    _onShortcutToggleFullScreen: () => void;

    /**
     * Creates an analytics keyboard shortcut event and dispatches an action for
     * toggling full screen mode.
     *
     * @private
     * @returns {void}
     */
    _onShortcutToggleFullScreen() {
        sendAnalytics(createShortcutEvent(
            'toggle.fullscreen',
            {
                enable: !this.props._fullScreen
            }));

        this._doToggleFullScreen();
    }

    _onShortcutToggleRaiseHand: () => void;

    /**
     * Creates an analytics keyboard shortcut event and dispatches an action for
     * toggling raise hand.
     *
     * @private
     * @returns {void}
     */
    _onShortcutToggleRaiseHand() {
        sendAnalytics(createShortcutEvent(
            'toggle.raise.hand',
            ACTION_SHORTCUT_TRIGGERED,
            { enable: !this.props._raisedHand }));

        this._doToggleRaiseHand();
    }

    _onShortcutToggleScreenshare: () => void;

    /**
     * Creates an analytics keyboard shortcut event and dispatches an action for
     * toggling screensharing.
     *
     * @private
     * @returns {void}
     */
    _onShortcutToggleScreenshare() {
        sendAnalytics(createToolbarEvent(
            'screen.sharing',
            {
                enable: !this.props._screensharing
            }));

        this._doToggleScreenshare();
    }

    _onToolbarOpenFeedback: () => void;

    /**
     * Creates an analytics toolbar event and dispatches an action for toggling
     * display of feedback.
     *
     * @private
     * @returns {void}
     */
    _onToolbarOpenFeedback() {
        sendAnalytics(createToolbarEvent('feedback'));

        this._doOpenFeedback();
    }

    _onToolbarOpenInvite: () => void;

    /**
     * Creates an analytics toolbar event and dispatches an action for opening
     * the modal for inviting people directly into the conference.
     *
     * @private
     * @returns {void}
     */
    _onToolbarOpenInvite() {
        sendAnalytics(createToolbarEvent('invite'));
        this.props.dispatch(beginAddPeople());
    }

    _onToolbarOpenKeyboardShortcuts: () => void;

    /**
     * Creates an analytics toolbar event and dispatches an action for opening
     * the modal for showing available keyboard shortcuts.
     *
     * @private
     * @returns {void}
     */
    _onToolbarOpenKeyboardShortcuts() {
        sendAnalytics(createToolbarEvent('shortcuts'));

        this._doOpenKeyboardShorcuts();
    }

    _onToolbarOpenSpeakerStats: () => void;

    /**
     * Creates an analytics toolbar event and dispatches an action for opening
     * the speaker stats modal.
     *
     * @private
     * @returns {void}
     */
    _onToolbarOpenSpeakerStats() {
        sendAnalytics(createToolbarEvent('speaker.stats'));

        this._doOpenSpeakerStats();
    }

    _onToolbarOpenVideoQuality: () => void;

    /**
     * Creates an analytics toolbar event and dispatches an action for toggling
     * open the video quality dialog.
     *
     * @private
     * @returns {void}
     */
    _onToolbarOpenVideoQuality() {
        sendAnalytics(createToolbarEvent('video.quality'));

        this._doOpenVideoQuality();
    }

    _onToolbarToggleChat: () => void;

    /**
     * Creates an analytics toolbar event and dispatches an action for toggling
     * the display of chat.
     *
     * @private
     * @returns {void}
     */
    _onToolbarToggleChat() {
        sendAnalytics(createToolbarEvent(
            'toggle.chat',
            {
                enable: !this.props._chatOpen
            }));

        this._doToggleChat();
    }

    _onToolbarToggleFullScreen: () => void;

    /**
     * Creates an analytics toolbar event and dispatches an action for toggling
     * full screen mode.
     *
     * @private
     * @returns {void}
     */
    _onToolbarToggleFullScreen() {
        sendAnalytics(createToolbarEvent(
            'toggle.fullscreen',
                {
                    enable: !this.props._fullScreen
                }));

        this._doToggleFullScreen();
    }

    _onToolbarToggleProfile: () => void;

    /**
     * Creates an analytics toolbar event and dispatches an action for showing
     * or hiding the profile edit panel.
     *
     * @private
     * @returns {void}
     */
    _onToolbarToggleProfile() {
        sendAnalytics(createToolbarEvent('profile'));

        this._doToggleProfile();
    }

    _onToolbarToggleRaiseHand: () => void;

    /**
     * Creates an analytics toolbar event and dispatches an action for toggling
     * raise hand.
     *
     * @private
     * @returns {void}
     */
    _onToolbarToggleRaiseHand() {
        sendAnalytics(createToolbarEvent(
            'raise.hand',
            { enable: !this.props._raisedHand }));

        this._doToggleRaiseHand();
    }

    _onToolbarToggleScreenshare: () => void;

    /**
     * Creates an analytics toolbar event and dispatches an action for toggling
     * screensharing.
     *
     * @private
     * @returns {void}
     */
    _onToolbarToggleScreenshare() {
        if (!this.props._desktopSharingEnabled) {
            return;
        }

        sendAnalytics(createShortcutEvent(
            'toggle.screen.sharing',
            ACTION_SHORTCUT_TRIGGERED,
            { enable: !this.props._screensharing }));

        this._doToggleScreenshare();
    }

    _onToolbarToggleSharedVideo: () => void;

    /**
     * Creates an analytics toolbar event and dispatches an action for toggling
     * the sharing of a YouTube video.
     *
     * @private
     * @returns {void}
     */
    _onToolbarToggleSharedVideo() {
        sendAnalytics(createToolbarEvent('shared.video.toggled',
            {
                enable: !this.props._sharingVideo
            }));

        this._doToggleSharedVideo();
    }

    _onToolbarOpenLocalRecordingInfoDialog: () => void;

    /**
     * Opens the {@code LocalRecordingInfoDialog}.
     *
     * @private
     * @returns {void}
     */
    _onToolbarOpenLocalRecordingInfoDialog() {
        sendAnalytics(createToolbarEvent('local.recording'));

        this.props.dispatch(openDialog(LocalRecordingInfoDialog));
    }

    /**
     * Returns true if the the desktop sharing button should be visible and
     * false otherwise.
     *
     * @returns {boolean}
     */
    _isDesktopSharingButtonVisible() {
        const {
            _desktopSharingEnabled,
            _desktopSharingDisabledTooltipKey
        } = this.props;

        return _desktopSharingEnabled || _desktopSharingDisabledTooltipKey;
    }

    /**
     * Renders a button for toggleing screen sharing.
     *
     * @private
     * @param {boolean} isInOverflowMenu - True if the button is moved to the
     * overflow menu.
     * @returns {ReactElement|null}
     */
    _renderDesktopSharingButton(isInOverflowMenu = false) {
        const {
            _desktopSharingEnabled,
            _desktopSharingDisabledTooltipKey,
            _screensharing,
            t
        } = this.props;

        if (!this._isDesktopSharingButtonVisible()) {
            return null;
        }

        if (isInOverflowMenu) {
            return (
                <OverflowMenuItem
                    accessibilityLabel
                        = { t('toolbar.accessibilityLabel.shareYourScreen') }
                    disabled = { _desktopSharingEnabled }
                    icon = { IconShareDesktop }
                    iconId = 'share-desktop'
                    key = 'desktop'
                    onClick = { this._onToolbarToggleScreenshare }
                    text = {
                        t(`toolbar.${
                            _screensharing
                                ? 'stopScreenSharing' : 'startScreenSharing'}`
                        )
                    } />
            );
        }

        const tooltip = t(
            _desktopSharingEnabled
                ? 'dialog.shareYourScreen' : _desktopSharingDisabledTooltipKey);

        return (
            <ToolbarButton
                accessibilityLabel
                    = { t('toolbar.accessibilityLabel.shareYourScreen') }
                disabled = { !_desktopSharingEnabled }
                icon = { IconShareDesktop }
                onClick = { this._onToolbarToggleScreenshare }
                toggled = { _screensharing }
                tooltip = { tooltip } />
        );
    }

    /**
     * Returns true if the profile button is visible and false otherwise.
     *
     * @returns {boolean}
     */
    _isProfileVisible() {
        return this.props._isGuest && this._shouldShowButton('profile');
    }

    /**
     * Renders the list elements of the overflow menu.
     *
     * @private
     * @returns {Array<ReactElement>}
     */
    _renderOverflowMenuContent() {
        const {
            _feedbackConfigured,
            _fullScreen,
            _screensharing,
            _sharingVideo,
            t
        } = this.props;

        return [
            this._isProfileVisible()
                && <OverflowMenuProfileItem
                    key = 'profile'
                    onClick = { this._onToolbarToggleProfile } />,
            this._shouldShowButton('videoquality')
                && <OverflowMenuVideoQualityItem
                    key = 'videoquality'
                    onClick = { this._onToolbarOpenVideoQuality } />,
            this._shouldShowButton('fullscreen')
                && <OverflowMenuItem
                    accessibilityLabel = { t('toolbar.accessibilityLabel.fullScreen') }
                    icon = { _fullScreen ? IconExitFullScreen : IconFullScreen }
                    key = 'fullscreen'
                    onClick = { this._onToolbarToggleFullScreen }
                    text = { _fullScreen ? t('toolbar.exitFullScreen') : t('toolbar.enterFullScreen') } />,
            <LiveStreamButton
                key = 'livestreaming'
                showLabel = { true } />,
            <RecordButton
                key = 'record'
                showLabel = { true } />,
            this._shouldShowButton('sharedvideo')
                && <OverflowMenuItem
                    accessibilityLabel = { t('toolbar.accessibilityLabel.sharedvideo') }
                    icon = { IconShareVideo }
                    key = 'sharedvideo'
                    onClick = { this._onToolbarToggleSharedVideo }
                    text = { _sharingVideo ? t('toolbar.stopSharedVideo') : t('toolbar.sharedvideo') } />,
            this._shouldShowButton('etherpad')
                && <SharedDocumentButton
                    key = 'etherpad'
                    showLabel = { true } />,
            <VideoBlurButton
                key = 'videobackgroundblur'
                showLabel = { true }
                visible = { this._shouldShowButton('videobackgroundblur') && !_screensharing } />,
            <SettingsButton
                key = 'settings'
                showLabel = { true }
                visible = { this._shouldShowButton('settings') } />,
            <MuteEveryoneButton
                key = 'mute-everyone'
                showLabel = { true }
                visible = { this._shouldShowButton('mute-everyone') } />,
            this._shouldShowButton('stats')
                && <OverflowMenuItem
                    accessibilityLabel = { t('toolbar.accessibilityLabel.speakerStats') }
                    icon = { IconPresentation }
                    key = 'stats'
                    onClick = { this._onToolbarOpenSpeakerStats }
                    text = { t('toolbar.speakerStats') } />,
            this._shouldShowButton('feedback')
                && _feedbackConfigured
                && <OverflowMenuItem
                    accessibilityLabel = { t('toolbar.accessibilityLabel.feedback') }
                    icon = { IconFeedback }
                    key = 'feedback'
                    onClick = { this._onToolbarOpenFeedback }
                    text = { t('toolbar.feedback') } />,
            this._shouldShowButton('shortcuts')
                && <OverflowMenuItem
                    accessibilityLabel = { t('toolbar.accessibilityLabel.shortcuts') }
                    icon = { IconOpenInNew }
                    key = 'shortcuts'
                    onClick = { this._onToolbarOpenKeyboardShortcuts }
                    text = { t('toolbar.shortcuts') } />,
            this._shouldShowButton('download')
                && <DownloadButton
                    key = 'download'
                    showLabel = { true } />,
            this._shouldShowButton('help')
                && <HelpButton
                    key = 'help'
                    showLabel = { true } />
        ];
    }

    /**
     * Renders a list of buttons that are moved to the overflow menu.
     *
     * @private
     * @param {Array<string>} movedButtons - The names of the buttons to be
     * moved.
     * @returns {Array<ReactElement>}
     */
    _renderMovedButtons(movedButtons) {
        const {
            _chatOpen,
            _raisedHand,
            t
        } = this.props;

        return movedButtons.map(buttonName => {
            switch (buttonName) {
            case 'desktop':
                return this._renderDesktopSharingButton(true);
            case 'raisehand':
                return (
                    <OverflowMenuItem
                        accessibilityLabel =
                            { t('toolbar.accessibilityLabel.raiseHand') }
                        icon = { IconRaisedHand }
                        key = 'raisedHand'
                        onClick = { this._onToolbarToggleRaiseHand }
                        text = {
                            t(`toolbar.${
                                _raisedHand
                                    ? 'lowerYourHand' : 'raiseYourHand'}`
                            )
                        } />
                );
            case 'chat':
                return (
                    <OverflowMenuItem
                        accessibilityLabel =
                            { t('toolbar.accessibilityLabel.chat') }
                        icon = { IconChat }
                        key = 'chat'
                        onClick = { this._onToolbarToggleChat }
                        text = {
                            t(`toolbar.${
                                _chatOpen ? 'closeChat' : 'openChat'}`
                            )
                        } />
                );
            case 'closedcaptions':
                return <ClosedCaptionButton showLabel = { true } />;
            case 'info':
                return <InfoDialogButton showLabel = { true } />;
            case 'invite':
                return (
                    <OverflowMenuItem
                        accessibilityLabel = { t('toolbar.accessibilityLabel.invite') }
                        icon = { IconInvite }
                        key = 'invite'
                        onClick = { this._onToolbarOpenInvite }
                        text = { t('toolbar.invite') } />
                );
            case 'tileview':
                return <TileViewButton showLabel = { true } />;
            case 'localrecording':
                return (
                    <OverflowMenuItem
                        accessibilityLabel = { t('toolbar.accessibilityLabel.localRecording') }
                        icon = { IconRec }
                        key = 'localrecording'
                        onClick = { this._onToolbarOpenLocalRecordingInfoDialog }
                        text = { t('localRecording.dialogTitle') } />
                );
            default:
                return null;
            }
        });
    }

    /**
     * Renders the Audio controlling button.
     *
     * @returns {ReactElement}
     */
    _renderAudioButton() {
        return this._shouldShowButton('microphone')
            ? <AudioSettingsButton
                key = 'asb'
                visible = { true } />
            : null;
    }

    /**
    * Renders the Meeting info button and dropdown
    *
    * @returns {ReactElement}
    */
    _renderMeetingInfoButton() {
        return (
            <div className="meeting-info-box">
                <a type="button" id="meeting-info-box" onClick={this.toggleInfobox}>
                    Nitesh's Meeting
                        <span className="dropdown-icon">
                            <svg fill="none" height="9" width="9" viewBox="0 0 10 6"><path fillRule="evenodd" clipRule="evenodd" d="M8.07.248a.75.75 0 111.115 1.004L5.656 5.193a.75.75 0 01-1.115 0L1.068 1.252A.75.75 0 012.182.248L5.1 3.571 8.07.248z" fill="#5E6D7A"></path></svg>
                        </span>
                    </a>
                <div className="dropdown-menu">
                    <div className="cw_title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" viewBox="0 0 841.889 595.281">
                            <path d="M718.584 297.647C718.584 133.251 585.326.003 420.949.003c-164.386 0-297.645 133.247-297.645 297.644 0 164.371 133.259 297.63 297.645 297.63 164.377 0 297.635-133.259 297.635-297.63z"></path>
                            <g fill="#FFF">
                                <path d="M501.533 431.387a6 6 0 00-7.522-2.042c-29.493 13.961-62.967 28.723-69.537 30.012-.165-.147-.428-.417-.772-.884-.89-1.206-1.323-2.781-1.323-4.817 0-16.683 12.592-67.434 37.424-150.835 20.938-70.074 23.358-84.584 23.358-89.4 0-7.437-2.847-13.72-8.236-18.172-5.12-4.223-12.272-6.361-21.259-6.361-14.948 0-32.273 5.675-52.966 17.35-20.052 11.317-42.414 30.486-66.463 56.975a6 6 0 006.708 9.588c8.443-3.445 50.873-20.826 57.058-24.712 5.064-3.174 9.448-4.785 13.031-4.785a4.4 4.4 0 01.331.012c.043.237.084.6.084 1.119 0 3.656-.752 7.983-2.227 12.842C373.066 374.424 355.49 446.24 355.49 476.83c0 10.795 3.001 19.486 8.917 25.828 6.029 6.471 14.161 9.751 24.171 9.751 10.667 0 23.649-4.456 39.688-13.622 15.521-8.869 39.209-28.379 72.422-59.649a6 6 0 00.845-7.751zM500.373 91.99c-5.908-6.049-13.47-9.115-22.471-9.115-11.206 0-20.966 4.429-29.006 13.163-7.911 8.59-11.923 19.132-11.923 31.329 0 9.639 2.955 17.625 8.782 23.738 5.905 6.205 13.364 9.351 22.167 9.351 10.748 0 20.455-4.677 28.852-13.9 8.249-9.062 12.433-19.716 12.433-31.666.002-9.183-2.97-16.887-8.834-22.9z">
                                </path>
                            </g>
                        </svg> Details
                    </div>
                    <div className="cw_meeting-info">
                        <div className="cw_info">
                            <h2>Nitesh's Meeting</h2>
                            <span className="cw_meeting-name"></span>
                        </div>
                        <div className="cw_info_1">
                            <h2>Joining info</h2>
                            <div className="cw_meeting-url">
                                https://meet.remotepc.com/meet/22kxgmpedr3
                            </div>
                            <div className="cw_dial_meeting">
                                <span>Dial-in:</span> (US) +1 786-420-6628 <span>PIN:</span> 943 986 165 # 
                            </div>
                        </div>
                        <div className="cw_copy-text">
                            <h3>
                                <a onClick={this.copyMeetingInfo}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" fill="#383838" viewBox="0 0 841.889 595.281" overflow="visible"><g><g><path d="M506.403 104.11H229.67c-25.967 0-47.057 21.09-47.057 47.057v397.057c0 25.967 21.09 47.058 47.057 47.058h276.732c25.967 0 47.057-21.091 47.057-47.058V151.167c-.122-25.967-21.212-47.057-47.056-47.057zm14.019 443.992c0 7.802-6.339 14.141-14.142 14.141H229.548c-7.802 0-14.142-6.339-14.142-14.141V151.167c0-7.802 6.34-14.142 14.142-14.142H506.28c7.803 0 14.142 6.34 14.142 14.142v396.935z"></path><path d="M612.219 0H335.487C309.52 0 288.43 21.091 288.43 47.056a16.389 16.389 0 0016.458 16.458 16.389 16.389 0 0016.457-16.458c0-7.802 6.34-14.141 14.142-14.141h276.732c7.803 0 14.142 6.339 14.142 14.141v397.058c0 7.802-6.339 14.142-14.142 14.142a16.388 16.388 0 00-16.457 16.457 16.389 16.389 0 0016.457 16.458c25.967 0 47.057-21.091 47.057-47.057V47.056C659.276 21.091 638.186 0 612.219 0z"></path></g></g></svg>
                                    Copy joining info
                                </a>
                            </h3>
                        </div>
                    </div>
                </div>
            </div>
            )
    }

    _renderRightSideButton() {
        return (
            <ul className="cw_bottom-right-menu-list">
                <li id="present-tab-li">
                    <a onClick={this.togglePresentTab} type="button" className="js-open-modal present-tab">
                        <svg xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="32" viewBox="0 0 841.889 595.281">
                            <image overflow="visible" width="35" height="26" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAaCAYAAAA9rOU8AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJ bWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdp bj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6 eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0 NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJo dHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlw dGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAv IiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RS ZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpD cmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNl SUQ9InhtcC5paWQ6MUUzQkQ3NDNERkI2MTFFOUI5RjJBRDQ4NzQ3QUI3QUMiIHhtcE1NOkRvY3Vt ZW50SUQ9InhtcC5kaWQ6MUUzQkQ3NDRERkI2MTFFOUI5RjJBRDQ4NzQ3QUI3QUMiPiA8eG1wTU06 RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDoxRTNCRDc0MURGQjYxMUU5QjlG MkFENDg3NDdBQjdBQyIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDoxRTNCRDc0MkRGQjYxMUU5 QjlGMkFENDg3NDdBQjdBQyIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1w bWV0YT4gPD94cGFja2V0IGVuZD0iciI/PjuYB2cAAADsSURBVHjaYlSydPrPMEgAE8MgAsiOYRwI fPfYXsZBHzKjjhnWjpEA4hVArDPQjgE5ZDkQhwPxaiDWHSjHSALxKiB2gPI1gHgNJQ4i1zHiUIfY oomrQUNIm16OkYaGgA0OeXUgXg/EhrR2DCgqduFxCAyoAvEOILYjxXAWEh2jD8S7gXgtEMsCcQwW MzYC8UUg5gViLSA+RCvHrIRiENAD4jAsZiyERhNdcxMPtLJDB1wjvgQG6WXDIs5MroEsFDjmBxA/ BGJOIP4HjTKQQ74OhGPOALHyaK096piBBMgJeED6T8pWzoMzZAACDABAER22DaCVowAAAABJRU5E rkJggg==" transform="translate(78.396 29.79) scale(19.5742)"></image>
                        </svg>
                        <span>Present</span>
                    </a>
                </li>
                <li id="extra-tab-li">
                    <a onClick={this.togglemoreOptions} type="button" className="js-open-modal extra-tab">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" viewBox="0 0 841.889 595.281"><g><g><g><circle cx="420.945" cy="297.64" r="74.41"></circle><circle cx="420.945" cy="520.871" r="74.41"></circle><circle cx="420.945" cy="74.41" r="74.41"></circle></g></g></g>
                        </svg>
                    </a>
                </li>
            </ul>
            )
    }

    _renderPresentTab() {
        return (
                <div className="cw_present-menu" id="cw_present-menu_setting">
                    <ul>
                        <li> <a onClick={this.startScreenShare}> <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#2f444d" viewBox="0 0 115.383 115.383">
                                    <g>
                                        <path d="M11.025 87.779h93.333c1.932 0 3.5-1.569 3.5-3.5v-60c0-1.93-1.568-3.5-3.5-3.5H11.025c-1.93 0-3.5 1.57-3.5 3.5v60c0 1.931 1.571 3.5 3.5 3.5zm-.5-63.499a.5.5 0 01.5-.5h93.333a.5.5 0 01.5.5v60a.5.5 0 01-.5.5H11.025a.5.5 0 01-.5-.5v-60zm104.858 66.178v2.801c0 .742-.602 1.345-1.344 1.345H1.344A1.345 1.345 0 010 93.259v-2.801h47.387a1.89 1.89 0 001.807 1.354H66.19c.856 0 1.572-.572 1.808-1.354h47.385z"></path>
                                    </g>
                                </svg> Your Screen</a> </li>
                        <li><a onClick={this.showWhiteboard}> <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="#2f444d" viewBox="0 0 31.539 31.537">
                                    <g>
                                        <path d="M31.482 1.455H17.388V0h-3.583v1.455H.055v1.753h.914V20.5H14.18v3.22l-7.292 7.817h2.621l4.921-5.284v5.284h1.507V26.26l4.914 5.277h2.663l-7.333-7.817V20.5h14.724V3.208h.577V1.455zM29.617 19.21H2.258V3.208h27.357V19.21h.002z"></path>
                                    </g>
                                    <path d="M13.793 9.223a.577.577 0 00-.572-.069l-8.864 3.777a.578.578 0 10.453 1.064l8.558-3.646 3.665 2.73c.172.128.4.151.594.058l7.219-3.44-.391 1.287a.579.579 0 001.108.335l.771-2.543a.58.58 0 00-.361-.712l-2.389-.848a.58.58 0 00-.386 1.091l1.078.383-6.832 3.256-3.651-2.723z"></path>
                                </svg> Whiteboard</a></li>
                    </ul>
                </div>
            )
    }

    /**
     * Renders the Video controlling button.
     *
     * @returns {ReactElement}
     */
    _renderVideoButton() {
        return this._shouldShowButton('camera')
            ? <VideoSettingsButton
                key = 'vsb'
                visible = { true } />
            : null;
    }

    /**
     * Renders the toolbox content.
     *
     * @returns {Array<ReactElement>}
     */
    _renderToolboxContent() {
        const {
            _chatOpen,
            _hideInviteButton,
            _overflowMenuVisible,
            _raisedHand,
            t
        } = this.props;
        const overflowMenuContent = this._renderOverflowMenuContent();
        const overflowHasItems = Boolean(overflowMenuContent.filter(child => child).length);
        const toolbarAccLabel = 'toolbar.accessibilityLabel.moreActionsMenu';
        const buttonsLeft = [];
        const buttonsRight = [];

        const maxNumberOfButtonsPerGroup = Math.floor(
            (
                this.state.windowWidth
                    - 168 // the width of the central group by design
                    - 48 // the minimum space between the button groups
            )
            / 56 // the width + padding of a button
            / 2 // divide by the number of groups(left and right group)
        );

        // if (this._shouldShowButton('desktop')
        //         && this._isDesktopSharingButtonVisible()) {
        //     buttonsLeft.push('desktop');
        // }
        // if (this._shouldShowButton('raisehand')) {
        //     buttonsLeft.push('raisehand');
        // }
        // if (this._shouldShowButton('chat')) {
        //     buttonsLeft.push('chat');
        // }
        // if (this._shouldShowButton('closedcaptions')) {
        //     buttonsLeft.push('closedcaptions');
        // }
        //remove all the buttons in the left section and
        //just place a meeting name button for meeting info
        buttonsLeft.push('meetinginfo');

        // if (overflowHasItems) {
        //     buttonsRight.push('overflowmenu');
        // }
        // if (this._shouldShowButton('info')) {
        //     buttonsRight.push('info');
        // }
        // if (this._shouldShowButton('invite') && !_hideInviteButton) {
        //     buttonsRight.push('invite');
        // }
        // if (this._shouldShowButton('tileview')) {
        //     buttonsRight.push('tileview');
        // }
        // if (this._shouldShowButton('localrecording')) {
        //     buttonsRight.push('localrecording');
        // }
        buttonsRight.push('rightsidemenu');

        const movedButtons = [];

        if (buttonsLeft.length > maxNumberOfButtonsPerGroup) {
            movedButtons.push(...buttonsLeft.splice(
                maxNumberOfButtonsPerGroup,
                buttonsLeft.length - maxNumberOfButtonsPerGroup));
            if (buttonsRight.indexOf('overflowmenu') === -1) {
                buttonsRight.unshift('overflowmenu');
            }
        }

        if (buttonsRight.length > maxNumberOfButtonsPerGroup) {
            if (buttonsRight.indexOf('overflowmenu') === -1) {
                buttonsRight.unshift('overflowmenu');
            }

            let numberOfButtons = maxNumberOfButtonsPerGroup;

            // make sure the more button will be displayed when we move buttons.
            if (numberOfButtons === 0) {
                numberOfButtons++;
            }

            movedButtons.push(...buttonsRight.splice(
                numberOfButtons,
                buttonsRight.length - numberOfButtons));

        }

        overflowMenuContent.splice(
            1, 0, ...this._renderMovedButtons(movedButtons));

        return (
            <div className = 'toolbox-content'>
                <div className = 'button-group-left'>
                    { buttonsLeft.indexOf('desktop') !== -1
                        && this._renderDesktopSharingButton() }
                    { buttonsLeft.indexOf('raisehand') !== -1
                        && <ToolbarButton
                            accessibilityLabel = { t('toolbar.accessibilityLabel.raiseHand') }
                            icon = { IconRaisedHand }
                            onClick = { this._onToolbarToggleRaiseHand }
                            toggled = { _raisedHand }
                            tooltip = { t('toolbar.raiseHand') } /> }
                    { buttonsLeft.indexOf('chat') !== -1
                        && <div className = 'toolbar-button-with-badge'>
                            <ToolbarButton
                                accessibilityLabel = { t('toolbar.accessibilityLabel.chat') }
                                icon = { IconChat }
                                onClick = { this._onToolbarToggleChat }
                                toggled = { _chatOpen }
                                tooltip = { t('toolbar.chat') } />
                            <ChatCounter />
                        </div> }
                    {
                        buttonsLeft.indexOf('closedcaptions') !== -1
                            && <ClosedCaptionButton />
                    }
                    {
                        buttonsLeft.indexOf('meetinginfo') !== -1
                            && this._renderMeetingInfoButton()
                    }
                </div>
                <div className = 'button-group-center'>
                    { this._renderAudioButton() }
                    <HangupButton
                        visible = { this._shouldShowButton('hangup') } />
                    { this._renderVideoButton() }
                </div>
                <div className = 'button-group-right'>
                    { buttonsRight.indexOf('localrecording') !== -1
                        && <LocalRecordingButton
                            onClick = {
                                this._onToolbarOpenLocalRecordingInfoDialog
                            } />
                    }
                    { buttonsRight.indexOf('tileview') !== -1
                        && <TileViewButton /> }
                    { buttonsRight.indexOf('invite') !== -1
                        && <ToolbarButton
                            accessibilityLabel =
                                { t('toolbar.accessibilityLabel.invite') }
                            icon = { IconInvite }
                            onClick = { this._onToolbarOpenInvite }
                            tooltip = { t('toolbar.invite') } /> }
                    {
                        buttonsRight.indexOf('info') !== -1
                            && <InfoDialogButton />
                    }
                    { buttonsRight.indexOf('overflowmenu') !== -1
                        && <OverflowMenuButton
                            isOpen = { _overflowMenuVisible }
                            onVisibilityChange = { this._onSetOverflowVisible }>
                            <ul
                                aria-label = { t(toolbarAccLabel) }
                                className = 'overflow-menu'>
                                { overflowMenuContent }
                            </ul>
                        </OverflowMenuButton> }
                    {
                        buttonsRight.indexOf('rightsidemenu') !== -1
                        && this._renderRightSideButton()
                    }
                    {this._renderPresentTab()}
                </div>
            </div>);
    }

    _shouldShowButton: (string) => boolean;

    /**
     * Returns if a button name has been explicitly configured to be displayed.
     *
     * @param {string} buttonName - The name of the button, as expected in
     * {@link interfaceConfig}.
     * @private
     * @returns {boolean} True if the button should be displayed.
     */
    _shouldShowButton(buttonName) {
        return this.props._visibleButtons.has(buttonName);
    }

    toggleInfobox:() => boolean;

    /**
     * Toggle the Meeting detail info box.
     *
     */
    toggleInfobox() {
        $(document.querySelector('.dropdown-menu')).fadeToggle('fast');
    }
    togglePresentTab:() => boolean;

    togglePresentTab() {

    }

    togglemoreOptions:() => boolean;

    togglemoreOptions() {

    }


}

/**
 * Maps (parts of) the redux state to {@link Toolbox}'s React {@code Component}
 * props.
 *
 * @param {Object} state - The redux store/state.
 * @private
 * @returns {{}}
 */
function _mapStateToProps(state) {
    const { conference } = state['features/base/conference'];
    let { desktopSharingEnabled } = state['features/base/conference'];
    const {
        callStatsID,
        enableFeaturesBasedOnToken,
        iAmRecorder
    } = state['features/base/config'];
    const sharedVideoStatus = state['features/shared-video'].status;
    const {
        fullScreen,
        overflowMenuVisible
    } = state['features/toolbox'];
    const localParticipant = getLocalParticipant(state);
    const localRecordingStates = state['features/local-recording'];
    const localVideo = getLocalVideoTrack(state['features/base/tracks']);
    const addPeopleEnabled = isAddPeopleEnabled(state);
    const dialOutEnabled = isDialOutEnabled(state);

    let desktopSharingDisabledTooltipKey;

    if (enableFeaturesBasedOnToken) {
        // we enable desktop sharing if any participant already have this
        // feature enabled
        desktopSharingEnabled = getParticipants(state)
            .find(({ features = {} }) =>
                String(features['screen-sharing']) === 'true') !== undefined;

        // we want to show button and tooltip
        if (state['features/base/jwt'].isGuest) {
            desktopSharingDisabledTooltipKey
                = 'dialog.shareYourScreenDisabledForGuest';
        } else {
            desktopSharingDisabledTooltipKey
                = 'dialog.shareYourScreenDisabled';
        }
    }

    // NB: We compute the buttons again here because if URL parameters were used to
    // override them we'd miss it.
    const buttons = new Set(interfaceConfig.TOOLBAR_BUTTONS);

    return {
        _chatOpen: state['features/chat'].isOpen,
        _conference: conference,
        _desktopSharingEnabled: desktopSharingEnabled,
        _desktopSharingDisabledTooltipKey: desktopSharingDisabledTooltipKey,
        _dialog: Boolean(state['features/base/dialog'].component),
        _feedbackConfigured: Boolean(callStatsID),
        _hideInviteButton:
            iAmRecorder || (!addPeopleEnabled && !dialOutEnabled),
        _isGuest: state['features/base/jwt'].isGuest,
        _fullScreen: fullScreen,
        _tileViewEnabled: state['features/video-layout'].tileViewEnabled,
        _localParticipantID: localParticipant.id,
        _localRecState: localRecordingStates,
        _overflowMenuVisible: overflowMenuVisible,
        _raisedHand: localParticipant.raisedHand,
        _screensharing: localVideo && localVideo.videoType === 'desktop',
        _sharingVideo: sharedVideoStatus === 'playing'
            || sharedVideoStatus === 'start'
            || sharedVideoStatus === 'pause',
        _visible: isToolboxVisible(state),
        _visibleButtons: equals(visibleButtons, buttons) ? visibleButtons : buttons
    };
}

export default translate(connect(_mapStateToProps)(Toolbox));
