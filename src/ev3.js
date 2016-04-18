import readline from 'readline'
import ev3dev from 'ev3dev-lang'
import EventEmitter from 'events'
import {timeQueue} from './time-queue'

// Define dev(abbr. for deviation) = position[programed] - position[real]
// Define minDev = 5
var minDev = 5

// DC, abbr. for duty cycle
var rotateDC = 20
var walkDC = 30
// for detectMotor
var rotateSpeed = 30

//http://www.mathworks.com/help/supportpkg/legomindstormsev3/ref/ultrasonicsensor.html
var maxDetectedDis = 2550 //mm
var minDetectedDis = 50

var stopDis = 200
var minWalkDis = 350

/**
 * @events ['meetWall']
**/
class EV3 extends EventEmitter {
  constructor() {
    // Listen for controlling EV3 through the keyboard
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    this.motors = {
      leftMotor: new ev3dev.LargeMotor('outB'),
      rightMotor: new ev3dev.LargeMotor('outC'),
      detectMotor: new ev3dev.MediumMotor('outA')
    }
    if (!this.motors.leftMotor.connected)
      throw Error('Left motor(outB) is not connected')
    if (!this.motors.rightMotor.connected)
      throw Error('Right motor(outC) is not connected')
    if (!this.motors.detectMotor.connected)
      throw Error('Detecting motor(outC) is not connected')

    for (var key in this.motors) {
      this.motors[key].reset()
      this.motors[key].stopCommand('brake')
    }

    this.sensors = {
      us: new ev3dev.UltrasonicSensor()
    }
    if (!us.connected)
      throw Error('No sensor is connected')
    us.mode('US-DIST-CM')
  }

  walk() {
    this.motors.leftMotor.dutyCycleSp = walkDC
    this.motors.rightMotor.dutyCycleSp = walkDC

    if (this.detect()) {
      this.motors.leftMotor.sendCommand('run-direct')
      this.motors.rightMotor.sendCommand('run-direct')
      timeQueue.push(() => {
        if (!this.detect()) {
          this.emit('meetWall')
          return true
        }
      })
    }
  }

  // use the regular speed
  look(dir, speed = rotateSpeed) {
    // turn to the dir
    var promise = new Promise((res, rej) => {
      if (!dir) 
        throw Error('Should have a dir')

      speed = dir == 'left' ? -1 * speed : speed

      this.motors.detectMotor.speedRegulationEnabled = true
      this.motors.detectMotor.speedSp = speed
      this.motors.sendCommand('run-forever')

      timeQueue.push(() => {
        if (this.detect(minWalkDis)) {
          res({dir, isOK: true})
          return true
        } else if (this.motors.detectMotor.position >= 90) {
          res({dir, isOK: false})
          return true
        }
      })
    })

    // then turn back
    return promise.then(result => {
      this.motors.detectMotor.positionSp = 0
      this.motors.detectMotor.sendCommand('run-to-abs-pos')

      return new Promise((res, rej) => {
        timeQueue.push(() => {
          if (Math.abs(this.detectMotor.position) <= minDev) {
            res (result)
            return true
          }
        })
      })
    }).catch(err => this.motors.sendCommand('stop'))
  }

  detect(range = stopDis) {
    return this.sensors.us.getValue(0) > range
  }

  rotate(dir, pos = null, dutyCycle = rotateDC) {
    var promise = new Promise((res, req) => {
      if (!dir) throw Error('Should be either left or right')
      if (pos !== null) throw TypeError('Should be null. Not implemented')

      var driveMotor = dir == 'left' ? 
        this.motors.rightMotor : 
        this.motors.leftMotor

      driveMotor.dutyCycleSp = rotateDC
      driveMotor.sendCommand('run-direct')

      timeQueue.push(() => {
        if (this.detect(minWalkDis)) {
          res(true)
          return true
        }
      })
    })
  }

  reset() {
    for(var key in this.motors) {
      this.motors.reset()
    }
  }
}

export default EV3