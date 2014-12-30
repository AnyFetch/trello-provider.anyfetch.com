'use strict';

var async = require('async');

var retrieve = require('./helpers/retrieve.js');
var retrieveCards = retrieve.retrieveCards;
var retrieveDeletedCards = retrieve.retrieveDeletedCards;

var defaultCursor = retrieve.defaultCursor;


module.exports = function updateAccount(serviceData, cursor, queues, cb) {
  // Retrieve all contacts since last call
  async.parallel({
    newCards: function RetrieveNewCards(cb) {
      retrieveCards(serviceData.accessToken, cursor || defaultCursor, cb);
    },
    deletedCards: function RetrieveDeletedCards(cb) {
      retrieveDeletedCards(serviceData.accessToken, cursor || defaultCursor, cb);
    },
  }, function handleCards(err, cardsAndDates) {
    if(err) {
      return cb(err);
    }

    var newCursor = new Date(Math.max(cardsAndDates.newCards[1], cardsAndDates.deletedCards[1]));
    cardsAndDates.newCards[0].forEach(function(card) {
      queues.addition.push(card);
    });
    cardsAndDates.deletedCards[0].forEach(function(card) {
      queues.deletion.push(card);
    });

    cb(null, newCursor);
  });
};
