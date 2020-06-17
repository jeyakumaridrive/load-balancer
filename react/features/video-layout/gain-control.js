export default function gainControl(action) {
    return new Promise((resolve, reject) => {

        var __stream = new MediaStream(); // action.track.jitsiTrack.stream // real stream
        __stream.addTrack(action.track.jitsiTrack.track) // real track
        
        var context = new AudioContext(); 
        var gainNode = context.createGain();
        gainNode.gain.value = 2;
    
        // compress to avoid clipping
        var compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -30;
        compressor.knee.value = 40;
        compressor.ratio.value = 4;
        if(compressor.reduction && compressor.reduction.value) {
            compressor.reduction.value = -10;
        }
        compressor.attack.value = 0;
        compressor.release.value = 0.25;
    
        var destination = context.createMediaStreamDestination();
    
        var input = context.createMediaStreamSource(__stream); 
    
        input.connect(compressor); 
        compressor.connect(gainNode); 
        gainNode.connect( destination); 
    
        
        window.changeGain = function(value) {
            gainNode.gain.value = value;
        }
        
        var audioTracks = destination.stream.getAudioTracks();
        audioTracks.forEach(audioTrack => {
            // setTimeout(() => {
                $('#participant_'+action.track.participantId+' audio')[0].muted  = true;
                $('#participant_'+action.track.participantId+' audio')[0].volume  = 0;
                var audio = document.createElement('audio')  
                var stream = new MediaStream();
                stream.addTrack(audioTrack);
                audio.srcObject = stream;
                audio.play();
                $('body').append(audio);
            // }, 2000);
        })
        // for (var i=0; i < audioTracks.length; i++) {
            
        //     $('#participant_'+action.track.participantId+' audio')[0].muted  = true;

        //     var audio = document.createElement('audio')  
        //     var stream = new MediaStream();
        //     stream.addTrack(audioTracks[i]);
        //     audio.srcObject = stream;
        //     audio.play();
        //     $('body').append(audio);
        //     // action.track.jitsiTrack.stream.removeTrack(action.track.jitsiTrack.stream.getAudioTracks()[0]);
        //     // action.track.jitsiTrack.stream.addTrack(audioTracks[i]);
        // }

        resolve(action);
    });
    
}