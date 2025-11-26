function updateStorageEstimates() {
  var elLocalStorage = document.getElementById('local-storage');

  if (!navigator.storage || !navigator.storage.estimate) {
    console.log("StorageManager API not supported in this browser.");
    return null;
  }

  navigator.storage.estimate().then(function (estimate) {
    console.log(estimate);
    var estimates = {
      "storage_quota_mb": Math.round(estimate.quota / (1024 * 1024)),
      "storage_usage_mb": Math.round(estimate.usage / (1024 * 1024)),
      "storage_remaining_mb": Math.round((estimate.quota - estimate.usage) / (1024 * 1024))
    };

    elLocalStorage.innerHTML = '<p>Quota:' + estimates.storage_quota_mb + ' MB</p>' +
      '<p>Usage: ' + estimates.storage_usage_mb + ' MB</p>' +
      '<p>Remaining: ' + estimates.storage_remaining_mb + ' MB</p>';
  });
}