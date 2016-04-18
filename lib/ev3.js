'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _readline = require('readline');

var _readline2 = _interopRequireDefault(_readline);

var _ev3devLang = require('ev3dev-lang');

var _ev3devLang2 = _interopRequireDefault(_ev3devLang);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Check the position once rotate EV3.
// Go to next if the real rotated position is less than the programed position.
// else re-rotate EV3 slightly along the opposite direction for adjusting.

// Define dev(abbr. for deviation) = position[programed] - position[real]
// Define minDev = 5
var minDev = 5;

// DC, abbr. for duty cycle
var rotateDC = 20;
var walkDC = 30;

//http://www.mathworks.com/help/supportpkg/legomindstormsev3/ref/ultrasonicsensor.html
var maxDis = 2550; //mm
var minDis = 50;

// function run () {
//   var distance = us.getValue(0)
//   var curSpeed = Math.round(distance / maxDistance * span + minDutyCycle)
//   motor.dutyCycleSp = curSpeed
//   console.log('current speed: ', curSpeed)
//   setTimeout(run, 3000)
// }

var EV3 = function () {
  function EV3() {
    _classCallCheck(this, EV3);

    // Listen for controlling EV3 through the keyboard
    var rl = _readline2.default.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.on('line', function (cmd) {
      if (cmd == 'pause') {
        pause();
      } else if (cmd == 'run') {
        run();
      } else if (cmd == 'stop') {
        stop();
      }
    });

    this.motors = {
      leftMotor: new _ev3devLang2.default.Motor('outB'),
      rightMotor: new _ev3devLang2.default.Motor('outC')
    };
    if (!this.motors.leftMotor.connected) throw Error('Left motor(outB) is not connected');
    if (!this.motors.rightMotor.connected) throw Error('Right motor(outC) is not connected');
    this.motors.leftMotor.reset();
    this.motors.leftMotor.stopCommand('bake');
    this.motors.rightMotor.reset();
    this.motors.rightMotor.rightCommand('bake');

    this.sensors = {
      us: new _ev3devLang2.default.UltrasonicSensor()
    };
    if (!us.connected) throw Error('No sensor is connected');
  }

  _createClass(EV3, [{
    key: 'walk',
    value: function walk() {}
  }, {
    key: 'rotate',
    value: function rotate() {}
  }, {
    key: 'start',
    value: function start() {}
  }, {
    key: 'pause',
    value: function pause() {}
  }, {
    key: 'stop',
    value: function stop() {}
  }]);

  return EV3;
}();