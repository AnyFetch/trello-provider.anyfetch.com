/**
 * @file Defines the provider settings.
 *
 * Will set the path to Mongo, and applications id
 * Most of the configuration can be done using system environment variables.
 */

// Load environment variables from .env file
var dotenv = require('dotenv');
dotenv.load();

// node_env can either be "development" or "production"
var node_env = process.env.NODE_ENV || "development";

// Port to run the app on. 8000 for development
// (Vagrant syncs this port)
// 80 for production
var default_port = 8000;
if(node_env === "production") {
  default_port = 80;
}

// Exports configuration for use by app.js
module.exports = {
  env: node_env,
  port: process.env.PORT || default_port,

  trelloKey: process.env.TRELLO_API_KEY,
  trelloSecret: process.env.TRELLO_API_SECRET,
  trelloAppname: process.env.TRELLO_APPNAME,
  // Optional params



  providerUrl: process.env.PROVIDER_URL,
  appid: process.env.ANYFETCH_ID,
  appSecret: process.env.ANYFETCH_SECRET,
};
