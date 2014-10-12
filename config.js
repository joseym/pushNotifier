var path = require('path');

/**
 * Configuration
 * @param  {[type]} env (Example: ENV=development node server.js)
 * @return {[type]}     [description]
 */
module.exports = function(env) {

  var config =  {
      "development" : {
        "redis" : "redis://redistogo:c8a5c34ab6326a3eeb49e137b49b53d7@greeneye.redistogo.com:9927/",
        "host" : "localhost",
        "port" : 5555,
        "client_dir" : path.resolve(__dirname, './public'),
      }
    , "production" : {
        "redis" : "redis://redistogo:c8a5c34ab6326a3eeb49e137b49b53d7@greeneye.redistogo.com:9927/",
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
