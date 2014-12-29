'use strict';

var async = require('async');

var retrieveCards = require('./helpers/retrieve.js');

var defaultCursor = retrieveCards.defaultCursor;

module.exports = function updateAccount(serviceData, cursor, queues, cb) {
  // Retrieve all contacts since last call
  var newCursor = new Date();
  async.waterfall([
    function callRetrieveCards(cb) {
      retrieveCards(serviceData.accessToken, cursor || defaultCursor, cb);
    },
    function handleCards(cards, cb) {
      if(cards) {
        cards.forEach(function(card) {
          if(card.deleted) {
            if(cursor) {
              queues.deletion.push(card);
            }
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
