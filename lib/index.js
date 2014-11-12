'use strict';

var OAuth = require('oauth').OAuth;
var async = require("async");
var rarity = require("rarity");
var CancelError = require('anyfetch-provider').CancelError;

var config = require('../config/configuration.js');
var retrieveCards = require('./helpers/retrieve.js');
var uploadCard = require('./helpers/upload.js');

var requestURL = "https://trello.com/1/OAuthGetRequestToken";
var accessURL = "https://trello.com/1/OAuthGetAccessToken";
var authorizeURL = "https://trello.com/1/OAuthAuthorizeToken";

var redirectToService = function(callbackUrl, cb) {
  // Redirect user to provider consentment page
  var oauth = new OAuth(
    requestURL,
    accessURL,
    config.trelloKey,
    config.trelloSecret,
    "1.0",
    callbackUrl,
    "HMAC-SHA1"
  );
  oauth.getOAuthRequestToken(function(err, token, tokenSecret) {
    cb(
      err,
      authorizeURL + "?oauth_token=" + token + "&name=" + encodeURIComponent(config.trelloAppname),
      {token: token, tokenSecret: tokenSecret, callbackUrl: callbackUrl}
    );
  });
};

var retrieveTokens = function(reqParams, storedParams, cb) {
  if(!reqParams.oauth_token || reqParams.oauth_verifier) {
    return cb(new CancelError());
  }

  var oauth = new OAuth(
    requestURL,
    accessURL,
    config.trelloKey,
    config.trelloSecret,
    "1.0",
    storedParams.callbackUrl,
    "HMAC-SHA1"
  );
  var oauthToken = reqParams.oauth_token;
  var oauthVerifier = reqParams.oauth_verifier;
  var tokenSecret = storedParams.tokenSecret;
  oauth.getOAuthAccessToken(oauthToken, tokenSecret, oauthVerifier, function(err, accessToken, accessTokenSecret) {
    if(err) {
      return cb(err);
    }
    oauth.getProtectedResource("https://api.trello.com/1/members/me", "GET", accessToken, accessTokenSecret, function(err, data) {
      data = JSON.parse(data);
      cb(
        err,
        data.username,
        {accessToken: accessToken, accessTokenSecret: accessTokenSecret, callbackUrl: storedParams.callbackUrl}
      );
    });
  });
};

var updateAccount = function(serviceData, cursor, queues, cb) {
  // Retrieve all contacts since last call
  if(!cursor) {
    cursor = new Date(2008);
  }
  var newCursor = new Date();
  async.waterfall([
    function callRetrieveCards(cb) {
      retrieveCards(serviceData.tokens.access_token, cursor, cb);
    },
    function handleCards(cards, cb) {
      if(cards) {
        cards.forEach(function(card) {
          if(card.deleted) {
            queues.deletion.push(card);
          }
          else {
            queues.addition.push(card);
          }
        });
      }

      cb(null, newCursor);
    }
  ], cb);
};

var additionQueueWorker = function(job, cb) {
  uploadCard(job.task, job.anyfetchClient, job.serviceData.tokens.access_token, cb);
};

var deletionQueueWorker = function(job, cb) {
  job.anyfetchClient.deleteDocumentByIdentifier(job.task.url, rarity.slice(1, function(err) {
    if(err && err.toString().match(/expected 204 "No Content", got 404 "Not Found"/i)) {
      err = null;
    }

    cb(err);
  }));
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
