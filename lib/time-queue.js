'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// todo: add checking limits(to `push`?).

var TimeQueue = function () {
  function TimeQueue(fn) {
    var interval = arguments.length <= 1 || arguments[1] === undefined ? 150 : arguments[1];
    var limits = arguments.length <= 2 || arguments[2] === undefined ? 300 : arguments[2];

    _classCallCheck(this, TimeQueue);

    if (fn) {
      this.queue = Array.isArray(fn) ? fn : [fn];
    } else {
      this.queue = [];
    }
    this.limits = limits;
    this._interval = interval;
    this._timer = null;
    this.check();
  }

  _createClass(TimeQueue, [{
    key: 'check',
    value: function check() {
      var _this = this;

      if (!this.queue.length || this._timer !== null) return;

      this._timer = setInterval(function () {
        for (var i = 0; i < _this.queue.length;) {
          var fn = _this.queue[i];
          if (fn()) {
            _this.queue.splice(i, 1);
            if (!_this.queue.length) {
              clearInterval(_this._timer);
              _this._timer = null;
            }
          } else {
            i++;
            fn.counts = !fn.counts ? 1 : fn.counts + 1;
            if (fn.counts >= _this.limits) throw Error('Looks like tried too many times:' + fn.toString());
          }
        }
      }, this._interval);
    }
  }, {
    key: 'push',
    value: function push(fn) {
      this.queue.push(fn);
      this.check();
    }
  }]);

  return TimeQueue;
}();

exports.default = TimeQueue;
// for global using, to save the little resource of ev3

var timeQueue = exports.timeQueue = new TimeQueue();