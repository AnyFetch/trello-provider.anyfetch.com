'use strict';

var request = require('supertest');
require('should');

var app = require('../app.js');

describe("GET /init/connect", function() {
  it("should redirect to Trello", function(done) {
    request(app).get('/init/connect?code=123')
      .expect(302)
      .expect('Location', /trello\.com/)
      .end(done);
  });
});
