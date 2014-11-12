#!/usr/bin/env node

/**
 * Some controversy over using globals, but I find they're dandy for
 * configuration and modules that are constantly required.
 *
 * Just be sure to namespace.
 *
 * @type {Object}
 */
GLOBAL.pushNotifier = {
  config : require('./config')(process.env.ENV),
  redis : require("redis"),
  _ : require('lodash'),
  clearScreen: function(){ process.stdout.write('\033c'); }
};

var config = GLOBAL.pushNotifier.config
  , rtg = require("url").parse(config.redis)
  , client = GLOBAL.pushNotifier.redis.createClient(rtg.port, rtg.hostname)
  , _ = GLOBAL.pushNotifier._
  , sprintf = require("sprintf-js").sprintf
;

client.auth(rtg.auth.split(":")[1]);

var Push = require('./push.js')
  , Gmail = require('./mailcheck.js')
;

var arguments = {
  query: process.argv[_.indexOf(process.argv, "-q") + 1] || null,
  clear: _.indexOf(process.argv, "-c") >= 0,
  pollRate: process.argv[_.indexOf(process.argv, "-t") + 1] || 5000
};

if(arguments.clear){
  client.del("code");
  client.del("token");
  client.del("expiration");
}

/**
 * Gmail check method
 * @type {Gmail}
 */
var Mail = new Gmail(arguments.query, client, arguments.pollRate);

Mail.on('verify', function(url){

  var p = new Push({
    // These values correspond to the parameters detailed on https://pushover.net/api
    // 'message' is required. All other values are optional.
    title: "Login",
    message: 'Please reauthenticate.',   // required
    url: url,
    url_title: 'Get Code',
    sound: 'bugle',
    device: 'iphone6',
    priority: 1
});

  p.on('success', function(res){
    console.log(res);
  });

  p.on('error', function(err){
    console.log('error', err);
  })

  p.send();

})

/**
 * Push an error
 * **********************************************
 * These will normally be due to an auth issue...
 * Need a way to handle that easily
 */
Mail.on('error', function(err){

  var p = new Push();

  p.on('success', function(res){
    console.error(err);
  });

  if(err.message){
    p.title('Check Error');
    p.sound('siren');
    p.message(JSON.stringify(err, ["code", "message", "arguments", "type", "name"]));

    p.send();
  }

});

/**
 * Found a new message
 * **********************************************
 * This will fire whenever the queue finds a message count that isn't the same
 * as the last firing.
 * If the count is the same then this will not fire, as the app assumes they
 * haven't been checked yet.
 */
Mail.on('new', function(count){

  GLOBAL.pushNotifier.clearScreen();

  var p = new Push();

  p.on('success', function(res){  });

  var message = (count > 1) ? sprintf("%1$d new messages", count) : sprintf("%1$d new message", count);
  console.log("Pushing \"%s\" to your device.", message)

  p.message(message);

  // p.url('googlegmail:///');

  p.send();

});


GLOBAL.pushNotifier.clearScreen();

Mail.Authenticate()
