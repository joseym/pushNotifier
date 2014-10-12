var util = require("util")
  , EventEmitter  = require("events").EventEmitter
  , google = require('googleapis')
  , OAuth2Client = google.auth.OAuth2
  , gmail = google.gmail('v1')
  , request = require('request')
  , fs = require('fs')
  , readline = require('readline')
  , rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
  , Redis = require('./db.js')();
;

function clearScreen(){ process.stdout.write('\033c'); }

var CLIENT_ID = '468852991253-i78lvlgq0oeuf80i31te26bs82nms03f.apps.googleusercontent.com';
var CLIENT_SECRET = 'EOY8hjXAjhdqMFnWMhy0bPps';
var REDIRECT = 'http://mort-notifications.herokuapp.com';

function Check(q){

  EventEmitter.call(this);

  this.oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT);
  this.error = null;
  this.q = q;

};

util.inherits(Check, EventEmitter);

Check.prototype.refreshAccessToken = function(token, cb) {

  var self = this;

  this.oauth2Client.refreshToken_(token, function(err, token){
    if(err){

      return self.getAccessToken(cb);
    }
    self.oauth2Client.setCredentials(token);
    cb(err)
  });

}

Check.prototype.getAccessToken = function(callback) {

  var self = this;

  self.emit('token_error');

  // var _code = '4/RtvhFEsUnnt9metNEUwJnHUBWLXg2acg1h1FEie-Djw.cn460xfIjNAdEnp6UAPFm0H-FNL3kQI';
  // generate consent page url
  var url = this.oauth2Client.generateAuthUrl({
    access_type: 'offline', // will return a refresh token
    scope: 'https://mail.google.com/' // can be a space-delimited string or an array of scopes
  });

  console.log('Visit the url: ', url);

  self.emit('get_code', url);

  Redis.get("code", function(code){

    // request access token
    self.oauth2Client.getToken(code, function(err, tokens) {

      // set tokens to the client
      // TODO: tokens should be set by OAuth2 client.
      self.oauth2Client.setCredentials(tokens);

      Redis.set("token", tokens.access_token, function(err) {
        if(err) {
          console.log(err);
        } else {
          clearScreen();
          callback(err);
        }
      }))

      // fs.writeFile("./token", tokens.access_token, function(err) {
      //   if(err) {
      //     console.log(err);
      //   } else {
      //     clearScreen();
      //     callback(err);
      //   }
      // });

    });

  })

  // rl.question('Enter the code here:', function(code) {
  //
  //   // request access token
  //   self.oauth2Client.getToken(code, function(err, tokens) {
  //
  //     // set tokens to the client
  //     // TODO: tokens should be set by OAuth2 client.
  //     self.oauth2Client.setCredentials(tokens);
  //
  //     fs.writeFile("./token", tokens.access_token, function(err) {
  //       if(err) {
  //         console.log(err);
  //       } else {
  //         clearScreen();
  //         callback(err);
  //       }
  //     });
  //
  //   });
  //
  // });

}

Check.prototype.getMessages = function(err){

  var self = this;

  if(err){
    self.emit('error', err)
  } else {

    var old = 0;
    setInterval(function(){

      gmail.users.messages.list({ userId: 'me', auth: self.oauth2Client, q: self.q }, function(err, messages) {

        if (err) {
          self.emit('error', err)
          return;
        }

        var count = messages.resultSizeEstimate;

        if(count !== old && count > 0) self.emit('new', count);

        old = count;

      });

    }, 5000)

  }

}

Check.prototype.start = function(q){

  this.q = q || this.q;

  var self = this;

  fs.readFile('./token', 'utf8', function(err, token){

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
