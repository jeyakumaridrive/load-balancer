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
    Icon,
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
    clearNotifications,
} from '../../../notifications';

import {
    setFullScreen,
    setOverflowMenuVisible,
    setToolbarHovered,
} from '../../actions';
import AudioSettingsButton from './AudioSettingsButton';
import DownloadButton from '../DownloadButton';
import { isToolboxVisible, showToaster } from '../../functions';
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
import ParticipantsCount from '../../../conference/components/web/ParticipantsCount';
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
    windowWidth: number,
    togglePresent: false,
    toggleSettingsMenu: false
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
        this.startScreenShare = this.startScreenShare.bind(this);
        this.showWhiteboard = this.showWhiteboard.bind(this);
        this.updateMeetingInfo = this.updateMeetingInfo.bind(this);
        this.setWrapperRef = this.setWrapperRef.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.offAllPopups = this.offAllPopups.bind(this);
        this.stopScreen = this.stopScreen.bind(this);
        this.state = {
            windowWidth: window.innerWidth,
        };
        this._onToolbarToggleWhiteboard = this._onToolbarToggleWhiteboard.bind(this);
        this.showMoreNumbers = this.showMoreNumbers.bind(this);
    }

    /**
     * Sets keyboard shortcuts for to trigger ToolbarButtons actions.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        document.addEventListener('mousedown', this.handleClickOutside);
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
        this.updateMeetingInfo();
    }

    /**
     * Update the visibility of the {@code OverflowMenuButton}.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps) {
        document.addEventListener('mousedown', this.handleClickOutside);
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
        if(this.props._screensharing == true)
        {
            $('.video-preview .settings-button-container').css('pointer-events','none');
            $('.video-preview .settings-button-container').css('opacity', '0.2');  
            if(APP.store.getState()['features/video-layout'].tileViewEnabled == true)
            {
                $('.toggle-view').click();
            }
            // APP.conference._switchCallLayout();          
        }
        else
        {
            $('.video-preview .settings-button-container').css('pointer-events','');
            $('.video-preview .settings-button-container').css('opacity', '1');
        }
    }

    /**
     * Removes keyboard shortcuts registered by this component.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        document.removeEventListener('mousedown', this.handleClickOutside);
        [ 'A', 'C', 'D', 'R', 'S' ].forEach(letter =>
            APP.keyboardshortcut.unregisterShortcut(letter));

        window.removeEventListener('resize', this._onResize);
    }
    /**
    * Set the wrapper ref
    */
    setWrapperRef(node) {
        this.wrapperRef = node;
    }
    /**
    * check if clicked on outside of chat
    */
    handleClickOutside(event)
    {

        if (!(document.getElementById('sideToolbarContainer').contains(event.target)
            || document.getElementById('new-toolbox').contains(event.target)
            || document.getElementsByClassName('meeting-info-box')[0].contains(event.target)
            || document.getElementsByClassName('atlaskit-portal')[0] != undefined && document.getElementsByClassName('atlaskit-portal')[0].contains(event.target)
            || document.getElementById('people_sidebar') != null && document.getElementById('people_sidebar').contains(event.target)
            ))
        {
            this.offAllPopups();
        }   
    }

    offAllPopups() {
        var isAvailable = document.getElementsByClassName('chat-close');
        if (isAvailable.length > 0)
        {
            document.querySelector('.chat-close').click();
            var element = document.getElementById("new-toolbox");
            element.classList.add("visible");
        }
        if(document.querySelector('.dropdown-menu.active') != null) {
            this.toggleInfobox();
        }
        this.props.dispatch(clearNotifications());
        // toggle the present menu
        this.setState({
            togglePresent:false,
            toggleSettingsMenu:false
        })
        //hide the people side bar
        $('#people_sidebar').removeClass('show-people-list');
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _visible, _visibleButtons } = this.props;
        // Add class to body to hide popups on toolbar hide
        var body = $('body');
        _visible ? body.removeClass('hidePopups') : body.addClass('hidePopups');;
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
    _onToolbarToggleWhiteboard: () => void;

    /**
     * Creates an analytics toolbar event and dispatches an action for toggling
     * the display of chat.
     *
     * @private
     * @returns {void}
     */

    _onToolbarToggleWhiteboard(cb) {
        _whiteboardOpen = !_whiteboardOpen;
        if(!window.designer.iframe) {
            window.designer.appendTo($('.drawer')[0]);
        }
        if(_whiteboardOpen) {
            $('.white-board-div').show();
            setTimeout(() => {
                var canvas = $('iframe').contents().find('canvas#third-canvas')[0];
                var stream = canvas.captureStream();
                    APP.conference._createWhiteboardTrack({
                        stream
                    }).then((tracks) => {
                        APP.conference.useVideoStream(tracks[0]);
                    });
            }, 1000);
        } else {
            // await APP.conference.toggleScreenSharing();
            try {
                console.log('trying');
                this._onToolbarToggleScreenshare();
                setTimeout(() => {
                    console.log('closing whiteboard');
                    $('.white-board-div').hide();
                }, 1000);
            } catch ($e) {
                $('.white-board-div').hide();
                console.log('errar happned', $e);
            } 
        }
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
        this.props.dispatch(setToolbarHovered(false));

        
        
    }

    /**
     * Dispatches an action to show or hide the profile edit panel.
     *
     * @private
     * @returns {void}
     */
    _doToggleProfile() {
        this.props.dispatch(openSettingsDialog(SETTINGS_TABS.DEVICES));
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
    
    startScreenShare() {
        if(APP.store.getState()['features/video-layout'].tileViewEnabled == true)
        {
            localStorage.setItem('prevLayout', true);
        }
        else
        {
            localStorage.setItem('prevLayout', false);
        }
        this.togglePresentTab();
        APP.conference.toggleScreenSharing();
    }    
    stopScreen() {
        if(document.getElementById("myId").style.display != 'block') {
            sendAnalytics(createShortcutEvent(
                'toggle.screen.sharing',
                ACTION_SHORTCUT_TRIGGERED,
                { enable: !this.props._screensharing }));
        }

        console.log('doing _doToggleScreenshare');
        this._doToggleScreenshare();
        //APP.conference.toggleScreenSharing();
        setTimeout(() => {
            console.log('closing whiteboard')
            document.getElementById("myId").style.display = 'none';
            console.log('closed whiteboard')
        }, 1000);
        console.log('setting to prevlayout change');
        APP.conference._layoutToPrevStage();
    }
    
    showWhiteboard()
    {
        var _this = this;
        if(this.props._screensharing == true)
        {
            return false;
        }
        if(APP.conference.isLocalVideoMuted() == true)
        {
            localStorage.setItem('prevVideoStatus', 'off');
        }
        else
        {
            localStorage.setItem('prevVideoStatus', 'on');
        }
        
        if(APP.store.getState()['features/video-layout'].tileViewEnabled == true)
        {
            localStorage.setItem('prevLayout', true);
            $('.toggle-view').click();
        }
        else
        {
            localStorage.setItem('prevLayout', false);
        }
        APP.conference._switchCallLayout();
        document.getElementById("myId").style.display = 'block';
        setTimeout(() => {
            var canvas = $('#myId').contents().find('canvas#third-canvas')[0];
            var stream = canvas.captureStream();
            console.log(stream);
            APP.conference._createWhiteboardTrack({
                stream
            }).then((tracks) => {
                APP.conference.useVideoStream(tracks[0]);
            });
        }, 1000);
        this.togglePresentTab();      
        var checkExist = setInterval(function() {
        var btn = $( "#myId").contents().find('#close-icon');
        var ifrm = $( "#myId").contents().find('body');
            if (typeof btn !== 'undefined')
            {
                
                if(!btn.hasClass('eventAdded'))
                {

                    btn.addClass('eventAdded');
                    btn.on('click',function() {
                    _this.stopScreen();
                   
                    //document.getElementById('closeMyBoard').click();
                    });

                    ifrm.on('click',function() {
                        
                        _this.offAllPopups();
                    });

                }
                clearInterval(checkExist);
            }
        }, 600);

        //document.getElementById("ShowMyBoard").click();
    }
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
        const { _visible } = this.props;
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

        this.setState({
            toggleSettingsMenu: false
        })
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
        this.setState({
            toggleSettingsMenu: false
        })
        
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

    updateMeetingInfo() {
        var v = 0, x = setInterval(() => {
            if(APP && APP.conference && document.getElementById('meeting-info-box') != null) {
                var roomName = APP.conference.roomName;
                this.getMeetingPin(roomName)
                this.getMeetingInfo(roomName);
                this.getSIP();
                clearInterval(x);
                var el = document.createElement('div');
                el.id = 'snackbar';
                document.body.appendChild(el);
            }
        },1000);
    }

    getMeetingPin(meetingId: string) {
        let { parentApi } = APP.store.getState()['features/base/config'];
        const fullUrl = `${parentApi}/api/v1/conferenceMapper?conference=${meetingId}@conference.meeting.remotepc.com`;
        $.get(fullUrl)
        .then(resolve => {
            $('#pin').text(resolve.id.toString().replace(/^(.{3})(.{3})(.*)$/, "$1 $2 $3"));
        })
        .catch(reject => {
            console.log('=>>> reject ->>',reject);
        });
    }

    getMeetingInfo(meetingId: string) {
        let { parentDomain, parentApi } = APP.store.getState()['features/base/config'];
        const fullUrl = `${parentApi}/api/v1/get-meeting-by-slug?slug=${meetingId}`;
        $.get(fullUrl)
        .then(resolve => {
            if(!resolve) {
                location.href="https://www.remotepc.com";
            }
            $('.cw_meeting-url').text(parentDomain+'/meet/'+resolve.slug);
            if(APP.password) {
                $('.cw_meeting-password').show();
                $('.cw_meeting-password b').text(APP.password);
            } else {
                $('.cw_meeting-password').hide();
            }
            $('.meeting-name').text(resolve.name);
            $('.cw_meeting-name').text(resolve.description);
            sessionStorage.setItem('meetingInfo',JSON.stringify(resolve));
        })
        .catch(reject => {
            console.log('=>>> reject ->>',reject);
        });
    }

    getTimeString(meetingInfo) {
        var x = new Date(meetingInfo.meeting_on)
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];
          var hours = x.getHours();
          var minutes = x.getMinutes();
          var ampm = hours >= 12 ? 'PM' : 'AM';
          hours = hours % 12;
          hours = hours ? hours : 12; // the hour '0' should be '12'
          minutes = minutes < 10 ? '0'+minutes : minutes;
          var strTime = hours + ':' + minutes + ' ' + ampm;
        return monthNames[x.getMonth()]+' '+x.getDate()+', '+x.getFullYear()+' '+strTime+' '+meetingInfo.timezone;
    }
    getSIP() {
        const fullUrl = `https://api-meeting.remotepc.com/`;
        $.get(fullUrl)
        .then(resolve => {
            var n = '';
            for ( var num in resolve.numbers) {
                if(resolve.numbers[num][0] != "+NA")
                n += '('+num+')'+' '+resolve.numbers[num][0].replace(/[.]/g,'-')+'\n';
                // console.log('=>>>>',n,num,resolve.numbers[num][0]);
            }
            // console.log('help =>..',n);
            $('.cw_phone_numbers').html(n);
            sessionStorage.phone_numbers = n;
            //document.getElementById('phone-me').innerHTML = n;
        })
        .catch(reject => {
            console.log('=>>> reject ->>',reject);
        });
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
                    id = 'ScreenSharebtn'
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

    showMoreNumbers() {
        this.setState({ morenumbers : !this.state.morenumbers });
        $('.cw_phone_numbers').toggle();
    }
    /**
    * Renders the Meeting info button and dropdown
    *
    * @returns {ReactElement}
    */
    _renderMeetingInfoButton() {
        var moreNumbers = "https://meeting.remotepc.com/static/dialInInfo.html?room="+APP.conference.roomName;
        var phone_numbers = sessionStorage.phone_numbers;
        return (
            <ul className="cw_bottom-left-menu-list"> 

                <li>
                    <div className="meeting-info-box">
                        <a type="button" className='js-open-modal present-tab' id="meeting-info-box" onClick={() => this.toggleInfobox()}>
                            <span className="meeting-name"></span>
                            <span className="dropdown-icon" style={{'display': 'none'}}>
                                <img src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPg0KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJMYXllcl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCINCgkgdmlld0JveD0iMCAwIDQ5Mi4wMDIgNDkyLjAwMiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNDkyLjAwMiA0OTIuMDAyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+DQo8Zz4NCgk8Zz4NCgkJPHBhdGggZD0iTTQ4NC4xMzYsMzI4LjQ3M0wyNjQuOTg4LDEwOS4zMjljLTUuMDY0LTUuMDY0LTExLjgxNi03Ljg0NC0xOS4xNzItNy44NDRjLTcuMjA4LDAtMTMuOTY0LDIuNzgtMTkuMDIsNy44NDQNCgkJCUw3Ljg1MiwzMjguMjY1QzIuNzg4LDMzMy4zMzMsMCwzNDAuMDg5LDAsMzQ3LjI5N2MwLDcuMjA4LDIuNzg0LDEzLjk2OCw3Ljg1MiwxOS4wMzJsMTYuMTI0LDE2LjEyNA0KCQkJYzUuMDY0LDUuMDY0LDExLjgyNCw3Ljg2LDE5LjAzMiw3Ljg2czEzLjk2NC0yLjc5NiwxOS4wMzItNy44NmwxODMuODUyLTE4My44NTJsMTg0LjA1NiwxODQuMDY0DQoJCQljNS4wNjQsNS4wNiwxMS44Miw3Ljg1MiwxOS4wMzIsNy44NTJjNy4yMDgsMCwxMy45Ni0yLjc5MiwxOS4wMjgtNy44NTJsMTYuMTI4LTE2LjEzMg0KCQkJQzQ5NC42MjQsMzU2LjA0MSw0OTQuNjI0LDMzOC45NjUsNDg0LjEzNiwzMjguNDczeiIvPg0KCTwvZz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjwvc3ZnPg0K"  />
                            </span>
                            <span className="dropdown-icon">
                                  <img src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPg0KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJMYXllcl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCINCgkgdmlld0JveD0iMCAwIDQ5MS45OTYgNDkxLjk5NiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNDkxLjk5NiA0OTEuOTk2OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+DQo8Zz4NCgk8Zz4NCgkJPHBhdGggZD0iTTQ4NC4xMzIsMTI0Ljk4NmwtMTYuMTE2LTE2LjIyOGMtNS4wNzItNS4wNjgtMTEuODItNy44Ni0xOS4wMzItNy44NmMtNy4yMDgsMC0xMy45NjQsMi43OTItMTkuMDM2LDcuODZsLTE4My44NCwxODMuODQ4DQoJCQlMNjIuMDU2LDEwOC41NTRjLTUuMDY0LTUuMDY4LTExLjgyLTcuODU2LTE5LjAyOC03Ljg1NnMtMTMuOTY4LDIuNzg4LTE5LjAzNiw3Ljg1NmwtMTYuMTIsMTYuMTI4DQoJCQljLTEwLjQ5NiwxMC40ODgtMTAuNDk2LDI3LjU3MiwwLDM4LjA2bDIxOS4xMzYsMjE5LjkyNGM1LjA2NCw1LjA2NCwxMS44MTIsOC42MzIsMTkuMDg0LDguNjMyaDAuMDg0DQoJCQljNy4yMTIsMCwxMy45Ni0zLjU3MiwxOS4wMjQtOC42MzJsMjE4LjkzMi0yMTkuMzI4YzUuMDcyLTUuMDY0LDcuODU2LTEyLjAxNiw3Ljg2NC0xOS4yMjQNCgkJCUM0OTEuOTk2LDEzNi45MDIsNDg5LjIwNCwxMzAuMDQ2LDQ4NC4xMzIsMTI0Ljk4NnoiLz4NCgk8L2c+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8L3N2Zz4NCg==" />
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
                                    <h2 className="meeting-name"></h2>
                                    <span className="cw_meeting-name"></span>
                                </div>
                                <div className="cw_info_1">
                                    <h2>Joining info</h2>
                                    <div className="cw_meeting-url"></div>
                                    <div className="cw_meeting-password" style = {{ fontSize: '15px' }}> Use Meeting Password : <b> </b></div>
                                    <div className="cw_dial_meeting">
                                        <span>Dial-in:</span> <span id="phone-me" className="phone">(US) +1-760-284-6659</span> 
                                    </div>
                                    <div className="cw_dial_meeting">
                                       <span>PIN:</span> <span id="pin"></span> 
                                    </div>
                                </div>
                                {
                                    !this.state.morenumbers &&
                                    <div className="cw_copy-text"><h3><a onClick={this.showMoreNumbers}>More numbers</a></h3></div>
                                }
                                {
                                    this.state.morenumbers && 
                                    <div className="cw_copy-text"><h3><a onClick={this.showMoreNumbers}>Less numbers</a></h3></div>
                                }
                                <div className="cw_copy-text cw_phone_numbers" style={{ whiteSpace: 'pre-wrap', display: 'none' }}>
                                    <p>{phone_numbers}</p>
                                </div>
                                <div className="cw_copy-text">
                                    <h3>
                                        <a onClick={() => this.copyMeetingInfo()}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" fill="#383838" viewBox="0 0 841.889 595.281" overflow="visible"><g><g><path d="M506.403 104.11H229.67c-25.967 0-47.057 21.09-47.057 47.057v397.057c0 25.967 21.09 47.058 47.057 47.058h276.732c25.967 0 47.057-21.091 47.057-47.058V151.167c-.122-25.967-21.212-47.057-47.056-47.057zm14.019 443.992c0 7.802-6.339 14.141-14.142 14.141H229.548c-7.802 0-14.142-6.339-14.142-14.141V151.167c0-7.802 6.34-14.142 14.142-14.142H506.28c7.803 0 14.142 6.34 14.142 14.142v396.935z"></path><path d="M612.219 0H335.487C309.52 0 288.43 21.091 288.43 47.056a16.389 16.389 0 0016.458 16.458 16.389 16.389 0 0016.457-16.458c0-7.802 6.34-14.141 14.142-14.141h276.732c7.803 0 14.142 6.339 14.142 14.141v397.058c0 7.802-6.339 14.142-14.142 14.142a16.388 16.388 0 00-16.457 16.457 16.389 16.389 0 0016.457 16.458c25.967 0 47.057-21.091 47.057-47.057V47.056C659.276 21.091 638.186 0 612.219 0z"></path></g></g></svg>
                                            Copy joining info
                                        </a>
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </li>
                    <RecordButton
                        key = 'record'
                        showLabel = { true } />
            </ul>
            
            )
    }

    _renderRightSideButton() {
        const {
            _chatOpen,
            _hideInviteButton,
            _overflowMenuVisible,
            _raisedHand,
            t
        } = this.props;

        return (
            <ul className="cw_bottom-right-menu-list">
               <li>
                    <div className = 'toolbar-button-with-badge'>
                            <ParticipantsCount />
                    </div>
                </li>         
                <li>
                    <div className = 'toolbar-button-with-badge'>
                        <a onClick={this._onToolbarToggleChat} type="button" className="js-open-modal present-tab"> 
                            <Icon src = { IconChat } />   
                            <span>Chat</span>
                            <ChatCounter />
                        </a>
                    </div>
                </li>
                {
                    this.props._screensharing != true ? (<li id="present-tab-li">
                    <a onClick={this.togglePresentTab} type="button" className="js-open-modal present-tab">
                        <svg xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="32" viewBox="0 0 841.889 595.281">
                            <image overflow="visible" width="35" height="26" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAaCAYAAAA9rOU8AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJ bWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdp bj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6 eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0 NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJo dHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlw dGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAv IiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RS ZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpD cmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNl SUQ9InhtcC5paWQ6MUUzQkQ3NDNERkI2MTFFOUI5RjJBRDQ4NzQ3QUI3QUMiIHhtcE1NOkRvY3Vt ZW50SUQ9InhtcC5kaWQ6MUUzQkQ3NDRERkI2MTFFOUI5RjJBRDQ4NzQ3QUI3QUMiPiA8eG1wTU06 RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDoxRTNCRDc0MURGQjYxMUU5QjlG MkFENDg3NDdBQjdBQyIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDoxRTNCRDc0MkRGQjYxMUU5 QjlGMkFENDg3NDdBQjdBQyIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1w bWV0YT4gPD94cGFja2V0IGVuZD0iciI/PjuYB2cAAADsSURBVHjaYlSydPrPMEgAE8MgAsiOYRwI fPfYXsZBHzKjjhnWjpEA4hVArDPQjgE5ZDkQhwPxaiDWHSjHSALxKiB2gPI1gHgNJQ4i1zHiUIfY oomrQUNIm16OkYaGgA0OeXUgXg/EhrR2DCgqduFxCAyoAvEOILYjxXAWEh2jD8S7gXgtEMsCcQwW MzYC8UUg5gViLSA+RCvHrIRiENAD4jAsZiyERhNdcxMPtLJDB1wjvgQG6WXDIs5MroEsFDjmBxA/ BGJOIP4HjTKQQ74OhGPOALHyaK096piBBMgJeED6T8pWzoMzZAACDABAER22DaCVowAAAABJRU5E rkJggg==" transform="translate(78.396 29.79) scale(19.5742)"></image>
                        </svg>
                        <span>Present</span>
                    </a>
                </li>) : (<li id="present-tab-li">
                    <a onClick={this.stopScreen} type="button" className="js-open-modal present-tab">
                        <svg xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="32" viewBox="0 0 841.889 595.281">
                            <image overflow="visible" width="35" height="26" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAaCAYAAAA9rOU8AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJ bWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdp bj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6 eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0 NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJo dHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlw dGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAv IiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RS ZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpD cmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNl SUQ9InhtcC5paWQ6MUUzQkQ3NDNERkI2MTFFOUI5RjJBRDQ4NzQ3QUI3QUMiIHhtcE1NOkRvY3Vt ZW50SUQ9InhtcC5kaWQ6MUUzQkQ3NDRERkI2MTFFOUI5RjJBRDQ4NzQ3QUI3QUMiPiA8eG1wTU06 RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDoxRTNCRDc0MURGQjYxMUU5QjlG MkFENDg3NDdBQjdBQyIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDoxRTNCRDc0MkRGQjYxMUU5 QjlGMkFENDg3NDdBQjdBQyIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1w bWV0YT4gPD94cGFja2V0IGVuZD0iciI/PjuYB2cAAADsSURBVHjaYlSydPrPMEgAE8MgAsiOYRwI fPfYXsZBHzKjjhnWjpEA4hVArDPQjgE5ZDkQhwPxaiDWHSjHSALxKiB2gPI1gHgNJQ4i1zHiUIfY oomrQUNIm16OkYaGgA0OeXUgXg/EhrR2DCgqduFxCAyoAvEOILYjxXAWEh2jD8S7gXgtEMsCcQwW MzYC8UUg5gViLSA+RCvHrIRiENAD4jAsZiyERhNdcxMPtLJDB1wjvgQG6WXDIs5MroEsFDjmBxA/ BGJOIP4HjTKQQ74OhGPOALHyaK096piBBMgJeED6T8pWzoMzZAACDABAER22DaCVowAAAABJRU5E rkJggg==" transform="translate(78.396 29.79) scale(19.5742)"></image>
                        </svg>
                        <span>Stop Share</span>
                    </a>
                </li>)
                }
                
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
        if(this.props._screensharing == true && $('#myId').is(":visible"))
        {
            var classNameForLi = 'disabledCls';
        }
        else
        {
            var classNameForLi = '';
        }
        if(this.props._screensharing == true)
        {
            var classNameForLiW = 'disabledCls';
        }
        else
        {
            var classNameForLiW = '';
        }

        if(this.props._screensharing != true)
        {

            if(APP.conference._room.isAdmin !== undefined && typeof APP.conference._room.isAdmin !== undefined)
            {
                if(APP.conference._room.isAdmin !== undefined && typeof APP.conference._room.isAdmin !== undefined && APP.conference._room.isAdmin == "true")
                {
                    return (
                        <div className="cw_present-menu" id="cw_present-menu_setting">
                            <ul>
                                <li> <a onClick={this.startScreenShare} className={classNameForLi}> <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#2f444d" viewBox="0 0 115.383 115.383">
                                            <g>
                                                <path d="M11.025 87.779h93.333c1.932 0 3.5-1.569 3.5-3.5v-60c0-1.93-1.568-3.5-3.5-3.5H11.025c-1.93 0-3.5 1.57-3.5 3.5v60c0 1.931 1.571 3.5 3.5 3.5zm-.5-63.499a.5.5 0 01.5-.5h93.333a.5.5 0 01.5.5v60a.5.5 0 01-.5.5H11.025a.5.5 0 01-.5-.5v-60zm104.858 66.178v2.801c0 .742-.602 1.345-1.344 1.345H1.344A1.345 1.345 0 010 93.259v-2.801h47.387a1.89 1.89 0 001.807 1.354H66.19c.856 0 1.572-.572 1.808-1.354h47.385z"></path>
                                            </g>
                                        </svg> Your Screen</a> </li>
                                <li><a onClick={ ()=>{ this.showWhiteboard() } } className={  `${classNameForLi} ${classNameForLiW}`}> <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="#2f444d" viewBox="0 0 31.539 31.537">
                                            <g>
                                                <path d="M31.482 1.455H17.388V0h-3.583v1.455H.055v1.753h.914V20.5H14.18v3.22l-7.292 7.817h2.621l4.921-5.284v5.284h1.507V26.26l4.914 5.277h2.663l-7.333-7.817V20.5h14.724V3.208h.577V1.455zM29.617 19.21H2.258V3.208h27.357V19.21h.002z"></path>
                                            </g>
                                            <path d="M13.793 9.223a.577.577 0 00-.572-.069l-8.864 3.777a.578.578 0 10.453 1.064l8.558-3.646 3.665 2.73c.172.128.4.151.594.058l7.219-3.44-.391 1.287a.579.579 0 001.108.335l.771-2.543a.58.58 0 00-.361-.712l-2.389-.848a.58.58 0 00-.386 1.091l1.078.383-6.832 3.256-3.651-2.723z"></path>
                                        </svg> Whiteboard</a></li>
                            </ul>
                        </div>
                    ) 
                }
                else
                {
                    return (
                        <div className="cw_present-menu" id="cw_present-menu_setting">
                            <ul>
                                <li> <a onClick={this.startScreenShare} className={classNameForLi}> <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#2f444d" viewBox="0 0 115.383 115.383">
                                            <g>
                                                <path d="M11.025 87.779h93.333c1.932 0 3.5-1.569 3.5-3.5v-60c0-1.93-1.568-3.5-3.5-3.5H11.025c-1.93 0-3.5 1.57-3.5 3.5v60c0 1.931 1.571 3.5 3.5 3.5zm-.5-63.499a.5.5 0 01.5-.5h93.333a.5.5 0 01.5.5v60a.5.5 0 01-.5.5H11.025a.5.5 0 01-.5-.5v-60zm104.858 66.178v2.801c0 .742-.602 1.345-1.344 1.345H1.344A1.345 1.345 0 010 93.259v-2.801h47.387a1.89 1.89 0 001.807 1.354H66.19c.856 0 1.572-.572 1.808-1.354h47.385z"></path>
                                            </g>
                                        </svg> Your Screen</a> </li>
                                                                    <li><a onClick={ ()=>{ this.showWhiteboard() } } className={  `${classNameForLi} ${classNameForLiW}`}> <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="#2f444d" viewBox="0 0 31.539 31.537">
                                            <g>
                                                <path d="M31.482 1.455H17.388V0h-3.583v1.455H.055v1.753h.914V20.5H14.18v3.22l-7.292 7.817h2.621l4.921-5.284v5.284h1.507V26.26l4.914 5.277h2.663l-7.333-7.817V20.5h14.724V3.208h.577V1.455zM29.617 19.21H2.258V3.208h27.357V19.21h.002z"></path>
                                            </g>
                                            <path d="M13.793 9.223a.577.577 0 00-.572-.069l-8.864 3.777a.578.578 0 10.453 1.064l8.558-3.646 3.665 2.73c.172.128.4.151.594.058l7.219-3.44-.391 1.287a.579.579 0 001.108.335l.771-2.543a.58.58 0 00-.361-.712l-2.389-.848a.58.58 0 00-.386 1.091l1.078.383-6.832 3.256-3.651-2.723z"></path>
                                        </svg> Whiteboard</a></li>
                            </ul>
                        </div>
                    )                 
                }
            }
            else
            {
                return (
                    <div className="cw_present-menu" id="cw_present-menu_setting">
                        <ul>
                            <li> <a onClick={this.startScreenShare} className={classNameForLi}> <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#2f444d" viewBox="0 0 115.383 115.383">
                                        <g>
                                            <path d="M11.025 87.779h93.333c1.932 0 3.5-1.569 3.5-3.5v-60c0-1.93-1.568-3.5-3.5-3.5H11.025c-1.93 0-3.5 1.57-3.5 3.5v60c0 1.931 1.571 3.5 3.5 3.5zm-.5-63.499a.5.5 0 01.5-.5h93.333a.5.5 0 01.5.5v60a.5.5 0 01-.5.5H11.025a.5.5 0 01-.5-.5v-60zm104.858 66.178v2.801c0 .742-.602 1.345-1.344 1.345H1.344A1.345 1.345 0 010 93.259v-2.801h47.387a1.89 1.89 0 001.807 1.354H66.19c.856 0 1.572-.572 1.808-1.354h47.385z"></path>
                                        </g>
                                    </svg> Your Screen</a> </li>
                                    <li><a onClick={ ()=>{ this.showWhiteboard() } } className={  `${classNameForLi} ${classNameForLiW}`}> <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="#2f444d" viewBox="0 0 31.539 31.537">
                                            <g>
                                                <path d="M31.482 1.455H17.388V0h-3.583v1.455H.055v1.753h.914V20.5H14.18v3.22l-7.292 7.817h2.621l4.921-5.284v5.284h1.507V26.26l4.914 5.277h2.663l-7.333-7.817V20.5h14.724V3.208h.577V1.455zM29.617 19.21H2.258V3.208h27.357V19.21h.002z"></path>
                                            </g>
                                            <path d="M13.793 9.223a.577.577 0 00-.572-.069l-8.864 3.777a.578.578 0 10.453 1.064l8.558-3.646 3.665 2.73c.172.128.4.151.594.058l7.219-3.44-.391 1.287a.579.579 0 001.108.335l.771-2.543a.58.58 0 00-.361-.712l-2.389-.848a.58.58 0 00-.386 1.091l1.078.383-6.832 3.256-3.651-2.723z"></path>
                                        </svg> Whiteboard</a></li>
                        </ul>
                    </div>
                )            
            }
        }
        // else
        // {
        //         return (
        //             <div className="cw_present-menu" id="cw_present-menu_setting">
        //                 <ul>
        //                     <li> <a onClick={this.startScreenShare}> <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#2f444d" viewBox="0 0 115.383 115.383">
        //                                 <g>
        //                                     <path d="M11.025 87.779h93.333c1.932 0 3.5-1.569 3.5-3.5v-60c0-1.93-1.568-3.5-3.5-3.5H11.025c-1.93 0-3.5 1.57-3.5 3.5v60c0 1.931 1.571 3.5 3.5 3.5zm-.5-63.499a.5.5 0 01.5-.5h93.333a.5.5 0 01.5.5v60a.5.5 0 01-.5.5H11.025a.5.5 0 01-.5-.5v-60zm104.858 66.178v2.801c0 .742-.602 1.345-1.344 1.345H1.344A1.345 1.345 0 010 93.259v-2.801h47.387a1.89 1.89 0 001.807 1.354H66.19c.856 0 1.572-.572 1.808-1.354h47.385z"></path>
        //                                 </g>
        //                     </svg> Stop Share</a> </li>
                                    
        //                 </ul>
        //             </div>
        //         )               
        // } 
    }

    _renderSettingsTab() {
        const {
            _feedbackConfigured,
            _fullScreen,
            _screensharing,
            _sharingVideo,
            t
        } = this.props;
        return (
                <div className="cw_present-menu cw_settings-menu" id="cw_settings_menu">
                    <ul> 
                            <li>
                                <a onClick={this._onToolbarToggleFullScreen}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#2f444d" viewBox="0 0 512 512"><path d="M0 18.286v128h36.571V36.572h109.715V0h-128C8.178 0 0 8.178 0 18.286zM493.714 0h-128v36.572h109.714v109.714H512v-128C512 8.178 503.822 0 493.714 0zM475.428 475.428H365.714V512h128c10.107 0 18.286-8.178 18.286-18.285V365.714h-36.572v109.714zM36.572 365.714H0v128.001C0 503.822 8.178 512 18.286 512h128v-36.571H36.572V365.714z"></path></svg>
                                    <span class="fullscreen_text">
                                        
                                    {_fullScreen ? 'Exit Full Screen' :'Full Screen' }
                                    </span>
                                </a>
                            </li>
                            <li>
                                <a onClick={this._onToolbarToggleProfile}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#2f444d" viewBox="0 0 48.352 48.352"><g><g><g><path d="M47.369 20.046l-5.824-1.092a17.799 17.799 0 00-1.394-3.371l3.37-4.927c.313-.456.247-1.143-.144-1.532l-4.155-4.156c-.391-.391-1.076-.454-1.53-.143l-4.93 3.372a18.009 18.009 0 00-3.474-1.421L28.202.982C28.101.44 27.573 0 27.019 0h-5.876c-.553 0-1.082.439-1.185.982L18.86 6.834a17.854 17.854 0 00-3.334 1.392L10.66 4.897c-.456-.312-1.142-.248-1.532.143L4.972 9.196c-.391.392-.454 1.076-.143 1.532l3.35 4.896a18.125 18.125 0 00-1.371 3.331L.984 20.046c-.542.103-.981.632-.981 1.185v5.876c0 .554.439 1.082.981 1.187l5.82 1.091a18.013 18.013 0 001.401 3.399l-3.313 4.842c-.312.456-.248 1.142.144 1.531l4.154 4.154c.392.393 1.076.454 1.532.146l4.84-3.313a18.086 18.086 0 003.299 1.375l1.098 5.854c.103.543.632.98 1.185.98h5.877c.555 0 1.081-.438 1.186-.98l1.087-5.795c1.2-.354 2.354-.821 3.438-1.401l4.901 3.354c.456.313 1.142.248 1.532-.145l4.152-4.153c.394-.392.455-1.074.146-1.531l-3.335-4.873a18.08 18.08 0 001.423-3.44l5.819-1.091c.541-.104.979-.633.979-1.187v-5.876c.004-.557-.437-1.086-.98-1.189zM24.178 34.261c-5.568 0-10.083-4.515-10.083-10.086 0-5.567 4.515-10.083 10.083-10.083 5.57 0 10.086 4.516 10.086 10.083 0 5.571-4.518 10.086-10.086 10.086z"></path></g></g></g></svg> Settings
                                </a>
                            </li>
                        </ul>
                </div>
            )
    }

    copyMeetingInfo() {
        var meetingInfo = JSON.parse(sessionStorage.meetingInfo);
        let { parentDomain } = APP.store.getState()['features/base/config'];
        console.log('=>>>> meeting info =>>>>',meetingInfo);
        var pin = $('#pin').text(),phone = $('.phone').text(),timeStr = this.getTimeString(meetingInfo);
        var text = APP.conference.getLocalDisplayName()+` is inviting you to a scheduled RemotePC Meeting.` + '\n' +
            `` + '\n' +
            `Topic: ${meetingInfo.name}` + '\n' +
            `Time: ${timeStr}` + '\n' +
            `` + '\n' +
            `Join RemotePC Meeting` + '\n' +
            `${parentDomain}/meet/${meetingInfo.slug}` + '\n' +
			(function() {
				if(APP.password) {
					return `Use Meeting Password : `+ APP.password + '\n';
				}
			} ()) +
            `` + '\n' +
            `One tap mobile` + '\n' +
            `${sessionStorage.phone_numbers.split('\n').map(phone => {
                var _phone = phone.split(" ");
                if(_phone.length > 1) {
                    return _phone[1].replace(/([-])|([A-Z() ])/g,'')+',,'+pin.replace(/ /g,'')+'# '+_phone[0]
                }
            }).join("\n")}`+
            `Or Call ` + '\n' +
            `${sessionStorage.phone_numbers}` + '\n' +
            `Use Meeting Pin: ${pin}` + '\n' +
            ``;
        event.preventDefault();

        const el = document.createElement('textarea');
        el.value = text;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';                 
        el.style.left = '-9999px';
        document.body.appendChild(el);
        const selected = document.getSelection().rangeCount > 0 ? document.getSelection().getRangeAt(0) : false;                                    // Mark as false to know no selection existed before
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        showToaster('Joining info has been copied to the clipboard');
    }

    // showToaster(message) {
    //     var x = document.getElementById("snackbar");
    //     x.className = "show";
    //     x.innerText = message;
    //     setTimeout(function () { x.className = x.className.replace("show", ""); }, 2000);
    // }

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
                        buttonsLeft.indexOf('meetinginfo') !== -1 && this._renderMeetingInfoButton()
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
                    {this.state.togglePresent ? this._renderPresentTab() : ''}
                    {this.state.toggleSettingsMenu ? this._renderSettingsTab() : ''}
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
        this.setState({
            togglePresent: false,
            toggleSettingsMenu: false
        })
        var ele = document.querySelector('.dropdown-menu');
        $(ele).fadeToggle('fast').toggleClass('active');
        $('#meeting-info-box span.dropdown-icon').toggle();
        if(APP.password) {
            $('.cw_meeting-password').show();
            $('.cw_meeting-password b').text(APP.password);
        } else {
            $('.cw_meeting-password').hide();
        }
    }
    togglePresentTab:() => boolean;

    togglePresentTab = () => {
        this.offAllPopups();
        this.setState({
            togglePresent: !this.state.togglePresent,
            toggleSettingsMenu: false
        })
    }

    togglemoreOptions:() => boolean;

    togglemoreOptions = () => {
        this.offAllPopups();
        this.setState({
            togglePresent: false,
            toggleSettingsMenu: !this.state.toggleSettingsMenu
        })
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
        overflowMenuVisible,
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
