'use strict';
/**
 * @file Retrieve cards for the account
 */

var async = require('async');
var Trello = require("node-trello");
var config = require('../../config/configuration.js');

var Entities = require('html-entities').AllHtmlEntities;
var entities = new Entities();


var cleanUp = function(rawCard) {
  var card = {};

  card.members = rawCard.members.map(function(member) {
    return member.fullName ? entities.decode(member.fullName) : undefined;
  });

  card.checklists = rawCard.checklists.map(function(checklist) {
    return {
      name: checklist.name ? entities.decode(checklist.name) : undefined,
      checkItems: checklist.checkItems.map(function(checkItem) {
        return {
          name: checkItem.name ? entities.decode(checkItem.name) : undefined,
          completed: checkItem.state === 'complete'
        };
      })
    };
  });

  card.comments = rawCard.actions
    .filter(function(action) {
      return action.type === 'commentCard';
    })
    .map(function(comment) {
      return {
        text: comment.data.text ? entities.decode(comment.data.text) : undefined,
        creator: comment.memberCreator.fullName ? entities.decode(comment.memberCreator.fullName) : undefined
      };
    });

  card.dateLastActivity = rawCard.dateLastActivity;

  rawCard.actions.forEach(function(action) {
    if(action.type === 'createCard') {
      card.creationDate = action.date;
    }
  });

  card.labels = rawCard.labels.map(function(label) {
    return {
      name: label.name ? entities.decode(label.name) : undefined,
      color: label.color
    };
  });

  card.board = rawCard.board ? entities.decode(rawCard.board) : undefined;

  card.list = rawCard.list ? entities.decode(rawCard.list) : undefined;


  card.url = rawCard.shortUrl;

  card.identifier = rawCard.shortUrl;

  card.title = rawCard.name ? entities.decode(rawCard.name) : undefined;

  card.description = rawCard.desc ? entities.decode(rawCard.desc) : undefined;

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

  var boardsName = {};
  var listsName = {};

  async.waterfall([
    function getBoards(cb) {
      t.get("1/members/my/boards", {lists: 'all'}, cb);
    },
    function cleanBoards(boards, cb) {
      var boardIds = [];
      boards.forEach(function(board) {
        if(board.name !== 'Welcome Board') {
          boardIds.push(board.id);
          boardsName[board.id] = board.name;
          board.lists.forEach(function(list) {
            listsName[list.id] = list.name;
          });
        }
      });
      cb(null, boardIds);
    },
    function getCards(boards, cb) {
      var options = {
        attachments: 'true',
        members: 'true',
        checklists: 'all',
        actions: ['commentCard', 'createCard'],
        fields: [
          'dateLastActivity',
          'desc',
          'labels',
          'name',
          'shortUrl',
          'idList',
          'idBoard'
        ],
        since: since
      };

      var urlArguments = Object.keys(options).map(function(key) {
        return key + '=' + encodeURIComponent(options[key]);
      }).join('&');

      var urls = boards.map(function(board) {
        return '/boards/' + board + '/cards?' + urlArguments;
      }).join(',');

      t.get("/1/batch", {urls: urls}, cb);
    },
    function parseCards(data, cb) {
      var cards = [];
      if(data) {
        data.forEach(function(res) {
          res['200'].forEach(function(card) {
            // populate with list and board
            card.board = boardsName[card.idBoard];
            card.list = listsName[card.idList];
            cards.push(cleanUp(card));
          });
        });
      }
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
