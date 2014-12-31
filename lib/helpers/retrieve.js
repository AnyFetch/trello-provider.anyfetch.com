'use strict';
/**
 * @file Retrieve cards for the account
 */

var async = require('async');
var rarity = require('rarity');
var Trello = require("node-trello");
var config = require('../../config/configuration.js');

var Entities = require('html-entities').AllHtmlEntities;
var entities = new Entities();


var identifierPrefix = 'trello-card/';

var defaultCursor = new Date('2008');

var cleanUp = function(rawCard) {
  var card = {};

  card.members = rawCard.members.map(function(member) {
    return member.fullName ? entities.decode(member.fullName) : "";
  });

  card.checklists = rawCard.checklists.map(function(checklist) {
    return {
      name: checklist.name ? entities.decode(checklist.name) : "",
      checkItems: checklist.checkItems.map(function(checkItem) {
        return {
          name: checkItem.name ? entities.decode(checkItem.name) : "",
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
        text: comment.data.text ? entities.decode(comment.data.text) : "",
        creator: comment.memberCreator.fullName ? entities.decode(comment.memberCreator.fullName) : ""
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
      name: label.name ? entities.decode(label.name) : "",
      color: label.color
    };
  });

  card.board = rawCard.board ? entities.decode(rawCard.board) : "";

  card.list = rawCard.list ? entities.decode(rawCard.list) : "";


  card.url = rawCard.shortUrl;

  card.identifier = identifierPrefix + rawCard.id;

  card.title = rawCard.name ? entities.decode(rawCard.name) : "";

  card.description = rawCard.desc ? entities.decode(rawCard.desc) : "";

  return card;
};


var retrieveBoards = function(accessToken, cb) {
  var t = new Trello(config.trelloKey, accessToken);

  var boardsName = {};
  var listsName = {};

  t.get("1/members/my/boards", {lists: 'all'}, function(err, boards) {
    if(err) {
      return cb(err);
    }
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
    cb(null, boardsName, listsName, boardIds);
  });
};
/**
 * Retrieve all cards associated with this user account,
 *
 * @param {String} accessToken AccessToken to identify the account
 * @param {Date} since Retrieve cards updated since this date
 * @param {Function} cb Callback. First parameter is the error (if any), then an array of all the cards.
 */
var retrieveCards = function(accessToken, since, cb) {
  var lastUpdated = defaultCursor;
  async.waterfall([
    function getBoards(cb) {
      retrieveBoards(accessToken, cb);
    },
    function getCards(boardsName, listsName, boards, cb) {
      var t = new Trello(config.trelloKey, accessToken);
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

      t.get("/1/batch", {urls: urls}, rarity.carry([boardsName, listsName], cb));
    },
    function parseCards(boardsName, listsName, data, cb) {
      var cards = [];
      if(data) {
        data.forEach(function(res) {
          res['200'].forEach(function(card) {
            // check last card date
            if(new Date(card.dateLastActivity) > lastUpdated) {
              lastUpdated = new Date(card.dateLastActivity);
            }
            // populate with list and board
            card.board = boardsName[card.idBoard];
            card.list = listsName[card.idList];
            cards.push(cleanUp(card));
          });
        });
      }
      cb(null, cards, Math.max(lastUpdated, since));
    }
  ], cb);
};

var retrieveDeletedCards = function(accessToken, since, cb) {
  if(since.getTime() === defaultCursor.getTime()) {
    return cb(null, [], defaultCursor);
  }

  var lastUpdated = defaultCursor;

  var t = new Trello(config.trelloKey, accessToken);

  async.waterfall([
    function getBoards(cb) {
      retrieveBoards(accessToken, cb);
    },
    function getDeletions(boardsName, listsName, boards, cb) {
      var options = {
        filter: ['deleteCard', 'updateList:closed', 'updateCard:closed'],
        fields: ['date', 'type', 'data'],
        since: since,
        limit: 1000,
        member: false,
        memberCreator: false
      };
      var urlArguments = Object.keys(options).map(function(key) {
        return key + '=' + encodeURIComponent(options[key]);
      }).join('&');

      var urls = boards.map(function(board) {
        return '/boards/' + board + '/actions?' + urlArguments;
      }).join(',');

      t.get("/1/batch", {urls: urls}, rarity.carry([boardsName, listsName], cb));
    },
    function parseCards(boardsName, listsName, data, cb) {
      var cardsToDelete = [];
      var listsToDelete = [];
      if(data) {
        data.forEach(function(res) {
          res['200'].forEach(function(deletion) {
            if(deletion.type === 'deleteCard' || deletion.type === 'updateCard') {
              // check last card date
              if(new Date(deletion.date) > lastUpdated) {
                lastUpdated = new Date(deletion.date);
              }
              cardsToDelete.push(identifierPrefix + deletion.data.card.id);
            }
            else {
              // It's a deleted list
              listsToDelete.push(deletion.data.list.id);
            }
          });
        });
      }
      cb(null, cardsToDelete, listsToDelete);
    },
    function getCardsFromLists(cardsToDelete, listsToDelete, cb) {
      if(listsToDelete.length > 0) {
        var options = {
          filter: 'all',
          fields: 'dateLastActivity'
        };
        var urlArguments = Object.keys(options).map(function(key) {
          return key + '=' + encodeURIComponent(options[key]);
        }).join('&');

        var urls = listsToDelete.map(function(list) {
          return '/lists/' + list + '/cards?' + urlArguments;
        }).join(',');

        t.get("/1/batch", {urls: urls}, rarity.carry([cardsToDelete], cb));
      }
      else {
        cb(null, cardsToDelete);
      }
    },

    function mergeCards(cardsToDelete, cardsFromLists, cb) {
      if(!cb) {
        cb = cardsFromLists;
        cardsFromLists = [];
      }
      if(cardsFromLists) {
        cardsFromLists.forEach(function(res) {
          res['200'].forEach(function(card) {
            // check last card date
            if(new Date(card.dateLastActivity) > lastUpdated) {
              lastUpdated = new Date(card.dateLastActivity);
            }
            cardsToDelete.push(identifierPrefix + card.id);
          });
        });
      }
      cb(null, cardsToDelete, Math.max(lastUpdated, since));
    }
  ], cb);
};

module.exports.retrieveCards = retrieveCards;
module.exports.retrieveDeletedCards = retrieveDeletedCards;
module.exports.defaultCursor = defaultCursor;
// For testing only
module.exports.cleanUp = cleanUp;
