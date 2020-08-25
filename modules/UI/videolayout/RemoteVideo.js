/* global $, APP, interfaceConfig */

/* eslint-disable no-unused-vars */
import { AtlasKitThemeProvider } from '@atlaskit/theme';
import Logger from 'jitsi-meet-logger';
import React from 'react';
import ReactDOM from 'react-dom';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';

import { i18next } from '../../../react/features/base/i18n';
import {
    JitsiParticipantConnectionStatus
} from '../../../react/features/base/lib-jitsi-meet';
import {
    getPinnedParticipant,
    pinParticipant
} from '../../../react/features/base/participants';
import { PresenceLabel } from '../../../react/features/presence-status';
import {
    REMOTE_CONTROL_MENU_STATES,
    RemoteVideoMenuTriggerButton
} from '../../../react/features/remote-video-menu';
import { LAYOUTS, getCurrentLayout } from '../../../react/features/video-layout';
/* eslint-enable no-unused-vars */
import UIUtils from '../util/UIUtil';

import SmallVideo from './SmallVideo';

import * as bodyPix from '@tensorflow-models/body-pix';

const logger = Logger.getLogger(__filename);

/**
 *
 * @param {*} spanId
 */
function createContainer(spanId) {
    const container = document.createElement('span');

    container.id = spanId;
    container.className = 'videocontainer';
    
    var span_bg = spanId+'_virtual_bg';

    container.innerHTML = `
        <div class = 'videocontainer__background'></div>
        <canvas id="`+span_bg+`" class="person2" ></canvas>
        <div class = 'videocontainer__toptoolbar'></div>
        <div class = 'videocontainer__hoverOverlay'></div>
        <div class = 'videocontainer__toolbar'></div>
        <div class = 'displayNameContainer'></div>
        <div class = 'avatar-container'></div>
        <div class ='presence-label-container' style='display:none;'></div>
        <span class = 'remotevideomenu'></span>`;

    const remoteVideosContainer
        = document.getElementById('filmstripRemoteVideosContainer');
    const localVideoContainer
        = document.getElementById('localVideoTileViewContainer');

    remoteVideosContainer.insertBefore(container, localVideoContainer);

    return container;
}

/**
 *
 */
export default class RemoteVideo extends SmallVideo {
    /**
     * Creates new instance of the <tt>RemoteVideo</tt>.
     * @param user {JitsiParticipant} the user for whom remote video instance will
     * be created.
     * @param {VideoLayout} VideoLayout the video layout instance.
     * @constructor
     */
    _inputVideoElement: HTMLVideoElement;
      _segmentationData: Object;
      _bpModel: Object;
      _outputCanvasElement:HTMLCanvasElement;
    constructor(user, VideoLayout) {
        super(VideoLayout);

        this.user = user;
        this.id = user.getId();
        this.videoSpanId = `participant_${this.id}`;

        this._audioStreamElement = null;
        this._supportsRemoteControl = false;
        this.statsPopoverLocation = interfaceConfig.VERTICAL_FILMSTRIP ? 'left bottom' : 'top center';
        this.addRemoteVideoContainer();
        this.updateIndicators();
        this.updateDisplayName();
        this.bindHoverHandler();
        this.flipX = false;
        this.isLocal = false;
        this.popupMenuIsHovered = false;
        this._isRemoteControlSessionActive = false;
        this._inputVideoElement = document.createElement('video');
        this._inputVideoElement.id = this.id+'_newvideo';
        this._outputCanvasElement = '';
        /**
         * The flag is set to <tt>true</tt> after the 'canplay' event has been
         * triggered on the current video element. It goes back to <tt>false</tt>
         * when the stream is removed. It is used to determine whether the video
         * playback has ever started.
         * @type {boolean}
         */
        this._canPlayEventReceived = false;
        // this._bpModel = bodyPix.load({
        //     architecture: 'MobileNetV1',
        //     outputStride: 16,
        //     multiplier: 0.50,
        //     quantBytes: 2
        // });


        /**
         * The flag is set to <tt>true</tt> if remote participant's video gets muted
         * during his media connection disruption. This is to prevent black video
         * being render on the thumbnail, because even though once the video has
         * been played the image usually remains on the video element it seems that
         * after longer period of the video element being hidden this image can be
         * lost.
         * @type {boolean}
         */
        this.mutedWhileDisconnected = false;

        // Bind event handlers so they are only bound once for every instance.
        // TODO The event handlers should be turned into actions so changes can be
        // handled through reducers and middleware.
        this._requestRemoteControlPermissions
            = this._requestRemoteControlPermissions.bind(this);
        this._setAudioVolume = this._setAudioVolume.bind(this);
        this._stopRemoteControl = this._stopRemoteControl.bind(this);

        this.container.onclick = this._onContainerClick;
    }

    /**
     *
     */
    addRemoteVideoContainer() {
        this.container = createContainer(this.videoSpanId);
        this.$container = $(this.container);
        this.initializeAvatar();
        this._setThumbnailSize();
        this.initBrowserSpecificProperties();
        this.updateRemoteVideoMenu();
        this.updateStatusBar();
        // this.addAudioLevelIndicator();
        this.addPresenceLabel();

        return this.container;
    }

    /**
     * Checks whether current video is considered hovered. Currently it is hovered
     * if the mouse is over the video, or if the connection indicator or the popup
     * menu is shown(hovered).
     * @private
     * NOTE: extends SmallVideo's method
     */
    _isHovered() {
        return super._isHovered() || this.popupMenuIsHovered;
    }

    /**
     * Generates the popup menu content.
     *
     * @returns {Element|*} the constructed element, containing popup menu items
     * @private
     */
    _generatePopupContent() {
        if (interfaceConfig.filmStripOnly) {
            return;
        }

        const remoteVideoMenuContainer
            = this.container.querySelector('.remotevideomenu');

        if (!remoteVideoMenuContainer) {
            return;
        }

        const { controller } = APP.remoteControl;
        let remoteControlState = null;
        let onRemoteControlToggle;

        if (this._supportsRemoteControl
            && ((!APP.remoteControl.active && !this._isRemoteControlSessionActive)
                || APP.remoteControl.controller.activeParticipant === this.id)) {
            if (controller.getRequestedParticipant() === this.id) {
                remoteControlState = REMOTE_CONTROL_MENU_STATES.REQUESTING;
            } else if (controller.isStarted()) {
                onRemoteControlToggle = this._stopRemoteControl;
                remoteControlState = REMOTE_CONTROL_MENU_STATES.STARTED;
            } else {
                onRemoteControlToggle = this._requestRemoteControlPermissions;
                remoteControlState = REMOTE_CONTROL_MENU_STATES.NOT_STARTED;
            }
        }

        const initialVolumeValue = this._audioStreamElement && this._audioStreamElement.volume;

        // hide volume when in silent mode
        const onVolumeChange
            = APP.store.getState()['features/base/config'].startSilent ? undefined : this._setAudioVolume;
        const participantID = this.id;
        const currentLayout = getCurrentLayout(APP.store.getState());
        let remoteMenuPosition;

        if (currentLayout === LAYOUTS.TILE_VIEW) {
            remoteMenuPosition = 'left top';
        } else if (currentLayout === LAYOUTS.VERTICAL_FILMSTRIP_VIEW) {
            remoteMenuPosition = 'left top';
        } else {
            remoteMenuPosition = 'top center';
        }

        ReactDOM.render(
            <Provider store = { APP.store }>
                <I18nextProvider i18n = { i18next }>
                    <AtlasKitThemeProvider mode = 'dark'>
                        <RemoteVideoMenuTriggerButton
                            initialVolumeValue = { initialVolumeValue }
                            isAudioMuted = { this.isAudioMuted }
                            menuPosition = { remoteMenuPosition }
                            onMenuDisplay
                                = {this._onRemoteVideoMenuDisplay.bind(this)}
                            onRemoteControlToggle = { onRemoteControlToggle }
                            onVolumeChange = { onVolumeChange }
                            participantID = { participantID }
                            remoteControlState = { remoteControlState } />
                    </AtlasKitThemeProvider>
                </I18nextProvider>
            </Provider>,
            remoteVideoMenuContainer);
    }

    /**
     *
     */
    _onRemoteVideoMenuDisplay() {
        this.updateRemoteVideoMenu();
    }

    /**
     * Sets the remote control active status for the remote video.
     *
     * @param {boolean} isActive - The new remote control active status.
     * @returns {void}
     */
    setRemoteControlActiveStatus(isActive) {
        this._isRemoteControlSessionActive = isActive;
        this.updateRemoteVideoMenu();
    }

    /**
     * Sets the remote control supported value and initializes or updates the menu
     * depending on the remote control is supported or not.
     * @param {boolean} isSupported
     */
    setRemoteControlSupport(isSupported = false) {
        if (this._supportsRemoteControl === isSupported) {
            return;
        }
        this._supportsRemoteControl = isSupported;
        this.updateRemoteVideoMenu();
    }

    /**
     * Requests permissions for remote control session.
     */
    _requestRemoteControlPermissions() {
        APP.remoteControl.controller.requestPermissions(this.id, this.VideoLayout.getLargeVideoWrapper())
            .then(result => {
                if (result === null) {
                    return;
                }
                this.updateRemoteVideoMenu();
                APP.UI.messageHandler.notify(
                    'dialog.remoteControlTitle',
                    result === false ? 'dialog.remoteControlDeniedMessage' : 'dialog.remoteControlAllowedMessage',
                    { user: this.user.getDisplayName() || interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME }
                );
                if (result === true) {
                    // the remote control permissions has been granted
                    // pin the controlled participant
                    const pinnedParticipant = getPinnedParticipant(APP.store.getState()) || {};
                    const pinnedId = pinnedParticipant.id;

                    if (pinnedId !== this.id) {
                        APP.store.dispatch(pinParticipant(this.id));
                    }
                }
            }, error => {
                logger.error(error);
                this.updateRemoteVideoMenu();
                APP.UI.messageHandler.notify(
                    'dialog.remoteControlTitle',
                    'dialog.remoteControlErrorMessage',
                    { user: this.user.getDisplayName() || interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME }
                );
            });
        this.updateRemoteVideoMenu();
    }

    /**
     * Stops remote control session.
     */
    _stopRemoteControl() {
        // send message about stopping
        APP.remoteControl.controller.stop();
        this.updateRemoteVideoMenu();
    }

    /**
     * Change the remote participant's volume level.
     *
     * @param {int} newVal - The value to set the slider to.
     */
    _setAudioVolume(newVal) {
        if (this._audioStreamElement) {
            this._audioStreamElement.volume = newVal;
        }
    }

    /**
     * Updates the remote video menu.
     *
     * @param isMuted the new muted state to update to
     */
    updateRemoteVideoMenu(isMuted) {
        if (typeof isMuted !== 'undefined') {
            this.isAudioMuted = isMuted;
        }
        this._generatePopupContent();
    }

    /**
     * @inheritDoc
     * @override
     */
    setVideoMutedView(isMuted) {
        super.setVideoMutedView(isMuted);

        // Update 'mutedWhileDisconnected' flag
        this._figureOutMutedWhileDisconnected();
    }

    /**
     * Figures out the value of {@link #mutedWhileDisconnected} flag by taking into
     * account remote participant's network connectivity and video muted status.
     *
     * @private
     */
    _figureOutMutedWhileDisconnected() {
        const isActive = this.isConnectionActive();

        if (!isActive && this.isVideoMuted) {
            this.mutedWhileDisconnected = true;
        } else if (isActive && !this.isVideoMuted) {
            this.mutedWhileDisconnected = false;
        }
    }

    /**
     * Removes the remote stream element corresponding to the given stream and
     * parent container.
     *
     * @param stream the MediaStream
     * @param isVideo <tt>true</tt> if given <tt>stream</tt> is a video one.
     */
    removeRemoteStreamElement(stream) {
        if (!this.container) {
            return false;
        }

        const isVideo = stream.isVideoTrack();
        const elementID = SmallVideo.getStreamElementID(stream);
        const select = $(`#${elementID}`);

        select.remove();
        if (isVideo) {
            this._canPlayEventReceived = false;
        }

        logger.info(`${isVideo ? 'Video' : 'Audio'} removed ${this.id}`, select);

        if (stream === this.videoStream) {
            this.videoStream = null;
        }

        this.updateView();
    }

    /**
     * Checks whether the remote user associated with this <tt>RemoteVideo</tt>
     * has connectivity issues.
     *
     * @return {boolean} <tt>true</tt> if the user's connection is fine or
     * <tt>false</tt> otherwise.
     */
    isConnectionActive() {
        return this.user.getConnectionStatus() === JitsiParticipantConnectionStatus.ACTIVE;
    }

    /**
     * The remote video is considered "playable" once the can play event has been received. It will be allowed to
     * display video also in {@link JitsiParticipantConnectionStatus.INTERRUPTED} if the video has received the canplay
     * event and was not muted while not in ACTIVE state. This basically means that there is stalled video image cached
     * that could be displayed. It's used to show "grey video image" in user's thumbnail when there are connectivity
     * issues.
     *
     * @inheritdoc
     * @override
     */
    isVideoPlayable() {
        const connectionState = APP.conference.getParticipantConnectionStatus(this.id);

        return super.isVideoPlayable()
            && this._canPlayEventReceived
            && (connectionState === JitsiParticipantConnectionStatus.ACTIVE
                || (connectionState === JitsiParticipantConnectionStatus.INTERRUPTED && !this.mutedWhileDisconnected));
    }

    /**
     * @inheritDoc
     */
    updateView() {
        this.$container.toggleClass('audio-only', APP.conference.isAudioOnly());
        this.updateConnectionStatusIndicator();

        // This must be called after 'updateConnectionStatusIndicator' because it
        // affects the display mode by modifying 'mutedWhileDisconnected' flag
        super.updateView();
    }

    /**
     * Updates the UI to reflect user's connectivity status.
     */
    updateConnectionStatusIndicator() {
        const connectionStatus = this.user.getConnectionStatus();

        logger.debug(`${this.id} thumbnail connection status: ${connectionStatus}`);

        // FIXME rename 'mutedWhileDisconnected' to 'mutedWhileNotRendering'
        // Update 'mutedWhileDisconnected' flag
        this._figureOutMutedWhileDisconnected();
        this.updateConnectionStatus(connectionStatus);
    }

    /**
     * Removes RemoteVideo from the page.
     */
    remove() {
        super.remove();
        this.removePresenceLabel();
        this.removeRemoteVideoMenu();
    }

    /**
     *
     * @param {*} streamElement
     * @param {*} stream
     */
    waitForPlayback(streamElement, stream) {
        const webRtcStream = stream.getOriginalStream();
        const isVideo = stream.isVideoTrack();

        if (!isVideo || webRtcStream.id === 'mixedmslabel') {
            return;
        }

        const listener = () => {
            this._canPlayEventReceived = true;
            this.VideoLayout.remoteVideoActive(streamElement, this.id);
            streamElement.removeEventListener('canplay', listener);

            // Refresh to show the video
            this.updateView();
        };

        streamElement.addEventListener('canplay', listener);
    }

    /**
     *
     * @param {*} stream
     */
    addRemoteStreamElement(stream) {
        if (!this.container) {
            logger.debug('Not attaching remote stream due to no container');

            return;
        }

        const isVideo = stream.isVideoTrack();

        isVideo ? this.videoStream = stream : this.audioStream = stream;

        if (!stream.getOriginalStream()) {
            logger.debug('Remote video stream has no original stream');

            return;
        }

        let streamElement = SmallVideo.createStreamElement(stream, this.id);

        // Put new stream element always in front
        streamElement = UIUtils.prependChild(this.container, streamElement);

        $(streamElement).hide();

        this.waitForPlayback(streamElement, stream);
        stream.attach(streamElement);
        
        
      /*  var bpModel = setTimeout(function() {
                bodyPix.load({
                architecture: 'MobileNetV1',
                outputStride: 16,
                multiplier: 0.75,
                quantBytes: 2
            })
        });
        
        
        if(stream.isVideoTrack()) {
            var stream_element_id = SmallVideo.getStreamElementID(stream);
            //alert(stream_element_id); 
        }
        
        var video_element = document.getElementById(stream_element_id);
        
        var maskInProgress = true;
        var segmentationData = setTimeout(function() {  bpModel.segmentPerson(video_element, {
                // internalResolution: 'medium', // resized to 0.5 times of the original resolution before inference
                // maxDetections: 1, // max. number of person poses to detect per image
                // segmentationThreshold: 0.7 // represents probability that a pixel belongs to a person
                flipHorizontal:true,
                internalResolution:'medium',
                maxDetections: 1,
                segmentationThreshold:0.7
            })
        });
        
        
        var canvas_id = this.videoSpanId+'_virtual_bg';
                
        var firstVideoTrack = APP.conference.getParticipantById(this.id)._tracks[1].stream.getVideoTracks()[0];
        const { height, frameRate, width }
            = firstVideoTrack.getSettings ? firstVideoTrack.getSettings() : firstVideoTrack.getConstraints();
        
        setInterval(function() {
            var canvasPerson = document.getElementById(canvas_id);
            let contextPerson = canvasPerson.getContext('2d');

            var video_detail = document.getElementById(stream_element_id);

            contextPerson.drawImage(video_detail, 0, 0, '300', '300');
            var imageData = contextPerson.getImageData(0,0, '300', '300');
            var pixel = imageData.data;
            for (var p = 0; p<pixel.length; p+=4)
            {
                if (segmentationData.data[p/4] == 0) {
                    pixel[p+3] = 0;
                }
            }
            contextPerson.imageSmoothingEnabled = true;
            contextPerson.putImageData(imageData,0,0);
        }, 1000 / parseInt(frameRate, 10));
        
        document.getElementById(stream_element_id).hide();
        $('participant_'+this.id).find('.videocontainer__background').addClass('container1');
        */
        /*
        var video_custom = document.createElement('video');
        video_custom.id = this.id+'custom_video_stream';        
        
        var canvas_id = this.videoSpanId+'_virtual_bg';
        var video_element = this.id+'_video_virtual_bg';
        const canvasPerson = document.getElementById(canvas_id);
        let contextPerson = canvasPerson.getContext('2d');
        
        //setTimeout(function() {
            var video_detail = document.getElementsByClassName(video_element)[0];

            contextPerson.drawImage(streamElement, 0, 0, '300', '300');
            var imageData = contextPerson.getImageData(0,0, '300', '300');
            contextPerson.imageSmoothingEnabled = true;
            contextPerson.putImageData(imageData,0,0);
        //}, 10);
       
        video_custom.autoplay = true;
        video_custom.srcObject = stream.getOriginalStream();
        */
        /*
        video_custom.addEventListener('onloadeddata', function () {
            var $this = this; //cache
            (function loop() {
                if (!$this.paused && !$this.ended) {
                    contextPerson.drawImage($this, 0, 0);
                    setTimeout(loop, 1000 / 30); // drawing at 30fps
                }
            })();
        }, 0);
        */
        /*
        var video_detail = document.getElementsByClassName(video_element)[0];
        video_detail.onplay = function() {
            // Set the source of one <video> element to be a stream from another.
            var stream = video_detail.captureStream();
            video_custom.srcObject = stream;
            
        };
        */
        if(isVideo) {

            // streamElement.onloadeddata = () => {
            //      var firstVideoTrack = APP.conference.getParticipantById(this.id)._tracks[1].stream.getVideoTracks()[0];
            // var height =  firstVideoTrack.getSettings().height;
            // var width =  firstVideoTrack.getSettings().width;
            // streamElement.height=parseInt(height, 10);;
            // streamElement.width=parseInt(width, 10);;
            //     this._renderMask(streamElement)
            // }
        }

        if (!isVideo) {
            this._audioStreamElement = streamElement;

            // If the remote video menu was created before the audio stream was
            // attached we need to update the menu in order to show the volume
            // slider.
            this.updateRemoteVideoMenu();
        }
    }

    /**
     * Triggers re-rendering of the display name using current instance state.
     *
     * @returns {void}
     */

    async _renderMask(streamElement) {
        this._maskInProgress = true;
         this._bpModel = await bodyPix.load({
            architecture: 'MobileNetV1',
            outputStride: 16,
            multiplier: 0.50,
            quantBytes: 2
        });
        var firstVideoTrack = APP.conference.getParticipantById(this.id)._tracks[1].stream.getVideoTracks()[0];
       var frameRate = firstVideoTrack.getSettings ? firstVideoTrack.getSettings().frameRate : firstVideoTrack.getConstraints().frameRate;
        var THIS = this;
         $(streamElement).hide();
        var video_element =  streamElement;
        this._inputVideoElement = video_element;
       setInterval( async () => {
           ///  frameRate = firstVideoTrack.getSettings ? firstVideoTrack.getSettings().frameRate : firstVideoTrack.getConstraints().frameRate;
            this._maskInProgress = true;
            if(!this.maskInProgress){
                THIS._segmentationData = await THIS._bpModel.segmentPerson(THIS._inputVideoElement, {
                    // internalResolution: 'medium', // resized to 0.5 times of the original resolution before inference
                    // maxDetections: 1, // max. number of person poses to detect per image
                    // segmentationThreshold: 0.7 // represents probability that a pixel belongs to a person
                   // flipHorizontal:true,
                    internalResolution:'medium',
                    maxDetections: 1,
                    segmentationThreshold:0.7
                });
                THIS._maskInProgress = false;
                // var firstVideoTrack = APP.conference.getParticipantById(this.id)._tracks[1].stream.getVideoTracks()[0];
                // const { height, frameRate, width }
                //     = firstVideoTrack.getSettings ? firstVideoTrack.getSettings() : firstVideoTrack.getConstraints();
                var canvas_id = THIS.videoSpanId+'_virtual_bg';
                const { height, width }
                = firstVideoTrack.getSettings ? firstVideoTrack.getSettings() : firstVideoTrack.getConstraints();
                THIS._outputCanvasElement = document.getElementById(canvas_id);
                // THIS._outputCanvasElement.width = parseInt(height, 10);
                // THIS._outputCanvasElement.height = parseInt(width, 10);
                let contextPerson =  THIS._outputCanvasElement.getContext('2d');
                contextPerson.drawImage(THIS._inputVideoElement, 0, 0, streamElement.width, streamElement.height);
                var imageData = contextPerson.getImageData(0,0, streamElement.width, streamElement.height);
                var pixel = imageData.data;
                for (var p = 0; p<pixel.length; p+=4)
                {
                  if (THIS._segmentationData.data[p/4] == 0) {
                      pixel[p+3] = 0;
                  }
                }
                contextPerson.imageSmoothingEnabled = true;
                contextPerson.putImageData(imageData,0,0);
             }
        }, 1000 / parseInt(frameRate, 10));
      
       
        
        // this._outputCanvasElement.width = parseInt(width, 10);
        // this._outputCanvasElement.height = parseInt(height, 10);
        // this._inputVideoElement.width = parseInt(width, 10);
        // this._inputVideoElement.height = parseInt(height, 10);
        // this._inputVideoElement.autoplay = true;
        // this._inputVideoElement.srcObject = APP.conference.getParticipantById(this.id)._tracks[1].stream;
    }
    updateDisplayName() {
        if (!this.container) {
            logger.warn(`Unable to set displayName - ${this.videoSpanId} does not exist`);

            return;
        }

        this._renderDisplayName({
            elementID: `${this.videoSpanId}_name`,
            participantID: this.id
        });
    }

    /**
     * Removes remote video menu element from video element identified by
     * given <tt>videoElementId</tt>.
     *
     * @param videoElementId the id of local or remote video element.
     */
    removeRemoteVideoMenu() {
        const menuSpan = this.$container.find('.remotevideomenu');

        if (menuSpan.length) {
            ReactDOM.unmountComponentAtNode(menuSpan.get(0));
            menuSpan.remove();
        }
    }

    /**
     * Mounts the {@code PresenceLabel} for displaying the participant's current
     * presence status.
     *
     * @return {void}
     */
    addPresenceLabel() {
        const presenceLabelContainer = this.container.querySelector('.presence-label-container');

        if (presenceLabelContainer) {
            ReactDOM.render(
                <Provider store = { APP.store }>
                    <I18nextProvider i18n = { i18next }>
                        <PresenceLabel
                            participantID = { this.id }
                            className = 'presence-label' />
                    </I18nextProvider>
                </Provider>,
                presenceLabelContainer);
        }
    }

    /**
     * Unmounts the {@code PresenceLabel} component.
     *
     * @return {void}
     */
    removePresenceLabel() {
        const presenceLabelContainer = this.container.querySelector('.presence-label-container');

        if (presenceLabelContainer) {
            ReactDOM.unmountComponentAtNode(presenceLabelContainer);
        }
    }
}
