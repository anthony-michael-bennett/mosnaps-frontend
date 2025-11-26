// expects and container element .snaps-container to exist
function ImageSnaps() {
  this.canvas = document.createElement('canvas');
  this.context = this.canvas.getContext('2d');
  this.jpegQuality = 0.8;
  this.ui = this.setupUi();
  this.ui.modal = this.setupModal();
}

ImageSnaps.prototype.setupModal = function() {
  var modal = document.querySelector('#snaps-modal');
  if (modal) {
    return;
  }

  modal = document.createElement('div');
  modal.id = 'snaps-modal';
  document.querySelector('body').appendChild(modal);

  // role=button helps IOS understand click event on image
  modal.innerHTML = [
   '<div class="snaps-full">',
      '<span role="button"><img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" id="snaps-full-image"/></span>',
      '<p><span id="snaps-full-image-key"></span></p>',
      '<p>',
        '<button id="btn-snaps-modal-close">close</button>',
        '<button id="btn-snaps-modal-delete" class="red-button">delete</button>',
      '</p>',
    '</div>'
  ].join("\n");

  
  var btnDeleteImage = modal.querySelector('#btn-snaps-modal-delete');
  var btnFullpageClose = modal.querySelector('#btn-snaps-modal-close');
  var fullImage = modal.querySelector('#snaps-full-image');
  var fullImageKey = modal.querySelector('#snaps-full-image-key');
  var self = this;

  btnFullpageClose.addEventListener('click', function() {
    self.modalHide()
  });
  
  btnDeleteImage.addEventListener('click', function () {
    var imageKey = fullImageKey.innerText;
    self.deleteImage(imageKey);
  });

  fullImage.addEventListener('click', function() {
    self.modalHide();
  });

  return {
    'container': modal,
    'btnFullPageClose': btnFullpageClose,
    'btnDeleteImage': btnDeleteImage,
    'fullImage': fullImage,
    'fullImageKey': fullImageKey
  };
};

ImageSnaps.prototype.setupUi = function() {
var container = document.querySelector('.snaps-container');
  var self = this;

  container.innerHTML = [
    '<p class="controls">',
    '  <button id="btn-select-all">Select All</button>',
    '  <button id="btn-deselect-all">Deselect All</button>',
    '  <button id="btn-delete-selected" class="red-button">Delete</button>',
    '</p>',
    '<p>Usage: <span class="snaps-usage"></span> MB</p>',
    '<p>Count: <span class="snaps-count"></span></p>',
    '<ul class="snaps-list"></ul>'
  ].join("\n");

  var ui = {
    'container': container,
    'ul': container.querySelector('.snaps-list'),
    'spanUsage': container.querySelector('.snaps-usage'),
    'spanCount': container.querySelector('.snaps-count'),
    'btnSelectAll': container.querySelector('#btn-select-all'),
    'btnDeselectAll': container.querySelector('#btn-deselect-all'),
    'btnDeleteSelected': container.querySelector('#btn-delete-selected')
  };

  ui.btnSelectAll.addEventListener('click', function () {
    var checkboxes = ui.ul.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(function (checkbox) {
      checkbox.checked = true;
    });
  });

  ui.btnDeselectAll.addEventListener('click', function () {
    var checkboxes = ui.ul.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(function (checkbox) {
      checkbox.checked = false;
    });
  });

  // click fires once hower confirm fires multiple times.
  ui.btnDeleteSelected.addEventListener('click', function () {
    const userConfirmed = confirm("Are you sure you want to delete selected images?");
    if (!userConfirmed) {
      return;
    }
    var checkboxes = ui.ul.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(function (checkbox) {
      if (checkbox.checked) {
        var li = checkbox.parentElement.parentElement;
        var key = li.id;
        self.deleteImage(key, false); // we already confirmed. no need to prompt for each message
        //localStorage.removeItem(key);
      }
    });
    snaps.list();
    self.modalHide();
  });

  return ui;
};

ImageSnaps.prototype.getImageFromVideo = function (video) {
  var w = video.videoWidth;
  var h = video.videoHeight;
  var canvas = this.canvas;
  var context = this.context;

  if (canvas.width !== w) {
    canvas.width = w;
  }

  if (canvas.height !== h) {
    canvas.height = h;
  }

  context.drawImage(video, 0, 0, w, h);
  var imageDataURL = context.canvas.toDataURL('image/jpeg', this.jpegQuality);
  return imageDataURL;
};

ImageSnaps.prototype.snapImage = function (video, callback) {
  var imageDataURL = this.getImageFromVideo(video);
  var isoDateTime = (new Date()).toISOString();
  var storageKey = 'snap-' + isoDateTime;
  try {
    localStorage.setItem(storageKey, imageDataURL);
    callback(imageDataURL);
  } catch (err) {
    console.log(err);
  }
};

ImageSnaps.prototype.list = function (callback) {

  let totalUsage = 0;
  var keys = [];
  var snaps = [];

  for (let i = 0; i < localStorage.length; i++) {
    keys.push(localStorage.key(i));
  }

  keys.sort();

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = localStorage.getItem(key);
    if (isSnap(key)) {
      snaps.push(key);
      this.createThumbnail(key, value);
    }

    // Approximate size by summing the length of key and value strings
    totalUsage += (key.length + value.length);
  }

  // clear snaps that no longer exist in local storage
  this.removeThumbnailsNotInList(snaps);

  // Convert to KB for readability
  var usageMb = (totalUsage / (1024 * 1024)).toFixed(2);

  this.ui.spanCount.innerHTML = snaps.length;
  this.ui.spanUsage.innerHTML = usageMb;

  if (callback) {
    callback({ "usage": usageMb, "snaps": snaps });
  }
}

ImageSnaps.prototype.removeThumbnailsNotInList = function (snaps) {

  var el = this.ui.ul;
  var ids = [];
  for (let i = 0; i < el.children.length; i++) {
    ids.push(el.children[i].id);
  }

  for (let i = 0; i < ids.length; i++) {
    var id = ids[i];
    if (snaps.indexOf(id) === -1) {
      el.removeChild(document.getElementById(id));
    };
  }
};

ImageSnaps.prototype.createThumbnail = function (key, value) {

  if (document.getElementById(key) !== null) {
    // exists
    return;
  }
  var self = this;
  var el = this.ui.ul;

  var prefix = "snap";
  // I want elSnaps to keep prior snaps and not rewrite the entire thing. 
  var newItem = document.createElement('li');
  var newImg = document.createElement('img');
  var newP = document.createElement('p');

  newItem.id = key;

  var userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; // 'America/Los_Angeles'
  // console.log(Intl.supportedValuesOf('timeZone'))

  var localeDate = (new Date(key.substring(prefix.length + 1))).toLocaleString('en-US', { timeZone: userTimeZone });
  var localeTime = (new Date(key.substring(prefix.length + 1))).toLocaleTimeString('en-US', { timeZone: userTimeZone });
  var sizeMb = (value.length / (1024 * 1024)).toFixed(2);
  newP.innerHTML = '<input type="checkbox" /> ' + localeTime;
  newImg.addEventListener('click', function(event) {
    var key = event.currentTarget.parentElement.id;
    var src = event.currentTarget.src;
    self.modalShow(key, src);
  });

  newImg.title = localeDate + ' ' + sizeMb + ' MB';
  newImg.src = value;
  newItem.appendChild(newImg);
  newItem.appendChild(newP);
  el.appendChild(newItem);
};

ImageSnaps.prototype.deleteImage = function (key, confirmDelete=true) {
  if (confirmDelete) {
    const userConfirmed = confirm("Are you sure you want to delete?");
    if (!userConfirmed) {
      return;
    }
  }
  localStorage.removeItem(key);
  this.list();
  this.modalHide();
};

ImageSnaps.prototype.modalHide = function () {
  this.ui.modal.container.style.display = '';
};

ImageSnaps.prototype.modalShow = function(key, src) {
  this.ui.modal.fullImage.src = src;
  this.ui.modal.fullImageKey.innerText = key;
  this.ui.modal.container.style.display='block';
}