'use strict';
/**
 * @file Retrieve cards for the account
 */

var async = require('async');
var Trello = require("node-trello");
var config = require('../../config/configuration.js');


var cleanUp = function(rawCard) {
  var card = {};

  card.members = rawCard.members.map(function(member) {
    return member.fullName;
  });

  card.checklists = rawCard.checklists.map(function(checklist) {
    return {
      name: checklist.name,
      checkItems: checklist.checkItems.map(function(checkItem) {
        return {
          name: checkItem.name,
          completed: checkItem.state === 'complete'
        };
      })
    };
  });

  card.comments = rawCard.actions.map(function(action) {
    return {
      text: action.data.text,
      creator: action.memberCreator.fullName
    };
  });

  card.labels = rawCard.labels.map(function(label) {
    return {
      name: label.name,
      color: label.color
    };
  });

  card.dateLastActivity = rawCard.dateLastActivity;

  card.url = rawCard.shortUrl;

  card.identifier = rawCard.shortUrl;

  card.title = rawCard.name;

  card.description = rawCard.desc;

  // TODO: handle attachements
  // card.attachments = rawCard.attachments;

  return card;
};

/**
 * Retrieve all cards associated with this user account,
 *
 * @param {String} accessToken AccessToken to identify the account
 * @param {Date} since Retrieve cards updated since this date
 * @param {Function} cb Callback. First parameter is the error (if any), then an array of all the cards.
 */
var retrieveCards = function(accessToken, since, cb) {
  var t = new Trello(config.trelloKey, accessToken);

  async.waterfall([
    function getBoards(cb) {
      t.get("1/members/my/boards", cb);
    },
    function cleanBoards(boards, cb) {
      var boardIds = [];
      boards.forEach(function(board) {
        if(board.name !== 'Welcome Board') {
          boardIds.push(board.id);
        }
      });
      cb(null, boardIds);
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
        if(data) {
          data.forEach(function(res) {
            res['200'].forEach(function(card) {
              cards.push(cleanUp(card));
            });
          });
        }
        cb(null, cards);
      });
    },
    function removeArchivedCards(cards, cb) {
      cb(null, cards);
    }
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

// For testing only
module.exports.cleanUp = cleanUp;
