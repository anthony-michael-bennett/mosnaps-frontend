function Camera(video) {
    this.video = video;
}

Camera.prototype.on = function(callback) {
  navigator.mediaDevices.getUserMedia({ audio: false, video: true })
    .then(
        function (stream) {
            this.video.srcObject = stream;
            this.video.addEventListener('loadeddata', function () {
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