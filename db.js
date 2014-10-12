var config = require('./config')(process.env.ENV);

function Redis(){

  var redis_url = config.redis;

  var rtg   = require("url").parse(redis_url);
  var redis = require("redis").createClient(rtg.port, rtg.hostname);

  redis.auth(rtg.auth.split(":")[1]);

  return redis;

}

module.exports = Redis;
