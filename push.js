var push = require('pushover-notifications')
  , util = require("util")
  , EventEmitter  = require("events").EventEmitter;;

function Push(options, payload){

  EventEmitter.call(this);

  if(options && typeof options.message !== undefined){
    payload = options;
    options = {};
  }

  options = options || {};

  this.config = options.config || {
    user: 'u9m7s9Jr12vcpNDirx64Zmvk7iSm7u',
    token: 'akWcbbNdPiM5ToyvXBSPNpPgZ1V9cw'
  }

  this.payload = payload || {
      // These values correspond to the parameters detailed on https://pushover.net/api
      // 'message' is required. All other values are optional.
      message: 'New message',   // required
      title: "Mail",
      sound: 'magic',
      device: 'iphone6',
      priority: 0
  };

  this.p = new push(this.config);

  return this;

};

util.inherits(Push, EventEmitter);

Push.prototype.title = function(string){
  if(string) this.payload.title = string;
  return string;
}

Push.prototype.message = function(string){
  if(string) this.payload.message = string;
  return string;
}

Push.prototype.send = function(cb){

  cb = cb || function(err, result){};

  var self = this;

  this.p.send(this.payload, function(err, result){
    if(!err) self.emit('success', result);
    return cb(err, result);
  })

}

module.exports = Push;
