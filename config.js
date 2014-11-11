var path = require('path');
var _ = require('lodash');

/**
 * Configuration
 * @param  {[type]} env (Example: ENV=development node server.js)
 * @return {[type]}     [description]
 */
module.exports = function(env) {

  var config = require('./config/environments.js');

  config.production = {
    "gmail" : {
      CLIENT_ID: process.env.G_CLIENT_ID,
      CLIENT_SECRET: process.env.G_CLIENT_SECRET,
      REDIRECT: process.env.G_REDIRECT
    },
    "redis" : process.env.REDISTOGO_URL,
    "host" : "localhost",
    "port" : process.env.PORT,
    "client_dir" : path.resolve(__dirname, './public'),
  }

  if (config.hasOwnProperty(env)) {
    return config[env];
  } else {
    console.log('Configuration not defined for enviornment: ' + env + ' defaulting to development.');
    return config['development'];
  }

}
