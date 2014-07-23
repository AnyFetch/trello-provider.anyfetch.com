'use strict';

var request = require('supertest');
require('should');

var app = require('../app.js');

describe("GET /init/connect", function () {
  it("should redirect to PROVIDER", function (done) {
    request(app).get('/init/connect?code=123')
      .expect(302)
      .expect('Location', /PROVIDER\.com/)
      .end(done);
  });
});
