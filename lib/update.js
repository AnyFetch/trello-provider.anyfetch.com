'use strict';

var async = require('async');

var retrieveCards = require('./helpers/retrieve.js');

module.exports = function updateAccount(serviceData, cursor, queues, cb) {
  // Retrieve all contacts since last call
  if(!cursor) {
    cursor = new Date('2008');
  }
  var newCursor = new Date();
  async.waterfall([
    function callRetrieveCards(cb) {
      retrieveCards(serviceData.accessToken, cursor, cb);
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
