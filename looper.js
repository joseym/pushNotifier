/**
 * Handy method to allow for simulated setInterval, but with variable delays
 * @param  {Function} cb    What to do in the loop
 * @param  {Number}   delay The delay time in milliseconds
 * @return {Function}         Starts the loop
 */
module.exports = function(cb, delay) {

  var self = {
    interval: delay,
    callback: cb,
    stopped: false,
    runLoop: function() {
      if (self.stopped) return;
      var result = self.callback.call(self);
      if (typeof result == 'number'){
        if (result === 0) return;
        self.interval = result;
      }
      self.loop();
    },
    stop: function() {
      this.stopped = true;
      clearTimeout(this.timeout);
    },
    start: function() {
      this.stopped = false;
      return this.loop();
    },
    loop: function() {
      this.timeout = setTimeout(this.runLoop, this.interval);
      return this;
    }
  };

  return self.start();

}
