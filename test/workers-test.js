'use strict';

require('should');
var sinon = require('sinon');

var workers = require('../lib/workers.js');

module.exports.addition = function(job, cb) {
  var spyPost = sinon.spy(job.anyfetchClient, "postDocument");

  try {
    job.task.should.have.property('url');
    job.task.should.have.property('identifier');
  } catch(e) {
    return cb(e);
  }

  workers.addition(job, function(err) {
    try {
      spyPost.callCount.should.eql(1);
      spyPost.restore();
    } catch(e) {
      return cb(e);
    }

    cb(err);
  });
};

module.exports.deletion = workers.deletion;
