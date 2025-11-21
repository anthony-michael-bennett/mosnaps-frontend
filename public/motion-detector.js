// extending the canvas to get luminosity easier
// drawImageGrayscale can be used same as drawImage
CanvasRenderingContext2D.prototype.drawImageGrayscale = function () {
  var originalGlobalCompositeOperation = this.globalCompositeOperation;
  this.globalCompositeOperation = 'source-over'
  this.fillStyle = '#FFFFFF';
  this.fillRect(0, 0, this.canvas.width, this.canvas.height);
  this.globalCompositeOperation = 'luminosity';
  var retVal = this.drawImage.apply(this, arguments);
  this.globalCompositeOperation = originalGlobalCompositeOperation;
  return retVal;
};

function MotionDetector(video) {
  this.detectTimeout = null;
  this.width = 100
  this.height = 100;
  this.threshold = 64;
  this.delay = 1000;
  this.video = video;
  this.canvas = document.createElement('canvas');
  this.context = this.canvas.getContext('2d');
  this.camera = new Camera(video);
};


MotionDetector.prototype.start = function(callback) {
  var self = this;
  this.camera.on(function() {
    self.detect(callback);
  });
}

MotionDetector.prototype.stop = function () {
  this.camera.off();
  clearTimeout(this.detectTimeout);
}


// scale canvas for video to fit inside detector width and height
MotionDetector.prototype.scaleToVideo = function () {
  var w = this.video.videoWidth;
  var h = this.video.videoHeight;
  var canvas = this.canvas;
  var scale = Math.min(this.width / w, this.height / h);
  canvas.width = Math.floor(w * scale);
  canvas.height = Math.floor(h * scale);
  console.log(`MotionDetector:  canvas.width=${canvas.width}, canvas.height=${canvas.height}`)
};

MotionDetector.prototype.detect = function (callback) {
  var delay = this.delay;
  var prevPixels = null;
  var self = this;

  this.scaleToVideo();

  function iteration() {
    clearTimeout(self.detectTimeout); // make sure there's not another iteration set to run
    prevPixels = self.detectIteration(prevPixels, callback);
    self.detectTimeout = setTimeout(iteration, delay || 1000);
  }

  iteration();
}

MotionDetector.prototype.detectIteration = function (prevPixels, callback) {
  var video = this.video;
  var context = this.context;
  // max diff helps us to adjust threshold
  var elMaxDiff = document.getElementById('max-diff');

  // drawing grayscale to make diff faster only using one channel for luminosity
  context.drawImageGrayscale(video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, context.canvas.width, context.canvas.height);
  var frame = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
  var pixels = frame.data;

  // If this is the first frame, store it and return
  if (typeof prevPixels === "undefined" || prevPixels === null) {
    return pixels;
  }

  var maxDiff = 0;

  // Compare current frame with previous frame
  for (var i = 0; i < pixels.length; i += 4) {
    var diff = Math.abs(pixels[i] - prevPixels[i]);
    if (diff > maxDiff) {
      maxDiff = diff;
    }

    // If difference is greater than threshold, motion is detected
    if (diff > this.threshold) {
      // elMaxDiff.innerHTML = maxDiff;
      callback(video);
      break;
    }
  }

  elMaxDiff.innerHTML = maxDiff;

  // Store current frame for the next comparison
  return pixels;
};
