var EV3 = require('../lib/ev3')


var ev3 = new EV3['default']()

console.log('Enter "reset" to stop ev3:')
ev3.rl.on('line', function (cmd) {
    if (cmd == 'reset') {
      ev3.reset()
    }
})

ev3.on('meetWall', function () {
  console.log('meetWall')
  ev3.look('left')
  .then(function (result) {
    if (!result.isOK) {
      return ev3.look('right')
    }
    return result
  })
  .then(function (result) {
    if (result.isOK) {
      return ev3.rotate(result.dir)
    } else {
      throw Error('Dead road')
    }
  })
  .then(function (res) {
    ev3.walk()
  })
  .catch(function(err) {
    console.log(err)
  })
})

ev3.walk()

process.on('uncaughtException', function (err) {
  ev3.reset()
  console.log('Caught exception: ' + err);
})
