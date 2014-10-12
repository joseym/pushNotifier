var redis_url = "redis://redistogo:c8a5c34ab6326a3eeb49e137b49b53d7@greeneye.redistogo.com:9927/";

var redis = require("redis")
  , rtg = require("url").parse(redis_url)
  , client = redis.createClient(rtg.port, rtg.hostname);

client.auth(rtg.auth.split(":")[1]);

client.set("test", "asdfasdf");

// This will return a JavaScript String
client.get("test", function (err, reply) {
    console.log(reply); // Will print `OK`
});
