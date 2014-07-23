'use strict';
var qs = require('querystring');
var OAuth = require('oauth').OAuth;


/**
 * This object contains all the handlers to use for this provider
 */
var config = require('../config/configuration.js');

var requestURL = "https://trello.com/1/OAuthGetRequestToken";
var accessURL = "https://trello.com/1/OAuthGetAccessToken";
var authorizeURL = "https://trello.com/1/OAuthAuthorizeToken";


var redirectToService = function(callbackUrl, cb) {
  // Redirect user to provider consentment page
  var oauth = new OAuth(requestURL, accessURL, config.trelloKey, config.trelloSecret, "1.0", callbackUrl, "HMAC-SHA1");
  oauth.getOAuthRequestToken(function(err, token, tokenSecret){
    cb(err, authorizeURL + "?oauth_token=" + token + "&name=" + encodeURIComponent(config.trelloAppname), {token: token, tokenSecret: tokenSecret});
  });
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