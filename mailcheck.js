var util = require("util")
  , config = GLOBAL.pushNotifier.config
  , _ = GLOBAL.pushNotifier._
  , EventEmitter  = require("events").EventEmitter
  , google = require('googleapis')
  , OAuth2Client = google.auth.OAuth2
  , gmail = google.gmail('v1')
  , moment = require('moment')
;

var time_remaining;

var client;

function Check(q, redis){

  client = redis;

  EventEmitter.call(this);

  this.oauth2Client = new OAuth2Client(config.gmail.CLIENT_ID, config.gmail.CLIENT_SECRET, config.gmail.REDIRECT);
  this.error = null;
  this.q = q;

};

util.inherits(Check, EventEmitter);

Check.prototype.refreshAccessToken = function(token, cb) {

  console.log('Refreshing Access Token')

  var self = this;

  /**
   * Refresh Auth
   */
  client.get("token", function(err, access_token){
    if(!err){
      client.get("refresh", function(err, refresh_token){
        if(!err){

          self.oauth2Client.setCredentials({
            access_token: access_token,
            refresh_token: refresh_token
          });

          self.oauth2Client.refreshAccessToken(function(err, tokens){

            console.log(tokens);console.log();

            if(err){
              console.log(err);
              client.del("code");
              client.del("refresh");
              client.del("token");
              client.del("expiration");
              return self.getAccessToken(cb);
            } else {
              client.set("token", tokens.access_token);
              if(typeof tokens.refresh_token !== 'undefined') client.set("refresh", tokens.refresh_token);
              client.set("expiration", tokens.expiry_date);
              return self.getMessages(null);
            }

          })

        }
      })
    }
  })

}

Check.prototype.getAccessToken = function(callback) {

  console.log('Getting Access Token');

  var self = this;

  self.emit('token_error');

  // generate consent page url
  var url = this.oauth2Client.generateAuthUrl({
    access_type: 'offline', // will return a refresh token
    scope: 'https://mail.google.com/' // can be a space-delimited string or an array of scopes
  });

  client.get("refresh", function(err, refresh_token){

    if(!refresh_token) url += "&approval_prompt=force";

    console.log('Visit the url: ', url);

    self.emit('get_code', url)

    var poll = setInterval(function(){

      console.log("Looking for a new code");

      client.get("code", function(err, code){

        if(code) {

          clearInterval(poll)

          // request access token
          self.oauth2Client.getToken(code, function(err, tokens) {

            if(err) console.log(err);

            if(tokens){

              console.log(tokens);

              // set tokens to the client
              // TODO: tokens should be set by OAuth2 client.
              self.oauth2Client.setCredentials(tokens);

              client.set("token", tokens.access_token);
              if(typeof tokens.refresh_token !== 'undefined') client.set("refresh", tokens.refresh_token);
              client.set("expiration", tokens.expiry_date);

              client.del("code", function(err){
                self.getMessages(err);
              });

            }

          })

        }

      });

    }, 2000);

  })
}

var old = 0;
Check.prototype.getMessages = function(err){

  var self = this;

  if(err){
    return self.emit('error', err)
  } else {

    var messagePoll = setInterval(function(){

      client.get("expiration", function(err, exp){

        time_remaining = (moment(parseInt(exp)).diff(Date.now(), 'minutes'));

        // GLOBAL.pushNotifier.clearScreen();

        if(time_remaining < 5){
          client.get("token", function(err, token){
            if(token){
              self.refreshAccessToken(token, function(err){
                console.log('Refreshing token on ' + moment().format('MM/DD/YY [at] h:mma'));
                clearInterval(messagePoll);
                return self.getMessages(err);
              });
            }
          })
        }
      });

      if(typeof self.oauth2Client.credentials.access_token !== 'undefined'){

        gmail.users.messages.list({ userId: 'me', auth: self.oauth2Client, q: self.q }, function(err, messages) {

          if (err) {
            self.emit('error', err)
            return;
          }

          var count = messages.resultSizeEstimate;

          if(count !== old && count > 0) self.emit('new', count);

          old = count;

        });

      }

    }, 5000)

  }

}

Check.prototype.start = function(q){

  this.q = q || this.q;

  var self = this;

  client.get("token", function(err, token){

    if(!err && token && token != '') {
      self.refreshAccessToken(token, function(err){
        return self.getMessages(err);
      });
    } else {
      self.getAccessToken(self.getMessages(err));
    }

  });

}

module.exports = Check;
