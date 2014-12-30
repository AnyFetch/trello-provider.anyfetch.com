'use strict';

var rarity = require('rarity');

var uploadCard = require('./helpers/upload.js');

module.exports.addition = function additionQueueWorker(job, cb) {
  uploadCard(job.task, job.anyfetchClient, job.serviceData.accessToken, cb);
};

module.exports.deletion = function deletionQueueWorker(job, cb) {
  job.anyfetchClient.deleteDocumentByIdentifier(job.task.identifier, rarity.slice(1, function(err) {
    // If the document has already been deleted
    if(err && err.toString().match(/expected 204 "No Content", got 404 "Not Found"/i)) {
      err = null;
    }

    cb(err);
  }));
};
