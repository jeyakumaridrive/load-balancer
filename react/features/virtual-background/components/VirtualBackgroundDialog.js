// @flow

import React, { Component } from 'react';

/*import { getAvailableDevices } from '../../base/devices';*/
import { DialogWithTabs, Dialog, hideDialog } from '../../base/dialog';
import { connect } from '../../base/redux';

import { VIRTUAL_BACKGROUND_TABS, bpModel } from '../constants'; 

import VirtualBackgroundTab from './VirtualBackgroundTab';
import { getVirtulBackgroundTabProps, createbodypixModel } from '../functions';
import VideoVirtualBackgroundButton from './VideoVirtualBackgroundButton'; 
import { toggleVirtualBackgroundEffect, submitVirtualBackgroundTab } from '../actions';
import { createVideoVirtualBackgroundEvent, createVideoBlurEvent, sendAnalytics } from '../../analytics';


import * as bodyPix from '@tensorflow-models/body-pix';

import JitsiStreamVirtualBackgroundEffect from '../../stream-effects/virtual-background/JitsiStreamVirtualBackgroundEffect';
import {
    CLEAR_INTERVAL,
    INTERVAL_TIMEOUT,
    SET_INTERVAL,
    timerWorkerScript
} from '../../stream-effects/virtual-background/TimerWorker';

import { getLocalVideoTrack, getLocalTracks } from '../../base/tracks';

import VideoBlurButton from '../../blur'; 
import { toggleBlurEffect } from '../../blur/actions';


declare var APP: Object;
declare var interfaceConfig: Object;
  const constraints = window.constraints = {
   video: true
 };
/**
 * The type of the React {@code Component} props of
 * {@link ConnectedVirtualBackgroundDialog}.
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
     * True if the video background is blurred or false if it is not.
     */
    _isVideoBlurred: boolean,
    _isopen: boolean,

    /**
     * Invoked to save changed settings.
     */
    dispatch: Function
};

    function  handleSuccess(stream, timeout_settings) {
      
      const video = document.querySelector('#webcam');
      const videoTracks = stream.getVideoTracks();
      console.log('Got stream with constraints:', constraints);
      console.log(`Using video device: ${videoTracks[0].label}`);
      window.stream = stream; // make variable available to browser console
      video.srcObject = stream;
      $(video).get(0).play();
      $(video).hide();
      setTimeout(()=>{
        $('.startseg').click();
      },timeout_settings)
      // $(video).height($('#webcam').get()[0].height);
      // $(video).width($('#webcam').get()[0].width);

    }

    function handleError(error) {
      if (error.name === 'ConstraintNotSatisfiedError') {
        const v = constraints.video;
        errorMsg(`The resolution ${v.width.exact}x${v.height.exact} px is not supported by your device.`);
      } else if (error.name === 'PermissionDeniedError') {
        errorMsg('Permissions have not been granted to use your camera and ' +
          'microphone, you need to allow the page access to your devices in ' +
          'order for the demo to work.');
      }
      errorMsg(`getUserMedia error: ${error.name}`, error);
    }

    function errorMsg(msg, error) {
      const errorElement = document.querySelector('#errorMsg');
      errorElement.innerHTML += `<p>${msg}</p>`;
      if (typeof error !== 'undefined') {
        console.error(error);
      }
    }
    async function init(timeout_settings) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        handleSuccess(stream, timeout_settings);
      } catch (e) {
        handleError(e);
      }
    }
    function stopStreamedVideo(videoElem) {
      const stream = videoElem.srcObject;
      const tracks = stream.getTracks();

      tracks.forEach(function(track) {
        track.stop();
      });

      videoElem.srcObject = null;
    }


    

/**
 * A React {@code Component} for displaying a dialog to modify local settings
 * and conference-wide (moderator) settings. This version is connected to
 * redux to get the current settings.
 *
 * @extends Component
 */
class VirtualBackgroundDialog extends Component<Props> {
    _bpModel: Object;
    video: HTMLVideoElement;
    _onMaskFrameTimer: Function;
    _maskFrameTimerWorker: Worker;
    _maskInProgress: boolean;
    _outputCanvasElement: HTMLCanvasElement;
    _renderMask: Function;
    _segmentationData: Object;
    vb_preview_interval: Function;
    renderMask_interval: Function;
    //vb_stream: Object;
    previousSegmentationComplete: boolean;
    
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
        this.intervalnew = null;

        //this._bpModel = bpModel;

        // Bind event handler so it is only bound once for every instance.
      
        // Workaround for FF issue https://bugzilla.mozilla.org/show_bug.cgi?id=1388974
        this._outputCanvasElement = document.querySelector('#vb-preview');
        const canvas = this._outputCanvasElement;
        this._inputVideoElement = document.querySelector('#webcam');
                        

    }
    componentDidMount() { 
        if(APP.conference.isLocalVideoMuted() == true || APP.conference.isLocalVideoMuted() == 'true') {
            console.log(APP.conference.isLocalVideoMuted());
            APP.conference.muteVideo(false); 
            setTimeout(()=>{
                console.log(APP.conference.isLocalVideoMuted());
                init(2000);  
            },1000);
            
        }
        else {
            init(300);  
        }
          //init();  
          
            
          //const MOBILENET_BASE_URL = window.localStorage.getItem('virtual_bg_setting')+'tensorflow saved models js/';
          //this.loadModel();
          
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
        
        
        //onSubmit = { this._onSubmit } 
        return (
            <Dialog
                hideCancelButton = { true }
                okKey = 'dialog.enable'
                titleKey = 'settings.virtualbackground'                
                submitDisabled = { true }
                width = 'large'>
                <div className='virtual-background-section'>
                    <div class="modal-header">
                        <h4 class="modal-title">Choose Virtual Background</h4>
                        <a class="close-settings" onClick={() => this._closeDialog()} appearance="link">    
                            <img src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAyMy4xLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCINCgkgdmlld0JveD0iMCAwIDMzOS4yIDMzOS4yIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCAzMzkuMiAzMzkuMjsiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPHN0eWxlIHR5cGU9InRleHQvY3NzIj4NCgkuc3Qwe2ZpbGw6I0ZGRkZGRjt9DQo8L3N0eWxlPg0KPGc+DQoJPHBhdGggY2xhc3M9InN0MCIgZD0iTTI0Ny4yLDE2OS42bDgzLjktODMuOWM1LjMtNS4zLDgtMTEuOCw4LTE5LjRjMC03LjYtMi43LTE0LjEtOC0xOS40TDI5Mi40LDhjLTUuMy01LjMtMTEuOC04LTE5LjQtOA0KCQljLTcuNiwwLTE0LjEsMi43LTE5LjQsOGwtODMuOSw4My45TDg1LjcsOGMtNS4zLTUuMy0xMS44LTgtMTkuNC04Yy03LjYsMC0xNC4xLDIuNy0xOS40LDhMOCw0Ni44Yy01LjMsNS4zLTgsMTEuOC04LDE5LjQNCgkJYzAsNy42LDIuNywxNC4xLDgsMTkuNGw4My45LDgzLjlMOCwyNTMuNWMtNS4zLDUuMy04LDExLjgtOCwxOS40YzAsNy42LDIuNywxNC4xLDgsMTkuNGwzOC44LDM4LjhjNS4zLDUuMywxMS44LDgsMTkuNCw4DQoJCWM3LjYsMCwxNC4xLTIuNywxOS40LThsODMuOS04My45bDgzLjksODMuOWM1LjMsNS4zLDExLjgsOCwxOS40LDhjNy42LDAsMTQuMS0yLjcsMTkuNC04bDM4LjgtMzguOGM1LjMtNS4zLDgtMTEuOCw4LTE5LjQNCgkJYzAtNy42LTIuNy0xNC4xLTgtMTkuNEwyNDcuMiwxNjkuNnoiLz4NCjwvZz4NCjwvc3ZnPg0K" />
                        </a>
                    </div>
                    <div class="virtual-background-dialog">
                        <div class="virtual-background-dialog-contents">
                            <div class="vb-left virtual-background-preview">
                                <p class="vb-title virtual-background-preview-title">Preview</p>
                                <div class="virtual-background-preview">
                                 <video id="webcam" width="480" height="300" autoplay={true} playsinline></video>
                                    <div id="errorMsg" autoplay></div>
                                   
                                     <canvas width="480" height="300" class="vb-preview" id="vb-preview"></canvas>
                                </div>
                                <div class="virtual-background-buttons">
                                    <button type="button" class="vb-btn vb-enable-btn" onClick={() => this.enableVirtualBackground()}>Enable</button>
                                    <button type="button" class="vb-btn vb-cancel-btn" onClick={() => this._closeDialog()}>Cancel</button>
                                    <button type="button"  class="startseg" onClick={() => this.startEffect()}>preview</button>
                                </div>
                            </div>
                            <span class="border-line"></span>
                            <div class="vb-right virtual-background-images">
                                <p class="vb-title virtual-background-select-title">Select Virtual Background</p>
                                <div className={"virtual-background-selectable selected_bg1 " + ((window.$default_virtual_background_image == "/images/bg1.jpg") ? ' active ' : ' ')}  onClick={() => this.changeVirtualBackground("selected_bg1","images/bg1.jpg")}>
                                    <img src="images/bg1.jpg" alt="bg1" width="150" height="120"/>
                                    <i class="slctd-bg"></i> 
                                </div>
                                <div className={"virtual-background-selectable selected_bg2 " + ((window.$default_virtual_background_image == "/images/bg2.jpg") ? ' active ' : ' ')}  onClick={() => this.changeVirtualBackground("selected_bg2","images/bg2.jpg")}>
                                    <img src="images/bg2.jpg" alt="bg2" width="150" height="120"/>
                                    <i class="slctd-bg"></i>
                                </div>
                                <div className={"virtual-background-selectable selected_bg3 " + ((window.$default_virtual_background_image == "/images/bg3.jpg") ? ' active ' : ' ')}  onClick={() => this.changeVirtualBackground("selected_bg3","images/bg3.jpg")}>
                                    <img src="images/bg3.jpg" alt="bg3" width="150" height="120"/>
                                    <i class="slctd-bg"></i>
                                </div>
                                <div className={"virtual-background-selectable selected_bg4 " + ((window.$default_virtual_background_image == "/images/bg4.jpg") ? ' active ' : ' ')}  onClick={() => this.changeVirtualBackground("selected_bg4","images/bg4.jpg")}>
                                    <img src="images/bg4.jpg" alt="bg4" width="150" height="120"/>
                                    <i class="slctd-bg"></i>
                                </div>
                                <div className={"virtual-background-selectable selected_bg5 " + ((window.$default_virtual_background_image == "/images/bg5.jpg") ? ' active ' : ' ')}  onClick={() => this.changeVirtualBackground("selected_bg5","images/bg5.jpg")}>
                                    <img src="images/bg5.jpg" alt="bg5" width="150" height="120"/>
                                    <i class="slctd-bg"></i>
                                </div>
                                <div className={"virtual-background-selectable selected_bg6 " + ((window.$default_virtual_background_image == "/images/bg6.jpg") ? ' active ' : ' ')}  onClick={() => this.changeVirtualBackground("selected_bg6","images/bg6.jpg")}>
                                    <img src="images/bg6.jpg" alt="bg6" width="150" height="120"/>
                                    <i class="slctd-bg"></i>
                                </div>
                                <div className={"virtual-background-selectable selected_bg7 " + ((window.$default_virtual_background_image == "/images/bg7.jpg") ? ' active ' : ' ')}  onClick={() => this.changeVirtualBackground("selected_bg7","images/bg7.jpg")}>
                                    <img src="images/bg7.jpg" alt="bg7" width="150" height="120"/>
                                    <i class="slctd-bg"></i>
                                </div>
                                <div className={"virtual-background-selectable selected_bg8 " + ((window.$default_virtual_background_image == "/images/bg8.jpg") ? ' active ' : ' ')}  onClick={() => this.changeVirtualBackground("selected_bg8","images/bg8.jpg")}>
                                    <img src="images/bg8.jpg" alt="bg8" width="150" height="120"/>
                                    <i class="slctd-bg"></i>
                                </div>
                                <div className={"virtual-background-selectable selected_bg9 " + ((window.$default_virtual_background_image == "/images/bg9.jpg") ? ' active ' : ' ')}  onClick={() => this.changeVirtualBackground("selected_bg9","images/bg9.jpg")}>
                                    <img src="images/bg9.jpg" alt="bg9" width="150" height="120"/>
                                    <i class="slctd-bg"></i>
                                </div>
                                <div className={"virtual-background-selectable selected_bg10 " + ((window.$default_virtual_background_image == "/images/bg10.jpg") ? ' active ' : ' ')}  onClick={() => this.changeVirtualBackground("selected_bg10","images/bg10.jpg")}>
                                    <img src="images/bg10.jpg" alt="bg10" width="150" height="120"/>
                                    <i class="slctd-bg"></i>
                                </div>
                                <div className={"virtual-background-selectable selected_bg11 " + ((window.$default_virtual_background_image == "/images/bg11.jpg") ? ' active ' : ' ')}  onClick={() => this.changeVirtualBackground("selected_bg11","images/bg11.jpg")}>
                                    <img src="images/bg11.jpg" alt="bg11" width="150" height="120"/>
                                    <i class="slctd-bg"></i>
                                </div>
                                <div className={"virtual-background-selectable selected_bg12 " + ((window.$default_virtual_background_image == "/images/bg12.jpg") ? ' active ' : ' ')}  onClick={() => this.changeVirtualBackground("selected_bg12","images/bg12.jpg")}>
                                    <img src="images/bg12.jpg" alt="bg12" width="150" height="120"/>
                                    <i class="slctd-bg"></i>
                                </div>
                                <div className={"virtual-background-selectable selected_bg13 " + ((window.$default_virtual_background_image == "/images/bg13.jpg") ? ' active ' : ' ')}  onClick={() => this.changeVirtualBackground("selected_bg13","images/bg13.jpg")}>
                                    <img src="images/bg13.jpg" alt="bg13" width="150" height="120"/>
                                    <i class="slctd-bg"></i>
                                </div>
                                <div className={"virtual-background-selectable selected_bg14 " + ((window.$default_virtual_background_image == "/images/bg14.jpg") ? ' active ' : ' ')}  onClick={() => this.changeVirtualBackground("selected_bg14","images/bg14.jpg")}>
                                    <img src="images/bg14.jpg" alt="bg14" width="150" height="120"/>
                                    <i class="slctd-bg"></i>
                                </div>
                                <div className={"virtual-background-selectable selected_bg15 " + ((window.$default_virtual_background_image == "/images/bg15.jpg") ? ' active ' : ' ')}  onClick={() => this.changeVirtualBackground("selected_bg15","images/bg15.jpg")}>
                                    <img src="images/bg15.jpg" alt="bg15" width="150" height="120"/>
                                    <i class="slctd-bg"></i>
                                </div>
                                <div className={"virtual-background-selectable selected_bg16 " + ((window.$default_virtual_background_image == "/images/bg16.jpg") ? ' active ' : ' ')}  onClick={() => this.changeVirtualBackground("selected_bg16","images/bg16.jpg")}>
                                    <img src="images/bg16.jpg" alt="bg16" width="150" height="120"/>
                                    <i class="slctd-bg"></i>
                                </div>
                                <div className={"virtual-background-selectable selected_bg17 " + ((window.$default_virtual_background_image == "/images/bg17.jpg") ? ' active ' : ' ')}  onClick={() => this.changeVirtualBackground("selected_bg17","images/bg17.jpg")}>
                                    <img src="images/bg17.jpg" alt="bg17" width="150" height="120"/>
                                    <i class="slctd-bg"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>                
                { this.vb_preview() }
            </Dialog>    
                
        );
    }


    vb_preview() {
        $('#vb-preview').css('background-image', 'url('+window.user_selected_image+')');
    }
    
    
    async loadModel() {
        this._bpModel = await bodyPix.load({
            architecture: 'MobileNetV1',
            outputStride: 16,
            multiplier: 0.75,
            quantBytes: 2
        });
        
        console.log(this._bpModel);
        
    }

 
    async _renderMask() {
        //console.log('sss');
        //console.log(this._bpModel);
        this._inputVideoElement = document.querySelector('#webcam');

        this._maskInProgress = true;
        this._segmentationData = await this._bpModel.segmentPerson(this._inputVideoElement, {
            // internalResolution: 'medium', // resized to 0.5 times of the original resolution before inference
            // maxDetections: 1, // max. number of person poses to detect per image
            // segmentationThreshold: 0.7 // represents probability that a pixel belongs to a person
            flipHorizontal:false,
            internalResolution:'medium',
            maxDetections: 1,
            segmentationThreshold:0.7
        });
        this._maskInProgress = false;
        this._outputCanvasElement = document.querySelector('#vb-preview');
        let contextPerson =  this._outputCanvasElement.getContext('2d');

        contextPerson.drawImage(this._inputVideoElement, 0, 0, this._inputVideoElement.width, this._inputVideoElement.height);
        var imageData = contextPerson.getImageData(0,0, this._inputVideoElement.width, this._inputVideoElement.height);
        var pixel = imageData.data;
        for (var p = 0; p<pixel.length; p+=4)
        {
            if (this._segmentationData.data[p/4] == 0) {
                pixel[p+3] = 0;
            }
        }
        contextPerson.imageSmoothingEnabled = true;
        contextPerson.putImageData(imageData,0,0);
     //   $('#localVideoWrapper').addClass('container1');
       // $('#largeVideoWrapper').addClass('container1');
    }

    /**
     * Checks if the local track supports this effect.
     *
     * @param {JitsiLocalTrack} jitsiLocalTrack - Track to apply effect.
     * @returns {boolean} - Returns true if this effect can run on the specified track
     * false otherwise.
     */
   
    /**
     * Starts loop to capture video frame and render the segmentation mask.
     *
     * @param {MediaStream} stream - Stream to be used for processing.
     * @returns {MediaStream} - The stream with the applied effect.
     */
    async startEffect() {       

        this._isopen = true;             
        
        //console.log(window.bodyPixModel);
        
        this._bpModel = window.bodyPixModel;
        
        /*
        this._bpModel = await bodyPix.load({
            architecture: 'MobileNetV1',
            outputStride: 16,
            multiplier: 0.75,
            quantBytes: 2
        }); 
        */
        //console.log(this._bpModel);
        
        this._inputVideoElement = document.querySelector('#webcam');
        this._outputCanvasElement = document.querySelector('#vb-preview');
                     
        var THIS = this;    
        if(this._isopen == true) {
           this.intervalnew = setInterval( async () => {
             if (!THIS._maskInProgress) {
                    
                    await THIS._renderMask();
                }
         }, 1000 / parseInt(30, 10));
        }
          
    }

    /**
     * Stops the capture and render loop.
     *
     * @returns {void}
     */
    stopEffect() {
        clearInterval(this.intervalnew);
        this.intervalnew = null;
        this._isopen = false;
    }

    
    
    changeVirtualBackground(selected_div, virtual_background_image) { 
        $('.virtual-background-selectable').removeClass('active');
        var selected_image = '/'+virtual_background_image; 

        window.user_selected_image = selected_image;
        //window.$default_virtual_background = window.location.hostname+selected_image;
        //window.$default_virtual_background_image = selected_image;
         
        $('#vb-preview').css('background-image', 'url('+selected_image+')');
        
        //alert(window.$default_virtual_background); 
        $('.'+selected_div).addClass('active');
        
        /*
        if(virtual_background_image == "selected_bar_bg1" || virtual_background_image == "selected_bar_bg2") {
            $('.'+selected_div).parent().addClass('margin-top-28-neg');
            $('.'+adjacent_div).parent().addClass('margin-top-28-neg');
        }
        else {
            $('.'+selected_div).parent().addClass('margin-top-13-neg');
            $('.'+adjacent_div).parent().addClass('margin-top-13-neg');
        } */
        
        
        //console.log(VideoVirtualBackgroundButton._mapStateToProps(APP.store.getState()));
        //console.log(APP.store.getState()['features/virtual-background']);
        //console.log(APP.store.getState()['features/virtual-background'].virtualBackgroundEnabled);
        /*
        if(APP.store.getState()['features/virtual-background'].virtualBackgroundEnabled 
            && APP.store.getState()['features/virtual-background'].virtualBackgroundEnabled == true) {
            var { _isVideoVirtualBackground, dispatch } = this.props;
            
            //alert(APP.store.getState()['features/virtual-background'].virtualBackgroundEnabled);
            APP.store.getState()['features/virtual-background'].virtualBackgroundEnabled = false;
        
            _isVideoVirtualBackground = APP.store.getState()['features/virtual-background'].virtualBackgroundEnabled;
            // stop effect            
            var value = !_isVideoVirtualBackground; 
            //alert('value '+value);

            sendAnalytics(createVideoVirtualBackgroundEvent(value ? 'started' : 'stopped'));
            dispatch(toggleVirtualBackgroundEffect(value));
           
        }
        */
        
    }
    
    
    enableVirtualBackground() { 
        if(APP.conference.isLocalVideoMuted() == true || APP.conference.isLocalVideoMuted() == 'true') {
            APP.conference.muteVideo(false); 
        }
        
        // Set a cookie
        //$.cookie("virtual_background", selected_image);
        document.cookie = "virtual_background="+window.user_selected_image;
        
        window.$default_virtual_background = window.location.hostname+window.user_selected_image;
        window.$default_virtual_background_image = window.user_selected_image;
        
        this._closeDialog();
                
        
        
        // stop blur effect
        if(APP.store.getState()['features/blur'].blurEnabled 
            && APP.store.getState()['features/blur'].blurEnabled == true) {
            var { _isVideoBlurred, dispatch } = this.props;
            
            //alert(APP.store.getState()['features/blur'].blurEnabled);
            //APP.store.getState()['features/blur'].blurEnabled = false;
        
            _isVideoBlurred = APP.store.getState()['features/blur'].blurEnabled;
            // stop effect            
            var value_blur = !_isVideoBlurred; 
            //alert('value '+value);

            sendAnalytics(createVideoBlurEvent(value_blur ? 'started' : 'stopped'));
            dispatch(toggleBlurEffect(value_blur));
        }
        
        
        // change background if already enabled
        if(APP.store.getState()['features/virtual-background'].virtualBackgroundEnabled 
            && APP.store.getState()['features/virtual-background'].virtualBackgroundEnabled == true) {
            var { _isVideoVirtualBackground, dispatch } = this.props;
            
            //alert(APP.store.getState()['features/virtual-background'].virtualBackgroundEnabled);
            APP.store.getState()['features/virtual-background'].virtualBackgroundEnabled = false;
        
            _isVideoVirtualBackground = APP.store.getState()['features/virtual-background'].virtualBackgroundEnabled;
            // stop effect            
            var value = !_isVideoVirtualBackground; 
            //alert('value '+value);

            sendAnalytics(createVideoVirtualBackgroundEvent(value ? 'started' : 'stopped'));
            dispatch(toggleVirtualBackgroundEffect(value));
            
        }
        else {
            var { _isVideoVirtualBackground, dispatch } = this.props;
            _isVideoVirtualBackground = APP.store.getState()['features/virtual-background'].virtualBackgroundEnabled;
            // stop effect            
            var value = !_isVideoVirtualBackground; 
            //alert('value '+value);

            sendAnalytics(createVideoVirtualBackgroundEvent(value ? 'started' : 'stopped'));
            dispatch(toggleVirtualBackgroundEffect(value));
        }
    }
    
    

    

    _closeDialog: () => void;

    /**
     * Callback invoked to close the dialog without saving changes.
     *
     * @private
     * @returns {void}
     */
    _closeDialog() {
        this._inputVideoElement = document.querySelector('#webcam');

        if(window.user_selected_image != window.$default_virtual_background_image) {
            window.user_selected_image = window.$default_virtual_background_image;
        }

        clearInterval(this.vb_preview_interval);
        clearInterval(this.renderMask_interval);
        this.stopEffect();
        stopStreamedVideo(this._inputVideoElement);
        this.props.dispatch(hideDialog());
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code ConnectedVirtualBackgroundDialog} component.
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
    const showVirtualBackgroundSettings = configuredTabs.includes('virtualbackground');
    /*
    const showDeviceSettings = configuredTabs.includes('devices');
    const moreTabProps = getMoreTabProps(state);
    const { showModeratorSettings, showLanguageSettings } = moreTabProps;
    const showProfileSettings
        = configuredTabs.includes('profile') && jwt.isGuest;
    const showCalendarSettings
        = configuredTabs.includes('calendar') && isCalendarEnabled(state);
     */
    const tabs = [];
    
    // option to select or upload custom virtual background

    return { _tabs: tabs };
}

export default connect(_mapStateToProps)(VirtualBackgroundDialog);