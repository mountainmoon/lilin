'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _readline = require('readline');

var _readline2 = _interopRequireDefault(_readline);

var _ev3devLang = require('ev3dev-lang');

var _ev3devLang2 = _interopRequireDefault(_ev3devLang);

var _events = require('events');

var _timeQueue = require('./time-queue');

require('babel-polyfill');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
// for node 0.10.x


// Define dev(abbr. for deviation) = position[programed] - position[real]
// Define minDev = 5
var minDev = 5;

// DC, abbr. for duty cycle
var rotateDC = 20;
var walkDC = 30;
// for detectMotor
var rotateSpeed = 30;

//http://www.mathworks.com/help/supportpkg/legomindstormsev3/ref/ultrasonicsensor.html
var maxDetectedDis = 2550; //mm
var minDetectedDis = 50;

var stopDis = 200;
var minWalkDis = 350;

/**
 * @events ['meetWall']
**/

var EV3 = function (_EventEmitter) {
  _inherits(EV3, _EventEmitter);

  function EV3() {
    _classCallCheck(this, EV3);

    // Listen for controlling EV3 through the keyboard

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(EV3).call(this));

    _this.rl = _readline2.default.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    _this.motors = {
      leftMotor: new _ev3devLang2.default.LargeMotor('outB'),
      rightMotor: new _ev3devLang2.default.LargeMotor('outD'),
      detectMotor: new _ev3devLang2.default.MediumMotor('outA')
    };
    if (!_this.motors.leftMotor.connected) throw Error('Left motor(outB) is not connected');
    if (!_this.motors.rightMotor.connected) throw Error('Right motor(outD) is not connected');
    if (!_this.motors.detectMotor.connected) throw Error('Detecting motor(outA) is not connected');

    for (var key in _this.motors) {
      _this.motors[key].reset();
      _this.motors[key].stopCommand = 'brake';
    }

    _this.sensors = {
      us: new _ev3devLang2.default.UltrasonicSensor()
    };
    if (!_this.sensors.us.connected) throw Error('No sensor is connected');
    _this.sensors.us.mode = 'US-DIST-CM';
    return _this;
  }

  _createClass(EV3, [{
    key: 'walk',
    value: function walk() {
      var _this2 = this;

      this.motors.leftMotor.dutyCycleSp = walkDC;
      this.motors.rightMotor.dutyCycleSp = walkDC;

      if (this.detect()) {
        this.motors.leftMotor.sendCommand('run-direct');
        this.motors.rightMotor.sendCommand('run-direct');
        _timeQueue.timeQueue.push(function () {
          if (!_this2.detect()) {
            _this2.motors.leftMotor.sendCommand('stop');
            _this2.motors.rightMotor.sendCommand('stop');
            _this2.emit('meetWall');
            return true;
          }
        });
      }
    }

    // use the regular speed

  }, {
    key: 'look',
    value: function look(dir) {
      var _this3 = this;

      var speed = arguments.length <= 1 || arguments[1] === undefined ? rotateSpeed : arguments[1];

      // turn to the dir
      var promise = new Promise(function (res, rej) {
        if (!dir) throw Error('Should have a dir');

        speed = dir == 'left' ? -1 * speed : speed;

        _this3.motors.detectMotor.speedRegulationEnabled = 'on';
        _this3.motors.detectMotor.speedSp = speed;
        _this3.motors.detectMotor.sendCommand('run-forever');
        _timeQueue.timeQueue.push(function () {
          if (_this3.detect(minWalkDis)) {
            res({ dir: dir, isOK: true });
            return true;
          } else if (Math.abs(_this3.motors.detectMotor.position) >= 90) {
            res({ dir: dir, isOK: false });
            return true;
          }
        });
      });

      // then turn back
      return promise.then(function (result) {
        _this3.motors.detectMotor.positionSp = 0;
        _this3.motors.detectMotor.sendCommand('run-to-abs-pos');

        return new Promise(function (res, rej) {
          _timeQueue.timeQueue.push(function () {
            if (Math.abs(_this3.motors.detectMotor.position) <= minDev) {
              res(result);
              return true;
            }
          });
        });
      }).catch(function (err) {
        _this3.motors.detectMotor.sendCommand('stop');
        console.log(err);
      });
    }
  }, {
    key: 'detect',
    value: function detect() {
      var range = arguments.length <= 0 || arguments[0] === undefined ? stopDis : arguments[0];

      console.log('dis: ' + this.sensors.us.getValue(0) + ', range: ' + range);
      return this.sensors.us.getValue(0) > range;
    }
  }, {
    key: 'rotate',
    value: function rotate(dir) {
      var _this4 = this;

      var pos = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
      var dutyCycle = arguments.length <= 2 || arguments[2] === undefined ? rotateDC : arguments[2];

      return new Promise(function (res, req) {
        if (!dir) throw Error('Should be either left or right');
        if (pos !== null) throw TypeError('Should be null. Not implemented');

        var driveMotor = dir == 'left' ? _this4.motors.rightMotor : _this4.motors.leftMotor;

        driveMotor.dutyCycleSp = rotateDC;
        driveMotor.sendCommand('run-direct');

        _timeQueue.timeQueue.push(function () {
          if (_this4.detect(minWalkDis)) {
            res(true);
            return true;
          }
        });
      });
    }
  }, {
    key: 'reset',
    value: function reset() {
      for (var key in this.motors) {
        this.motors[key].reset();
      }
    }
  }]);

  return EV3;
}(_events.EventEmitter);

exports.default = EV3;