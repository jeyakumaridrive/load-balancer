// @flow

import _ from 'lodash';
import React from 'react';

import VideoLayout from '../../../../../modules/UI/videolayout/VideoLayout';

import { connect, disconnect } from '../../../base/connection';
import { translate } from '../../../base/i18n';
import { connect as reactReduxConnect } from '../../../base/redux';
import { getBackendSafeRoomName } from '../../../base/util';
import { Chat } from '../../../chat';
import { Filmstrip } from '../../../filmstrip';
import { CalleeInfoContainer } from '../../../invite';
import { LargeVideo } from '../../../large-video';
import { LAYOUTS, getCurrentLayout } from '../../../video-layout';
import { updateSettings } from '../../../base/settings';

import {
    Toolbox,
    fullScreenChanged,
    setToolboxAlwaysVisible,
    showToolbox
} from '../../../toolbox';

import { maybeShowSuboptimalExperienceNotification } from '../../functions';

import Labels from './Labels';
import { default as Notice } from './Notice';
import { default as Subject } from './Subject';
import {
    AbstractConference,
    abstractMapStateToProps
} from '../AbstractConference';
import type { AbstractProps } from '../AbstractConference';
import socketIOClient from "socket.io-client";

declare var APP: Object;
declare var config: Object;
declare var interfaceConfig: Object;

/**
 * DOM events for when full screen mode has changed. Different browsers need
 * different vendor prefixes.
 *
 * @private
 * @type {Array<string>}
 */
const FULL_SCREEN_EVENTS = [
    'webkitfullscreenchange',
    'mozfullscreenchange',
    'fullscreenchange'
];

/**
 * The CSS class to apply to the root element of the conference so CSS can
 * modify the app layout.
 *
 * @private
 * @type {Object}
 */
const LAYOUT_CLASSNAMES = {
    [LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW]: 'horizontal-filmstrip',
    [LAYOUTS.TILE_VIEW]: 'tile-view',
    [LAYOUTS.VERTICAL_FILMSTRIP_VIEW]: 'vertical-filmstrip'
};

/**
 * The type of the React {@code Component} props of {@link Conference}.
 */
type Props = AbstractProps & {

    /**
     * Whether the local participant is recording the conference.
     */
    _iAmRecorder: boolean,

    /**
     * The CSS class to apply to the root of {@link Conference} to modify the
     * application layout.
     */
    _layoutClassName: string,

    /**
     * Name for this conference room.
     */
    _roomName: string,

    dispatch: Function,
    t: Function
}

/**
 * The conference page of the Web application.
 */
class Conference extends AbstractConference<Props, *> {
    _onFullScreenChange: Function;
    _onShowToolbar: Function;
    _originalOnShowToolbar: Function;

    /**
     * Initializes a new Conference instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Throttle and bind this component's mousemove handler to prevent it
        // from firing too often.
        this._originalOnShowToolbar = this._onShowToolbar;
        this._onShowToolbar = _.throttle(
            () => this._originalOnShowToolbar(),
            100,
            {
                leading: true,
                trailing: false
            });

        // Bind event handler so it is only bound once for every instance.
        this._onFullScreenChange = this._onFullScreenChange.bind(this);
        this.pendingUsers = [];
        this.admit_user;
        this.closeWboard;
    }

    /**
     * Start the connection and get the UI ready for the conference.
     *
     * @inheritdoc
     */
    componentDidMount() {
        document.title = `${this.props._roomName} | ${interfaceConfig.APP_NAME}`;
        this.props.dispatch(updateSettings({
            displayName:sessionStorage.name
        }));
        this._start();
        var _t = this;
        var interval = setInterval(function() {
            console.log('Interval is running!');
            if (typeof APP !== 'undefined' && APP.conference && APP.conference._room) {
                console.log('implemented the event');
                const socket = socketIOClient('https://meet.olecons.com');
                APP.conference._socket = socket;
                const room_id = APP.conference.roomName;
                console.log('This is your room id =>>>',room_id,socket.id);
                    socket.on("want_to_join", data => {
                        if(sessionStorage.isAdmin) {
                            _t.pendingUsers.push(data);
                            _t.askForJoin();
                            console.log('Request came but i am moderator!',_t);
                        }
                        console.log('Request came but i am not moderator!');
                    });
                    if(sessionStorage.socket_id != undefined && sessionStorage.user == undefined) {
                        console.log('Emited the replace_id event =>>>',room_id);
                        socket.emit('replace_id',{room:room_id,old_socket_id:sessionStorage.socket_id});
                    } else if(sessionStorage.user != undefined){
                        var waitForSocketId = setInterval(function() {
                            if(socket.id != undefined && socket.id != '') {
                                console.log('user =>>>>',user,socket.id);
                                var user = JSON.parse(sessionStorage.user);
                                user.id = socket.id;
                                user.user.socket_id = socket.id;
                                sessionStorage.user = JSON.stringify(user);
                                if(sessionStorage.isAdmin) {
                                    socket.emit('join',{id:room_id,name:sessionStorage.room_name},{id:user.user.id,socket_id:socket.id,name:user.user.name,presenter:true});
                                } else {
                                    socket.emit('join_room',{room:room_id, user:user.user, id:socket.id});
                                }
                                socket.on('user_joined', data => {
                                    console.log('User joined =>>>',data);
                                })
                                console.log('user =>>>> after update',user);
                                clearInterval(waitForSocketId);
                            }
                        },500);
                    }
                    socket.on('open',data => {
                        console.log('Request came open!');
                        sessionStorage.socket_id = socket.id;
                        socket.emit('info',room_id);
                    });
                    socket.on('info', data => {
                        console.log('info about the room =>>>>',data);
                        var admin = data.members.find(member => member.presenter);
                        sessionStorage.isAdmin = sessionStorage.isAdmin !== undefined && sessionStorage.isAdmin ? sessionStorage.isAdmin : admin && admin.id == socket.id ? true : false;
                        sessionStorage.room_name = data.name;
                        APP.conference._room.isAdmin = sessionStorage.isAdmin;
                        sessionStorage.user = sessionStorage.user == undefined ? JSON.stringify(data.members.find(member => member.id = socket.id)) : sessionStorage.user;
                        localStorage.isAdmin = sessionStorage.isAdmin;
                    })
                    clearInterval(interval);
                }
        },1000);
    }

    /**
     * Calls into legacy UI to update the application layout, if necessary.
     *
     * @inheritdoc
     * returns {void}
     */
    componentDidUpdate(prevProps) {
        if (this.props._shouldDisplayTileView
            === prevProps._shouldDisplayTileView) {
            return;
        }

        // TODO: For now VideoLayout is being called as LargeVideo and Filmstrip
        // sizing logic is still handled outside of React. Once all components
        // are in react they should calculate size on their own as much as
        // possible and pass down sizings.
        VideoLayout.refreshLayout();
    }

    /**
     * Disconnect from the conference when component will be
     * unmounted.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        APP.UI.unbindEvents();

        FULL_SCREEN_EVENTS.forEach(name =>
            document.removeEventListener(name, this._onFullScreenChange));

        APP.conference.isJoined() && this.props.dispatch(disconnect());
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            VIDEO_QUALITY_LABEL_DISABLED,

            // XXX The character casing of the name filmStripOnly utilized by
            // interfaceConfig is obsolete but legacy support is required.
            filmStripOnly: filmstripOnly
        } = interfaceConfig;
        const hideVideoQualityLabel
            = filmstripOnly
                || VIDEO_QUALITY_LABEL_DISABLED
                || this.props._iAmRecorder;

        return (
            <div
                className = { this.props._layoutClassName }
                id = 'videoconference_page'
                onMouseMove = { this._onShowToolbar }>
                <Notice />
                <Subject />
                <div id = 'videospace'>
                    <div id="w-board-wrapper" onClick={ ()=>{ this.closeWboard() } }>
                        <img src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAyMy4xLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCINCgkgdmlld0JveD0iMCAwIDMzOS4yIDMzOS4yIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCAzMzkuMiAzMzkuMjsiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPHN0eWxlIHR5cGU9InRleHQvY3NzIj4NCgkuc3Qwe2ZpbGw6I0ZGRkZGRjt9DQo8L3N0eWxlPg0KPGc+DQoJPHBhdGggY2xhc3M9InN0MCIgZD0iTTI0Ny4yLDE2OS42bDgzLjktODMuOWM1LjMtNS4zLDgtMTEuOCw4LTE5LjRjMC03LjYtMi43LTE0LjEtOC0xOS40TDI5Mi40LDhjLTUuMy01LjMtMTEuOC04LTE5LjQtOA0KCQljLTcuNiwwLTE0LjEsMi43LTE5LjQsOGwtODMuOSw4My45TDg1LjcsOGMtNS4zLTUuMy0xMS44LTgtMTkuNC04Yy03LjYsMC0xNC4xLDIuNy0xOS40LDhMOCw0Ni44Yy01LjMsNS4zLTgsMTEuOC04LDE5LjQNCgkJYzAsNy42LDIuNywxNC4xLDgsMTkuNGw4My45LDgzLjlMOCwyNTMuNWMtNS4zLDUuMy04LDExLjgtOCwxOS40YzAsNy42LDIuNywxNC4xLDgsMTkuNGwzOC44LDM4LjhjNS4zLDUuMywxMS44LDgsMTkuNCw4DQoJCWM3LjYsMCwxNC4xLTIuNywxOS40LThsODMuOS04My45bDgzLjksODMuOWM1LjMsNS4zLDExLjgsOCwxOS40LDhjNy42LDAsMTQuMS0yLjcsMTkuNC04bDM4LjgtMzguOGM1LjMtNS4zLDgtMTEuOCw4LTE5LjQNCgkJYzAtNy42LTIuNy0xNC4xLTgtMTkuNEwyNDcuMiwxNjkuNnoiLz4NCjwvZz4NCjwvc3ZnPg0K" />
                    </div>
                    <iframe src="" id="myId" width="100%" height="100%" position="relative"></iframe>
                    
                    <LargeVideo />
                    { hideVideoQualityLabel
                        || <Labels /> }
                    <Filmstrip filmstripOnly = { filmstripOnly } />
                    { this._renderJoinRequest() }
                </div>

                { filmstripOnly || <Toolbox /> }
                { filmstripOnly || <Chat /> }

                { this.renderNotificationsContainer() }

                <CalleeInfoContainer />
            </div>
        );
    }

    /**
     * Updates the Redux state when full screen mode has been enabled or
     * disabled.
     *
     * @private
     * @returns {void}
     */
    closeWboard()
    {
        document.getElementById("closeMyBoard").click();
    }
    _onFullScreenChange() {
        this.props.dispatch(fullScreenChanged(APP.UI.isFullScreen()));
    }
    _renderJoinRequest() {
        return (
            <div id="join-this-meeting" class="joinMeetingRequest hidden">
                <div class="modal-body">
                    <h2>Someone wants to join this meeting</h2>
                    <div class="sw_new_user">
                        <span class="sw_user_profile">J
                        </span>
                        <span class="sw_user_name">jhghgh</span>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="sw_deny btn jm_fancy-button" onClick={this.denyUser}>deny  </button> <button type="button" class="sw_allow btn jm_fancy-button" onClick={this.allowUser}>allow </button>
                </div>
            </div>
        )
    }

    allowUser = () => {
        console.log('allow user =>>>',this);
        APP.conference._socket.emit('allow_user', this.admit_user);
        $('#join-this-meeting').hide();
        if(this.pendingUsers.length) {
            setTimeout(() => {
                this.admit_user = null;
                this.askForJoin();
            }, 1000);
        } else {
            this.admit_user = null;
        }
    }

    denyUser = () => {
        APP.conference._socket.emit('deny_user', this.admit_user);
        $("#join-this-meeting").hide();
        if(this.pendingUsers.length) {
            setTimeout(() => {
                this.admit_user = null;
                this.askForJoin();
            }, 1000);
        } else {
            this.admit_user = null;
        }
    }

    askForJoin() {
        console.log('ask for join ->>>',this);
        if(!this.admit_user) {
            var data = this.pendingUsers.shift();
            console.log('inside the ask user ->>>>',data,sessionStorage.isAdmin);
            if(sessionStorage.isAdmin) {
                $("#join-this-meeting").show().removeClass('hidden');
            }
            this.admit_user = data;
            if(data.user.name && !data.user._name) {
                data.user._name = data.user.name;
            }
            $("#join-this-meeting .sw_user_profile").html(data.user._name.slice(0,1));
            $("#join-this-meeting .sw_user_name").html(data.user._name + ' <!--<i>Unverified</i>-->');
            // if(__alert.setSinkId) {
            //     __alert.setSinkId(setting.data.defaults.speaker).then(() => {
            //         __alert.play();
            //     });
            // } else {
            //     __alert.play();
            // }
            if(!(sessionStorage.meetingInfo != undefined && JSON.parse(sessionStorage.meetingInfo).permission)) {
                this.allowUser();
            }
        }
    }

    /**
     * Displays the toolbar.
     *
     * @private
     * @returns {void}
     */
    _onShowToolbar() {
        this.props.dispatch(showToolbox());
    }

    /**
     * Until we don't rewrite UI using react components
     * we use UI.start from old app. Also method translates
     * component right after it has been mounted.
     *
     * @inheritdoc
     */
    _start() {
        APP.UI.start();

        APP.UI.registerListeners();
        APP.UI.bindEvents();

        FULL_SCREEN_EVENTS.forEach(name =>
            document.addEventListener(name, this._onFullScreenChange));

        const { dispatch, t } = this.props;

        dispatch(connect());

        maybeShowSuboptimalExperienceNotification(dispatch, t);

        interfaceConfig.filmStripOnly
            && dispatch(setToolboxAlwaysVisible(true));
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code Conference} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const currentLayout = getCurrentLayout(state);
    const roomName = getBackendSafeRoomName(state['features/base/conference'].room);

    return {
        ...abstractMapStateToProps(state),
        _iAmRecorder: state['features/base/config'].iAmRecorder,
        _layoutClassName: LAYOUT_CLASSNAMES[currentLayout],
        _roomName: roomName
    };
}

export default reactReduxConnect(_mapStateToProps)(translate(Conference));
