// todo: add checking limits(to `push`?).
class TimeQueue {
  constructor(fn, interval = 150, limits = 300) {
    if (fn) {
      this.queue = Array.isArray(fn) ? fn : [fn]
    } else {
      this.queue = []
    }
    this.limits = limits
    this._interval = interval
    this._timer = null
    this.check()
  }

  check() {
    if (!this.queue.length || this._timer !== null) return

    this._timer = setInterval(() => {
      for (var i = 0; i < this.queue.length;) {
        var fn = this.queue[i]
        if (fn()) {
          this.queue.splice(i, 1)
          if (!this.queue.length) {
            clearInterval(this._timer)
            this._timer = null
          }
        } else {
          i++
          fn.counts = !fn.counts ? 1 : fn.counts + 1
          if (fn.counts >= this.limits)
            throw Error('Looks like tried too many times:' + fn.toString())
        }
      }
    }, this._interval)
  }

  push(fn) {
    this.queue.push(fn)
    this.check()
  }
}

export default TimeQueue
// for global using, to save the little resource of ev3
export var timeQueue = new TimeQueue()