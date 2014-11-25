"use strict";

// Load configuration and initialize server
var anyfetchProvider = require('anyfetch-provider');
var serverConfig = require('./lib/');

var server = anyfetchProvider.createServer(serverConfig.connectFunctions, __dirname + '/lib/workers.js', __dirname + '/lib/update.js', serverConfig.config);

// Expose the server
module.exports = server;
