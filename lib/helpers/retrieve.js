'use strict';
/**
 * @file Retrieve contacts for the account
 */

var async = require('async');
var Trello = require("node-trello");
var config = require('../../config/configuration.js');

/**
 * Retrieve all contacts associated with this user account,
 *
 * @param {String} accessToken AccessToken to identify the account
 * @param {Date} since Retrieve contacts updated since this date
 * @param {Function} cb Callback. First parameter is the error (if any), then an array of all the contacts.
 */
var retrieveCards = function(accessToken, since, cb) {
  var t = new Trello(config.trelloKey, accessToken);

  async.waterfall([
    function getBoards(cb) {
      t.get("1/members/my/boards", function(err, boards) {
        if(err) {
          return cb(err);
        }
        var boardIds = [];
        boards.forEach(function(board) {
          if(board.name !== 'Welcome Board') {
            boardIds.push(board.id);
          }
        });
        cb(null, boards);
      });
    },
    function getCards(boards, cb) {
      var options = {
        attachments: 'true',
        members: 'true',
        checklists: 'all',
        board: "true",
        list: 'true',
        actions: 'commentCard',
        fields: [
          'dateLastActivity',
          'desc',
          'labels',
          'name',
          'shortUrl',
        ],
        since: since
      };

      var urlArguments = Object.keys(options).map(function(key) {
        return key + '=' + encodeURIComponent(options[key]);
      }).join('&');

      var urls = boards.map(function(board) {
        return '/boards/' + board + '/cards?' + urlArguments;
      }).join(',');

      t.get("/1/batch", {urls: urls}, function(err, data) {
        if(err) {
          return cb(err);
        }
        var cards = [];
        data.forEach(function(res) {
          res['200'].forEach(function(card) {
            cards.push(card);
          });
        });
        cb(null, cards);
      });
    },
  ], cb);
};

/**
 * Download all cards from the specified Trello Account.
 *
 * @param {String} refreshToken Refresh_token to identify the account
 * @param {Date} since Retrieve contacts updated since this date
 * @param {Function} cb Callback. First parameter is the error (if any), second an array of all the cards.
 */
module.exports = retrieveCards;
