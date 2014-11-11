'use strict';

require('should');
var config = require('../config/configuration.js');

var cleanUp = require('../lib/helpers/retrieve.js').cleanUp;
var card = require('./card.json');

// Check data are retrieved from PROVIDER


describe('cleanUp', function() {
  it('should clean cards objects', function(done) {
    var cleanCard = cleanUp(card);
    cleanCard.should.have.properties([
      'title',
      'dateLastActivity',
      'labels',
      'actions',
      'checklists',
      'url',
      'title',
      'description'
    ]);

    done();
  });
});
