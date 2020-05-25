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
import { finishedLoading } from '../../../app';

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
        var user = sessionStorage.user;
        if(sessionStorage.user != undefined && sessionStorage.user != '') {
            user = JSON.parse(user);
            this.props.dispatch(updateSettings({
                displayName: user.firstname != undefined ? user.firstname : user._name
            }));
        }
        this._start();
        var _t = this;
        var interval = setInterval(function() {
            console.log('Interval is running!');
            if (typeof APP !== 'undefined' && APP.conference && APP.conference._room) {
                console.log('implemented the event');
                let { parentApi, server, deploymentInfo } = APP.store.getState()['features/base/config'];
                if(!server) {server = {}};
                const socket = socketIOClient(parentApi);
                APP.conference._socket = socket;
                const room_id = APP.conference.roomName;
                console.log('This is your room id =>>>',room_id,socket.id);
                    socket.on("want_to_join", data => {
                        if(APP.conference._room.isAdmin) {
                            _t.pendingUsers.push(data);
                            _t.askForJoin();
                            console.log('Request came but i am moderator!',_t);
                        }
                        console.log('Request came but i am not moderator!');
                    });
                    var waitForSocketId = setInterval(function() {
                        if(socket.id != undefined && socket.id != '' && user != undefined && user != '') {
                            console.log('user =>>>>',user,socket.id);
                            socket.on('connect', () => {
                                socket.emit('join',{id:room_id,name:sessionStorage.room_name, domain: server.domain, latency: server.latency, media_server: deploymentInfo.userRegion},{id:user.id,socket_id:socket.id,name:user.firstname != undefined ? user.firstname : user._name});
                            });
                            socket.emit('join',{id:room_id,name:sessionStorage.room_name, domain: server.domain, latency: server.latency, media_server: deploymentInfo.userRegion},{id:user.id,socket_id:socket.id,name:user.firstname != undefined ? user.firstname : user._name});
                            socket.on('user_joined', data => {
                                console.log('User joined =>>>',data);
                            });
                            console.log('user =>>>> after update',user);
                            sessionStorage.isAdmin = false;
                            // APP.conference._room.isAdmin = '';
                            localStorage.isAdmin = false;
                            $.get(`${parentApi}/api/v1/get-meeting-by-slug?slug=${room_id}`).then((meeting) => {
                                if(meeting.user_id == user.id) {
                                    sessionStorage.isAdmin = true;
                                    APP.conference._room.isAdmin = true;
                                    localStorage.isAdmin = true;
                                }
                                else
                                {
                                    sessionStorage.isAdmin = false;
                                    APP.conference._room.isAdmin = false;
                                    localStorage.isAdmin = false; 
                                }
                            }).catch(() => { console.log('Forbidden, Not Real User')});
                            //now remove the loader from the meetolecons server
                            _t.props.dispatch(finishedLoading());
                            clearInterval(waitForSocketId);
                        }
                    },500);
                    socket.on('open',data => {
                        console.log('Request came open!');
                        sessionStorage.socket_id = socket.id;
                        socket.emit('info',room_id);
                    });
                    socket.on('info', data => {
                        console.log('info about the room =>>>>',data);
                        sessionStorage.room_name = data.name;
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
            <div id="join-this-meeting" className="joinMeetingRequest hidden">
                <div className="modal-body">
                    <h2>Someone wants to join this meeting</h2>
                    <div className="sw_new_user">
                        <span className="sw_user_profile">J
                        </span>
                        <span className="sw_user_name">jhghgh</span>
                    </div>
                </div>
                <div className="modal-footer">
                    <button type="button" className="sw_deny btn jm_fancy-button" onClick={this.denyUser}>deny  </button> <button type="button" className="sw_allow btn jm_fancy-button" onClick={this.allowUser}>allow </button>
                </div>
            </div>
        )
    }

    allowUser = () => {
        console.log('allow user =>>>',this.admit_user);
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
        if(!this.admit_user) {
            var data = this.pendingUsers.shift();
            if(sessionStorage.meetingInfo != undefined && JSON.parse(sessionStorage.meetingInfo).permission) {
                $("#join-this-meeting").show().removeClass('hidden');
                document.getElementById('hidden-jitsi-audio').play();
            }
            this.admit_user = data;
            if(!data.user.firstname) { data.user.firstname = data.user.name }
            $("#join-this-meeting .sw_user_profile").html(data.user.firstname.slice(0,1));
            $("#join-this-meeting .sw_user_name").html(data.user.firstname + ' <!--<i>Unverified</i>-->');
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
