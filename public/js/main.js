function onLoad(callback) {
  if (document.readyState === "interactive" || document.readyState === "complete") {
    callback();
  } else {
    document.addEventListener("DOMContentLoaded", callback, { once: true });
  }
}

function isSnap(key) {
  var prefix = 'snap';
  return key.substring(0, prefix.length) === prefix;
}

var snaps = new ImageSnaps();

onLoad(function () {
  console.log('onLoad ' + new Date());
  moTabsSetup();
  snaps.list();

  var btnCameraOn = document.getElementById('btn-camera-on');
  var btnCameraOff = document.getElementById('btn-camera-off');
  var video = document.getElementById('video');
  var imgSnapLast = document.getElementById('img-snap-last');
  var canvasMotionDetector = document.getElementById('canvas-motion-detector');
  var motionDetector = new MotionDetector(video, canvasMotionDetector);

  // Hiding the camera for now and instead showing the motion detection canvas.
  video.style.display='none';

  // max diff helps us to adjust threshold
  var elMaxDiff = document.getElementById('max-diff');

  btnCameraOn.addEventListener('click', function () {

    motionDetector.start(function(motionData) {

      elMaxDiff.innerHTML = motionData.maxDiff;

      if (motionData.motionDetected) {
        snaps.snapImage(video, function(imageDataURL) {
          // Not sure if we should show last snap since snaps already appear
          // in the snaps list.
          // imgSnapLast.src=imageDataURL;
          snaps.list();
          updateStorageEstimates();
        });
      }

    });

  });

  btnCameraOff.addEventListener('click', function () {
    //moSnapsStop();
    motionDetector.stop();
  });

});