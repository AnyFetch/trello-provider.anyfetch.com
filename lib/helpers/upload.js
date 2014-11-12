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
    creation_date: card.dateLastActivity,
    modification_date: card.dateLastActivity,
    metadata: card,
    data: data,
    document_type: 'trellocard',
    actions: {
      'show': card.url
    },
    user_access: [anyfetchClient.accessToken]
  };

  delete card.metadata.id;
  delete card.metadata.url;
  delete card.metadata.title;
  delete card.metadata.modification_date;

  anyfetchClient.postDocument(card, rarity.slice(1, cb));
};
