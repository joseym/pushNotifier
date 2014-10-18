#!/usr/bin/env node

var config = require('./config')(process.env.ENV)
  , redis = require("redis")
  , rtg = require("url").parse(config.redis)
  , client = redis.createClient(rtg.port, rtg.hostname)
  , _ = require('lodash')
;

client.auth(rtg.auth.split(":")[1]);

var Push = require('./push.js')
  , Gmail = require('./mailcheck.js')
  , sprintf = require("sprintf-js").sprintf
;

if(_.indexOf(process.argv, "clear") >= 0){

  client.del("code");
  client.del("token");
  client.del("expiration");
  // client.del("refresh");

}

function clearScreen(){ process.stdout.write('\033c'); }

var q = 'from:(alliebaldridge@gmail.com) is:unread';

/**
 * Gmail check method
 * @type {Gmail}
 */
var check = new Gmail(q, client);

check.on('get_code', function(url){

  console.log(process.argv);

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
check.on('error', function(err){

  var p = new Push();

  p.on('success', function(res){
    console.error(err);
    process.exit(1);
  });

  p.title('Check Error');
  p.sound('siren');
  p.message(err.message);

  p.send();

});

/**
 * Found a new message
 * **********************************************
 * This will fire whenever the queue finds a message count that isn't the same
 * as the last firing.
 * If the count is the same then this will not fire, as the app assumes they
 * haven't been checked yet.
 */
check.on('new', function(count){

  clearScreen();

  var p = new Push();

  p.on('success', function(res){  });

  var message = (count > 1) ?  sprintf("%1$d new messages", count) : sprintf("%1$b new message", count);
  console.log(sprintf("Pushing \"%s\" to your device.", message))

  p.message(message);

  p.send();

});


clearScreen();

check.start()
