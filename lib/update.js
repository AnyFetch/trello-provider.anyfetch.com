'use strict';

var async = require('async');

var retrieveCards = require('./helpers/retrieve.js').retrieveCards;
var retrieveDeletedCards = require('./helpers/retrieve.js').retrieveDeletedCards;


module.exports = function updateAccount(serviceData, cursor, queues, cb) {
  // Retrieve all contacts since last call
  var newCursor = new Date();
  async.parallel({
    newCards: function RetrieveNewCards(cb) {
      retrieveCards(serviceData.accessToken, cursor || new Date('2008'), cb);
    },
    deletedCards: function RetrieveDeletedCards(cb) {
      retrieveDeletedCards(serviceData.accessToken, cursor || new Date('2008'), cb);
    },
  }, function handleCards(err, cards) {
    if(err) {
      return cb(err);
    }
    cards.newCards.forEach(function(card) {
      queues.addition.push(card);
    });
    cards.deletedCards.forEach(function(card) {
      queues.deletion.push(card);
    });

    cb(null, newCursor);
  });
};
