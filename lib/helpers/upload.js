'use strict';

var rarity = require('rarity');

/**
 * Upload `card` (containing card data) onto AnyFetch.
 *
 *
 * @param {Object} contact Contact to upload, plus anyfetchClient
 * @param {Object} anyfetchClient Client for upload
 * @param {Object} accessToken Access token of the current account
 * @param {Object} contact Contact to upload, plus anyfetchClient
 * @param {Function} cb Callback to call once contacts has been uploaded.
 */
module.exports = function upload(card, anyfetchClient, accessToken, cb) {
  console.log("Uploading ", card.url);

  var data = {};

  // Build card "the right way"
  card = {
    identifier: card.identifier,
    creation_date: card.creationDate,
    modification_date: card.dateLastActivity,
    metadata: card,
    data: data,
    document_type: 'trello-card',
    actions: {
      'show': card.url
    },
    user_access: [anyfetchClient.accessToken]
  };

  // useless in metadata
  delete card.metadata.identifier;
  delete card.metadata.url;

  anyfetchClient.postDocument(card, rarity.slice(1, cb));
};
