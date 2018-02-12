/*!
 * Continuously synchronizing web items without worrying about lags, delays or misses
 * Using request animation frame if possible
 *
 * @author Hung Luu <hungluu2106@gmail.com>
 * @license MIT
 * @version 0.0.1
 */

const raf = require('raf')
const objectAssign = require('object-assign')

/**
 * @module parrots
 * Create a new instance of ParrotHandler
 * @param {object} options required options are getter, setter
 * @return {ParrotHandler}
 *
 * @example // Create a handle to synchronize scroll left
 * parrots({
 *  // get scroll left from source
 *  getter: (el) => $(el).scrollLeft(),
 *  // set scroll left into items
 *  setter: (el, value) => $(el).scrollLeft(value)
 * })
 */
const parrots = (options) => new ParrotHandler(options)

/**
 * Create a handler for synchronizing items
 * @param {object} options options of current handler
 * @param {Function} options.getter required, is function, get value from source
 * @param {Function} options.setter required, is function, set value into items
 * @param {integer} options.duration optional, milliseconds, duration of synchronizing operation, default value is 4000
 */
class ParrotHandler {
  constructor (options) {
    const defaultOptions = {
      duration: 3000
    }

    // Affected items (receive copied value from source), passed as first arguments of setter
    this.items = []

    // Source to copy from, passed as the only argument of options.getter
    this.source = null

    // Timer of synchronizing operations
    this.timer = null

    // options
    this.options = objectAssign({}, defaultOptions, options)

    // events
    this.startLoopEvent = this.startLoop.bind(this)
    this.freeLoopEvent = this.freeLoop.bind(this)
    this.loopEvent = this.loop.bind(this)
  }

  /**
   * Add an affected item (receive synchronized value from source)
   * @param {object} item item that receives synchronized value from source
   * @return {this}
   */
  to (item) {
    this.items.push(item)
    return this
  }

  /**
   * Get a trigger to start synchronizing value from source into items
   * @param {object} source source of synchronized value passed into items
   * @return {Function}
   */
  from (source) {
    return () => {
      this.setSource(source)
      return this.startLoopEvent()
    }
  }

  // Loop used for synchronizing items
  loop () {
    // Get copied value from source
    const copiedValue = this.options.getter(this.source)
    // Copy value to every items in stack
    for (let idx = 0, maxIndex = this.items.length - 1; idx <= maxIndex; idx++) {
      // Use setter to copy into affected item
      this.options.setter(this.items[idx], copiedValue)
    }

    // Recall loop in a performant style
    raf(this.loopEvent)
  }

  // Start loop
  startLoop () {
    if (this.timer === null) {
      // create new timer
      this.timer = raf(this.loopEvent)
      // release timer when time is up
      setTimeout(this.freeLoopEvent, this.loopDuration)
    }
  }

  // End loop
  freeLoop () {
    if (this.timer !== null) {
      // Release timer
      raf.cancel(this.timer)
    }
  }
}

module.exports = parrots