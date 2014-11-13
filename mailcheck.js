var util = require("util")
  , loop = require('./looper')
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

var old = 0;

function Check(q, redis, polling){

  client = redis;

  EventEmitter.call(this);

  this.oauth2Client = new OAuth2Client(config.gmail.CLIENT_ID, config.gmail.CLIENT_SECRET, config.gmail.REDIRECT);
  this.error = null;
  this.q = q;
  this.polling = parseInt(polling) || 5000;
  this.backoff = false;


};

util.inherits(Check, EventEmitter);

/**
 * =============================================================================
 * 	To keep things easier to follow I have extracted many of the callback
 *  features into their own methods below.
 * =============================================================================
 */

/**
 * "Found Emails" handler
 * @found `Check.getMessages`
 *
 * This method decides what to after getting a response from google for emails.
 */
function listEmails(err, messages) {

  var self = this;

  if (err) {
    if(parseInt(err.code) == 429 || parseInt(err.code) == 403) {
      util.debug('Hit Rate Limit. Starting exponential backoff...');
      self.backoff = true;
    }
    return self.emit('error', err);
  }

  self.backoff = false;

  var count = messages.resultSizeEstimate;

  if(count !== old && count > 0) self.emit('new', count);

  old = count;

};

/**
 * "Update Token" handler
 * @found `Check.refreshAccessToken`
 *
 * This method decides if a token can be refreshed or if a new one needs to be
 * generated.
 */
function initiateTokenRefresh(err, tokens){

  var self = this;

  if(err){
    util.debug('Token Refresh Error: ' + err);
    client.del("code");
    client.del("refresh");
    client.del("token");
    client.del("expiration");
    return self.getAccessToken(cb);
  } else {
    if(typeof tokens.refresh_token !== 'undefined') client.set("refresh", tokens.refresh_token);
    client.set("token", tokens.access_token);
    client.set("expiration", tokens.expiry_date);
    return self.getMessages(null);
  }

};

/**
 * "new/first Token" handler
 * @found `Check.getAccessToken`
 *
 * This method sets credentials and caches the refresh, auth, and expiry tokens.
 */
function getNewToken(err, tokens) {

  var self = this;

  if(err) util.log('Tokenization Error: ' + err);

  if(tokens){

    self.oauth2Client.setCredentials(tokens);

    client.set("token", tokens.access_token);
    if(typeof tokens.refresh_token !== 'undefined') client.set("refresh", tokens.refresh_token);
    client.set("expiration", tokens.expiry_date);

    client.del("code", function(err){
      self.getMessages(err);
    });

  }

}

/**
 * "Force Refresh" Handler
 * @found `Check.getMessages`
 *
 * This method checks the token expiration and forces a refresh before
 * it has the ability to error out.
 */
function cheatExpiry(err, exp){

  var self = this;

  time_remaining = (moment(parseInt(exp)).diff(Date.now(), 'minutes'));

  // GLOBAL.pushNotifier.clearScreen();

  if(time_remaining < 5){
    client.get("token", function(err, token){
      if(token){
        self.refreshAccessToken(token, function(err){
          util.log('Refreshing token on ' + moment().format('MM/DD/YY [at] h:mma'));
          clearInterval(messagePoll);
          return self.getMessages(err);
        });
      }
    })
  }

};

Check.prototype.Backoff = function(bool){
  this.backoff = bool;
}

/**
 * Authenticate against GoogleAPIs
 *
 * 1. Get the cached token
 * 2. If token is valid (exists, isn't blank) then refresh it.
 * 3. If token doesn't exist or is blank request a new one.
 *
 * @param {String} q gmail search query to poll against.
 */
Check.prototype.Authenticate = function(q){

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

/**
 * Refresh OAuth based on existing access token.
 *
 * 1. Get the users Cached `refresh_token`
 * 2. Build fresh OAuth credentials object
 * 3. Fire OAuth refresh method.
 *
 * @param {String}   access_token   Cached token
 * @param {Function} cb             Callback method
 */
Check.prototype.refreshAccessToken = function(access_token, cb) {

  util.log('Refreshing Access Token')

  var self = this;

  /**
   * Refresh Auth
   */
  client.get("refresh", function(err, refresh_token){

    if(err){
      util.debug('Refresh Token Error: ' + err)
      self.emit('error', err)
    } else {

      self.oauth2Client.setCredentials({
        access_token: access_token,
        refresh_token: refresh_token
      });

      self.oauth2Client.refreshAccessToken(function(err, tokens){
        return initiateTokenRefresh.call(self, err, tokens);
      })

    }
  })

}

/**
 * Get a new Access Token from the Google API
 *
 * 1. This method will generate a url
 * 2. You will need to navigate to the URL to automatically create the
 *    required authentication tokens
 *    (This is handled via an additional push notification and mobile browser)
 * 3. When you navigate to this url a random code is stored in cache.
 * 4. The script polls every 2 seconds for the generate code.
 * 5. Once the script sees a new code in cache it initiates the tokenization method.
 * 6. When the user is tokenized the code is removed and the access and refresh
 * 		tokens are stored
 *
 * @param {Function} callback [description]
 */
Check.prototype.getAccessToken = function(callback) {

  var self = this;

  // generate consent page url
  var url = this.oauth2Client.generateAuthUrl({
    access_type: 'offline', // will return a refresh token
    scope: 'https://mail.google.com/' // can be a space-delimited string or an array of scopes
  });

  client.get("refresh", function(err, refresh_token){

    if(!refresh_token) url += "&approval_prompt=force";

    util.log('Visit the url: ', url);

    self.emit('verify', url)

    var poll = setInterval(function(){

      util.log("Looking for a new code...");

      client.get("code", function(err, code){

        if(code) {

          clearInterval(poll)

          // request access token
          self.oauth2Client.getToken(code, function(err, tokens){
            return getNewToken.call(self, err, tokens);
          })

        }

      });

    }, 2000);

  })
}

/**
 * Periodically poll Google's gmail API for new messages
 *
 * 1. Polling defaults to 5 seconds, but that can be changed when initializing the method
 * 2. Polling takes on a random number of milliseconds (between 1 and 700) in an attempt to bypass
 * 		Google's `Exceeded Rate Limit` errors
 * 3. Upon success the number of emails and their IDs are passed to the callback handler.
 *
 * @param {Error} err Any errors that may have made it this far without being caught
 */
Check.prototype.getMessages = function(err){

  var self = this;

  if(err) {
    util.debug('Error retrieving messages: ' + err)
    return self.emit('error', err);
  }

  /**
   * This looping method allows us to add a random number of milliseconds to
   * our request, hopefully working thru the occasional `Exceeded rate limite`
   * errors getting returned from GoogleAPI
   */
  loop(function(){

    // This is supposed to help with API rate limits.
    // We hit the wall, and slow down our requests until they get thru.
    if(self.backoff) {
      this.interval += (Math.floor(Math.random() * 700) + 1);
    } else {
      this.interval = self.polling;
    }

    client.get("expiration", function(err, exp){ return cheatExpiry.call(self, err, exp); });

    if(typeof self.oauth2Client.credentials.access_token !== 'undefined'){

      gmail.users.messages.list({ userId: 'me', auth: self.oauth2Client, q: self.q }, function(err, messages) {
        return listEmails.call(self, err, messages);
      })

    }

  }, self.polling);

}

module.exports = Check;
