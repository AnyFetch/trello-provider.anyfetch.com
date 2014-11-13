'use strict';

require('should');

var config = require('../config/configuration.js');
var retrieve = require('../lib/helpers/retrieve.js');

var cleanUp = require('../lib/helpers/retrieve.js').cleanUp;
var card = require('./raw-card.json');


describe("Retrieve code", function() {
  it("should list cards", function(done) {
    retrieve(config.testAccessToken, new Date('2008'), function(err, cards) {
      if(err) {
        throw err;
      }

      cards.should.have.lengthOf(2);
      cards[0].should.have.property('dateLastActivity', '2014-11-11T09:52:00.085Z');
      cards[0].should.have.property('identifier', 'https://trello.com/c/qJWgjteJ');
      cards[0].should.have.property('board', 'Test Trello Provider');
      cards[0].should.have.property('title', 'Testing card');
      cards[0].should.have.property('description', '');
      cards[0].should.have.property('list', 'Test 1');
      cards[0].should.have.property('checklists', []);
      cards[0].should.have.property('comments', []);
      cards[0].should.have.property('members', []);
      cards[0].should.have.property('labels', []);

      done();
    });
  });

  it("should list cards modified after specified date", function(done) {
    retrieve(config.testAccessToken, new Date(2020, 7, 22), function(err, cards) {
      if(err) {
        throw err;
      }

      cards.should.have.lengthOf(0);
      done();
    });
  });
});


describe('cleanUp', function() {
  it('should clean cards objects', function(done) {
    var cleanCard = cleanUp(card);
    cleanCard.should.have.properties([
      'title',
      'dateLastActivity',
      'labels',
      'members',
      'comments',
      'checklists',
      'url',
      'description',
      'identifier',
      'creationDate'
    ]);

    cleanCard.creationDate.should.be.eql("2014-11-11T09:52:07.217Z");

    cleanCard.comments.should.have.lengthOf(2);
    cleanCard.comments[0].should.have.properties(['text', 'creator']);

    cleanCard.checklists.should.have.lengthOf(1);
    cleanCard.checklists[0].should.have.properties(['name', 'checkItems']);

    cleanCard.labels.should.have.lengthOf(1);
    cleanCard.labels[0].should.have.properties(['name', 'color']);

    done();
  });
});
