'use strict';

var async = require('async');

var retrieve = require('./helpers/retrieve.js');
var retrieveCards = retrieve.retrieveCards;
var retrieveDeletedCards = retrieve.retrieveDeletedCards;

var defaultCursor = retrieve.defaultCursor;


module.exports = function updateAccount(serviceData, cursor, queues, cb) {
  // Retrieve all contacts since last call
  var newCursor = new Date();
  async.parallel({
    newCards: function RetrieveNewCards(cb) {
      retrieveCards(serviceData.accessToken, cursor || defaultCursor, cb);
    },
    deletedCards: function RetrieveDeletedCards(cb) {
      retrieveDeletedCards(serviceData.accessToken, cursor || defaultCursor, cb);
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
