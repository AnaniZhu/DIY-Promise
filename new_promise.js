// 2.1 一个 Promise 的当前状态必须为以下三种状态中的一种：等待态（Pending）、执行态（Fulfilled）和拒绝态（Rejected）。
const PEDDING = 'PEDDING'
const FULFILLED = 'FULFILLED'
const REJECTED = 'REJECTED'

// 2.2.4 onFulfilled 和 onRejected 只有在执行环境堆栈仅包含平台代码时才可被调用 注1
const nextTick = setTimeout

function getVariableType(value) {
  return Object.prototype.toString.call(value).slice(8, -1);
}

class MyPromise {
  static resolve = function (x) {
    return new MyPromise(resolve => resolve(x))
  }

  static reject = function (x) {
    return new MyPromise((resolve, reject) => reject(x))
  }

  static all = function (promises) {
    return new MyPromise((resolve, reject) => {
      let count = 0
      let returns = []
      promises.forEach((promise, i) => {
        promise.then(result => {
          returns[i] = result

          if (++count === promises.length) {
            resolve(returns)
          }
        }, reject)
      })
    })
  }

  static race = function (promises) {
    return new MyPromise((resolve, reject) => {
      promises.forEach(promise => {
        promise.then(resolve, reject)
      })
    })
  }

  static allSettled = function (promises) {
    return new MyPromise(resolve => {
      let count = 0
      let returns = []

      const cb = (result, i) => {
        returns[i] = result

        if (++count === promises.length) {
          resolve(returns)
        }
      }

      promises.forEach((promise, i) => {
        const finallyCb = res => cb(res, i)
        promise.then(finallyCb, finallyCb)
      })
    })
  }

  constructor (cb) {
    const _resolve = val => {
      this.resolutionProcedure(val, (value) => this.changeStatus(FULFILLED, value), _reject)
    }

    const _reject = reason => {
      this.changeStatus(REJECTED, reason)
    }

    this.onFulfilledCbs = []
    this.onRejectedCbs = []
    this._status = PEDDING

    try {
      cb(_resolve, _reject)
    } catch (err) {
      _reject(err)
    }
  }

  changeStatus (status, val) {
    // 2.1.1 处于等待态时，promise 需满足以下条件:
    // 2.1.1.1 可以迁移至执行态或拒绝态
    // 2.1.2 处于执行态时，promise 需满足以下条件：
    // 2.1.2.1 不能迁移至其他任何状态
    // 2.1.2.2 必须拥有一个不可变的终值
    // 2.1.3 处于拒绝态时，promise 需满足以下条件：
    // 2.1.3.1 不能迁移至其他任何状态
    // 2.1.3.2 必须拥有一个不可变的终值
    if (this._status === PEDDING) {
      this._status = status
      this.value = val
      nextTick(() => {
        const cbs = this[status === FULFILLED ? 'onFulfilledCbs' : 'onRejectedCbs']
        cbs.forEach(cb => cb())
      })
    }
  }

  // 2.2 一个 promise 必须提供一个 then 方法以访问其当前值、终值和据因。
  then (onFulfilled, onRejected) {
    // 2.2.1 onFulfilled 和 onRejected 都是可选参数:
    // 2.2.1.1 如果 onFulfilled 不是函数，其必须被忽略
    // 2.2.1.2 如果 onRejected 不是函数，其必须被忽略
    // 2.2.7.3 如果 onFulfilled 不是函数且 promise1 成功执行， promise2 必须成功执行并返回相同的值
    // 2.2.7.4 如果 onRejected 不是函数且 promise1 拒绝执行， promise2 必须拒绝执行并返回相同的据因
    // 三元表达式的值兼容是为了兼容非函数类型以及状态穿透，满足 2.2.1 和 2.2.7.3、2.2.7.4
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : v => v
    onRejected = typeof onRejected === 'function' ? onRejected : v => { throw v }

    let p = new MyPromise((resolve, reject) => {
      const cb = fn => () => {
        try {
          // 2.2.5 onFulfilled 和 onRejected 必须被作为函数调用（即没有 this 值）
          const x = fn(this.value)
          // 2.2.7.1 如果 onFulfilled 或者 onRejected 返回一个值 x ，则运行下面的 Promise 解决过程：[[Resolve]](promise2, x)
          p.resolutionProcedure(x, resolve, reject)
        } catch (err) {
          // 2.2.7.2 如果 onFulfilled 或者 onRejected 抛出一个异常 e ，则 promise2 必须拒绝执行，并返回拒因 e
          reject(err)
        }
      }
      // 2.2.2 如果 onFulfilled 是函数：
      // 2,2.2.1 当 promise 执行结束后其必须被调用，其第一个参数为 promise 的终值
      // 2.2.2.2 在 promise 执行结束前其不可被调用
      // 2.2.2.3 其调用次数不可超过一次
      const fulfilledCb = cb(onFulfilled)

      // 2.2.3 如果 onRejected 是函数：
      // 2,2.3.1 当 promise 被拒绝执行后其必须被调用，其第一个参数为 promise 的据因
      // 2.2.3.2 被拒绝执行前其不可被调用
      // 2.2.3.3 其调用次数不可超过一次
      const rejectedCb = cb(onRejected)

      switch (this._status) {
        case FULFILLED: {
          nextTick(fulfilledCb)
          break
        }
        case REJECTED: {
          nextTick(rejectedCb)
          break
        }
        case PEDDING: {
          // 2.2.6 then 方法可以被同一个 promise 调用多次
          // 2.2.6.1 当 promise 成功执行时，所有 onFulfilled 需按照其注册顺序依次回调
          this.onFulfilledCbs.push(fulfilledCb)
          // 2.2.6.2 当 promise 被拒绝执行时，所有的 onRejected 需按照其注册顺序依次回调
          this.onRejectedCbs.push(rejectedCb)
        }
      }
    })

    // 2.2.7 then 方法必须返回一个 promise 对象
    return p
  }

  resolutionProcedure (x, resolve, reject) {
    // 2.3.1 如果promise 和 x 指向相同的值, 使用 TypeError做为原因将promise拒绝。
    if (x === this) {
      reject(new TypeError("Chaining cycle detected for promise #<Promise>"))
      return
    }

    // 2.3.2 如果 x 是一个promise, 采用其状态
    if (x instanceof MyPromise) {
      x.then(resolve, reject)
      return
    }

    const type = getVariableType(x)

    // 2.3.3 如果 x 是一个对象或一个函数：
    if (type === 'Object' || type === 'Function') {
      let then
      // 2.3.3.1 将 then 赋为 x.then
      try {
        then = x.then
      } catch (err) {
        // 2.3.3.2 如果在取x.then值时抛出了异常，则以这个异常做为原因将 promise 拒绝。
        reject(err)
        return
      }

      // 2.3.3.3 如果 then 是一个函数， 以 x 为 this 调用 then 函数， 且第一个参数是 resolvePromise，第二个参数是 rejectPromise
      if (typeof then === 'function') {
        // 2.3.3.3.3 如果 resolvePromise 和 rejectPromise 都被调用了，或者被调用了多次，则只第一次有效，后面的忽略。
        // 作为多次调用的标志位
        let called = false

        // 2.3.3.3.1 当 resolvePromise 被以 y 为参数调用, 执行 [[Resolve]](promise, y).
        const resolvePromise = (val) => {
          if (!called) {
            called = true
            this.resolutionProcedure(val, resolve, reject)
          }
        }
        // 2.3.3.3.2 当 rejectPromise 被以 r 为参数调用, 则以 r 为原因将 promise 拒绝。
        const rejectPromise = err => {
          if (!called) {
            called = true
            reject(err)
          }
        }
        try {
          then.call(x, resolvePromise, rejectPromise)
        } catch (err) {
          // 2.3.3.3.4 如果在调用 then 时抛出了异常，则：
          // 2.3.3.3.4.1 如果 resolvePromise 或 rejectPromise 已经被调用了，则忽略它。
          // 2.3.3.3.4.2 否则, 以 e 为 reason 将 promise 拒绝。
          if (!called) {
            reject(err)
          }
        }
      } else {
        // 2.3.3.4 如果 then 不是一个函数，则 以 x 为值 fulfill promise。
        resolve(x)
      }
    } else {
      // 2.3.4 如果 x 不是对象也不是函数，则以 x 为值 fulfill promise。
      resolve(x)
    }
  }

  catch (onRejected) {
    this.then(null, onRejected)
  }

  finally (callback) {
    let finallyCb = () => callback() // finally 回调没有任何参数
    return this.then(finallyCb, finallyCb)
  }
}


MyPromise.deferred = function() {
  let defer = {};
  defer.promise = new MyPromise((resolve, reject) => {
    defer.resolve = resolve;
    defer.reject = reject;
  });
  return defer;
};

try {
  module.exports = MyPromise;
} catch (e) {}

