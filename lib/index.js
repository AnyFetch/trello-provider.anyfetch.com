'use strict';

var OAuth = require('oauth').OAuth;
var CancelError = require('anyfetch-provider').CancelError;

var config = require('../config/configuration.js');

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
  if(!reqParams.oauth_token || !reqParams.oauth_verifier) {
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
        {accessToken: accessToken, callbackUrl: storedParams.callbackUrl}
      );
    });
  });
};



module.exports = {
  connectFunctions: {
    redirectToService: redirectToService,
    retrieveTokens: retrieveTokens
  },
  config: config
};
