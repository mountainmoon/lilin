var EV3 = require('./lib/ev3')

var ev3 = new EV3()

console.log('Enter "reset" to stop ev3:')
ev3.rl.on('line', function (cmd) {
    if (cmd == 'reset') {
      ev3.reset()
    }
})

ev3.on('meetWall', function () {
  ev3.look('left')
  .then(function (result) {
    if (!result.isOK) {
      return ev3.look('right')
    }
    return result
  })
  .then(function (result) {
    if (result.isOK) {
      ev3.walk()
    } else {
      console.log('Dead road')
    }
  })
})

ev3.walk()