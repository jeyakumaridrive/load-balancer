// @flow

import * as bodyPix from '@tensorflow-models/body-pix';

import {
    CLEAR_INTERVAL,
    INTERVAL_TIMEOUT,
    SET_INTERVAL,
    timerWorkerScript
} from './TimerWorker';

/**
 * Represents a modified MediaStream that adds virtual background to video background.
 * <tt>JitsiStreamVirtualBackgroundEffect</tt> does the processing of the original
 * video stream.
 */
export default class JitsiStreamVirtualBackgroundEffect {
    _bpModel: Object;
    _inputVideoElement: HTMLVideoElement;
    _onMaskFrameTimer: Function;
    _maskFrameTimerWorker: Worker;
    _maskInProgress: boolean;
    _outputCanvasElement: HTMLCanvasElement;
    _renderMask: Function;
    _segmentationData: Object;
    isEnabled: Function;
    startEffect: Function;
    stopEffect: Function;

    /**
     * Represents a modified video MediaStream track.
     *
     * @class
     * @param {BodyPix} bpModel - BodyPix model.
     */
    constructor(bpModel: Object) {
        this._bpModel = bpModel;

        // Bind event handler so it is only bound once for every instance.
        this._onMaskFrameTimer = this._onMaskFrameTimer.bind(this);

        // Workaround for FF issue https://bugzilla.mozilla.org/show_bug.cgi?id=1388974
        this._outputCanvasElement = document.createElement('canvas');
        const canvas = this._outputCanvasElement;
        this._outputCanvasElement.className = 'person';
        this._outputCanvasElement.getContext('2d');
        this._inputVideoElement = document.createElement('video');
        const img = document.getElementById('image_me');
        this._maskFrameTimerWorker = new Worker(timerWorkerScript, { name: 'Virtual Background effect worker' });
        this._maskFrameTimerWorker.onmessage = this._onMaskFrameTimer;
        
        
        // virtual bg code
        this._maskCanvasElement = document.createElement('canvas');
        this._videoFrameTimerWorker = new Worker(timerWorkerScript, { name: 'Virtual Background effect worker' });
        this.imageLoaded = false;
        this._secCanvasElement = document.createElement('canvas');
        this._secCanvasContext = this._secCanvasElement.getContext('2d');
    }

    /**
     * EventHandler onmessage for the maskFrameTimerWorker WebWorker.
     *
     * @private
     * @param {EventHandler} response - The onmessage EventHandler parameter.
     * @returns {void}
     */
    async _onMaskFrameTimer(response: Object) {
        if (response.data.id === INTERVAL_TIMEOUT) {
            if (!this._maskInProgress) {
                await this._renderMask();
            }
        }
    }

    /**
     * Loop function to render the background mask.
     *
     * @private
     * @returns {void}
     */
    async _renderMask() {
        this._maskInProgress = true;
        this._segmentationData = await this._bpModel.segmentPerson(this._inputVideoElement, {
            // internalResolution: 'medium', // resized to 0.5 times of the original resolution before inference
            // maxDetections: 1, // max. number of person poses to detect per image
            // segmentationThreshold: 0.7 // represents probability that a pixel belongs to a person
            flipHorizontal:true,
            internalResolution:'medium',
            maxDetections: 1,
            segmentationThreshold:0.7
        });
        this._maskInProgress = false;
        
        /*
        var background = new Image();
        background.src = "https://remotepc3.codertc.com/images/waterfall.jpg";
        let contextPerson =  this._outputCanvasElement.getContext('2d');
        // background.onload = function(){
        //     contextPerson.drawImage(background,0,0);   
        // }
       // contextPerson.fillRect(50,50,500,500); // something in the background
       
        contextPerson.drawImage(this._inputVideoElement, 0, 0, this._inputVideoElement.width, this._inputVideoElement.height);
        contextPerson.lineWidth = 2;
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
        $('#localVideoWrapper').addClass('container1');
        $('#largeVideoWrapper').addClass('container1');
        */
       
       
        // virtual bg code
        var width = this._segmentationData.width;
        var height = this._segmentationData.height;
        var data = this._segmentationData.data;
        this._maskCanvasContext.drawImage(this._inputVideoElement, 0, 0, width, height);
        let contextPerson =  this._outputCanvasElement.getContext('2d');
        this._secCanvasContext.drawImage(this._maskCanvasElement, 0, 0);
        if(this.imageLoaded) {
            for (var i = 0; i < height * width; ++i) {
                this._data_imgd[i * 4 + 3] = data[i] == 0 ? 255 : 0;
            }
            this._secCanvasContext.putImageData(this._data_img, 0, 0);
        }
        contextPerson.drawImage(this._maskCanvasElement, 0, 0);
        contextPerson.drawImage(this._secCanvasElement, 0, 0);
        contextPerson.restore();
       
        /*
        const imageElement = document.getElementById('remoteimage');

        //const net = await bodyPix.load();
        //const segmentation = await net.estimatePersonSegmentation(imageElement);

        const maskBackground = true;
        // Convert the personSegmentation into a mask to darken the background.
        const backgroundDarkeningMask = bodyPix.toMaskImageData(this._segmentationData, maskBackground);

        const opacity = 0.7;

        //const canvas = document.getElementById('canvas');
        // draw the mask onto the image on a canvas.  With opacity set to 0.7 this will darken the background.
        
        bodyPix.drawMask(
        this._outputCanvasElement, this._inputVideoElement, backgroundDarkeningMask, opacity);
        */

        // bodyPix.drawBokehEffect(
        //     contextPerson,
        //     this._inputVideoElement,
        //     this._segmentationData,
        //     1, // Constant for background blur, integer values between 0-20
        //     1 // Constant for edge blur, integer values between 0-20
        // );
    }

    /**
     * Checks if the local track supports this effect.
     *
     * @param {JitsiLocalTrack} jitsiLocalTrack - Track to apply effect.
     * @returns {boolean} - Returns true if this effect can run on the specified track
     * false otherwise.
     */
    isEnabled(jitsiLocalTrack: Object) {
        return jitsiLocalTrack.isVideoTrack() && jitsiLocalTrack.videoType === 'camera';
    }

    /**
     * Starts loop to capture video frame and render the segmentation mask.
     *
     * @param {MediaStream} stream - Stream to be used for processing.
     * @returns {MediaStream} - The stream with the applied effect.
     */
    startEffect(stream: MediaStream) {
        const firstVideoTrack = stream.getVideoTracks()[0];
        const { height, frameRate, width }
            = firstVideoTrack.getSettings ? firstVideoTrack.getSettings() : firstVideoTrack.getConstraints();

        this._outputCanvasElement.width = parseInt(width, 10);
        this._outputCanvasElement.height = parseInt(height, 10);
        this._inputVideoElement.width = parseInt(width, 10);
        this._inputVideoElement.height = parseInt(height, 10);
        this._inputVideoElement.autoplay = true;
        this._inputVideoElement.srcObject = stream;
        
        
        // virtual bg code
        this._maskCanvasElement.width = width;
        this._maskCanvasElement.height = height;
        
        console.log(server+window.$default_virtual_background_image);

        this._maskCanvasContext = this._maskCanvasElement.getContext('2d');
        this._ima = new Image();
        this._secCanvasContext.canvas.width = width;
        this._secCanvasContext.canvas.height = height;
        this._ima.addEventListener('load', e => {
            this.imageLoaded = true;
            this._secCanvasContext.drawImage(this._ima,0,0,width,height);
            this._data_img = this._secCanvasContext.getImageData(0,0,width,height);
            this._data_imgd = this._data_img.data;
            new Uint32Array(this._data_imgd.buffer);
        });
        //this._ima.src = "https://remotepc3.codertc.com/images/waterfall.jpg";
        this._ima.src = server+window.$default_virtual_background_image; //window.$default_virtual_background; 
        console.log(server+window.$default_virtual_background_image);
        
        this._videoFrameTimerWorker.postMessage({
            id: SET_INTERVAL,
            timeMs: 1000 / this._frameRate
        });
        this._maskFrameTimerWorker.postMessage({
            id: SET_INTERVAL,
            timeMs: 200
        });
        // end
        
        /*
        this._inputVideoElement.onloadeddata = () => {
            this._maskFrameTimerWorker.postMessage({
                id: SET_INTERVAL,
                timeMs: 1000 / parseInt(frameRate, 10)
            });
        };           
        */

        return this._outputCanvasElement.captureStream(parseInt(frameRate, 10));
    }

    /**
     * Stops the capture and render loop.
     *
     * @returns {void}
     */
    stopEffect() {
        this._maskFrameTimerWorker.postMessage({
            id: CLEAR_INTERVAL
        });
    }
}
