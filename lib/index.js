'use strict';
/**
 * This object contains all the handlers to use for this provider
 */

var config = require('../config/configuration.js');

var redirectToService = function(callbackUrl, cb) {
  // Redirect user to provider consentment page
  cb(null, 'http://PROVIDER.com', {some: 'data'});
};

var retrieveTokens = function(reqParams, storedParams, cb) {
  // Store new data
  cb(null, 'accountName', {some: "data"});
};

var updateAccount = function(serviceData, cursor, queues, cb) {
  // Update documents from provider
  // You may define this as an helper function
  // this function is pinged on update, with the data stored by retrieveTokens()
  // You can do queues.worker_name.push(task)
  cb(null, new Date());
};

var additionQueueWorker = function(job, cb) {
  // Send data to AnyFetch.
  // You may define this as an helper function
  // Job is an item with your task, an anyfetch client, and data stored by retrieveTokens()
  cb(null);
};

var deletionQueueWorker = function(job, cb) {
  // Delete data from AnyFetch.
  // You may define this as an helper function
  // Job is an item with your task, an anyfetch client, and data stored by retrieveTokens()
  cb(null);
};

module.exports = {
  connectFunctions: {
    redirectToService: redirectToService,
    retrieveTokens: retrieveTokens
  },
  updateAccount: updateAccount,
  workers: {
    addition: additionQueueWorker,
    deletion: deletionQueueWorker
  },

  config: config
};