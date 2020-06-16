export default function gainControl(action) {
    console.log(action);

    var p = APP.conference.getParticipantById('78323fc9')
    p._tracks[0].track
    $('audio').each((i, e) => { e.muted = true })

    var __stream  = new MediaStream();
    var audio = document.createElement('audio');
    // audio.srcObject = __stream;
    __stream.addTrack(p._tracks[0].track)
    $('body').append(audio);



    var context = new AudioContext(); 
    var gainNode = context.createGain();
    gainNode.gain.value = 1;

    // compress to avoid clipping
    var compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -30;
    compressor.knee.value = 40;
    compressor.ratio.value = 4;
    compressor.reduction.value = -10;
    compressor.attack.value = 0;
    compressor.release.value = 0.25;

    var destination = context.createMediaStreamDestination();

    var input = context.createMediaStreamSource(__stream); 

    input.connect(compressor); 
    compressor.connect(gainNode); 
    gainNode.connect( destination); 

    var audioTracks = destination.stream.getAudioTracks();

    // use a slider to alter the value of amplification dynamically
    var rangeElement = document.createElement('input');
    rangeElement.type = "range";
    rangeElement.min = 0;
    rangeElement.max = 3;
    rangeElement.value = 1;
    rangeElement.style.position = "fixed"
    rangeElement.style.zIndex = 10000
    rangeElement.style.top = 50
    $('body').append(rangeElement);
    rangeElement .addEventListener("input", function() {
        console.log(rangeElement.value)
        gainNode.gain.value = parseFloat(rangeElement .value); 
    }, false); 

    for (var i=0; i < audioTracks.length; i++) {  
        var ____stream = new MediaStream();
        ____stream.addTrack(audioTracks[i]);   
        audio.srcObject = ____stream;
        audio.play();
    }
}