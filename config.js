var path = require('path');

/**
 * Configuration
 * @param  {[type]} env (Example: ENV=development node server.js)
 * @return {[type]}     [description]
 */
module.exports = function(env) {

  console.log();

  var config = require('./config/environments.js')

  if (config.hasOwnProperty(env)) {
    return config[env];
  } else {
    console.log('Configuration not defined for enviornment: ' + env + ' defaulting to development.');
    return config['development'];
  }

}
