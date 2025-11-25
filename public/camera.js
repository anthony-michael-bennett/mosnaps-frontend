function Camera(video) {
    this.video = video;
}

Camera.prototype.on = function(callback) {
  var self = this;
  navigator.mediaDevices.getUserMedia({ audio: false, video: true })
    .then(
        function (stream) {
            self.video.srcObject = stream;
            self.video.addEventListener('loadeddata', function () {
                video.play();
                callback(video);
            }, { "once" : true});
        },
        { "once": true }
    )
    .catch((error) => {
      console.error("Error accessing the camera: ", error);
    });
}

Camera.prototype.off = function() {
    var video = this.video;
    var tracks = video.srcObject.getTracks();
    for (var i = 0; i < tracks.length; i++) {
        tracks[i].stop();
    }
    video.srcObject = null;
};