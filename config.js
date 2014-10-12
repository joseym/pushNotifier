var path = require('path');

/**
 * Configuration
 * @param  {[type]} env (Example: ENV=development node server.js)
 * @return {[type]}     [description]
 */
module.exports = function(env) {

  var config =  {
      "development" : {
        "host" : "localhost",
        "port" : 5555,
        "client_dir" : path.resolve(__dirname, './public'),
      }
    , "production" : {
        "host" : "localhost",
        "port" : process.env.PORT,
        "client_dir" : path.resolve(__dirname, './public'),
      }
  }

  if (config.hasOwnProperty(env)) {
    return config[env];
  } else {
    console.log('Configuration not defined for enviornment: ' + env + ' defaulting to development.');
    return config['development'];
  }

}
