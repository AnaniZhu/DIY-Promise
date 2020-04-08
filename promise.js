// 旧的实现
const STATUS = {
  PEDDING: "Pending",
  FULFILLED: "Fulfilled",
  REJECTED: "Rejected"
};

const nextTick = setTimeout;

function getVariableType(value) {
  return Object.prototype.toString.call(value).slice(8, -1);
}

class Promise2 {
  constructor(fn) {
    if (typeof fn !== "function") {
      throw new TypeError(`Promise resolver ${fn} is not function!`);
    }

    this.status = STATUS.PEDDING;
    this.taskQueue = [];

    this._resolve = value => {
      if (value instanceof Promise2) {
        return value.then(this._resolve, this._reject);
      }
      this.setPromise(STATUS.FULFILLED, value);
    };
    this._reject = reason => {
      this.setPromise(STATUS.REJECTED, reason);
    };

    try {
      fn(this._resolve, this._reject);
    } catch (error) {
      this._reject(error);
    }
  }
  setPromise(status, value) {
      if (this.status !== STATUS.PEDDING) {
        return;
      }

      this.status = status;
      this.value = value;

      this.taskQueue.forEach(task => {
        let { next, onFulfilled, onRejected } = task;
        let callback = status === STATUS.FULFILLED ? onFulfilled : onRejected;

        if (typeof callback === "function") {
          this.triggerCallback(next, callback);
        } else {
          next.setPromise(status, value);
        }
      });

      this.taskQueue = [];
  }
  // 2.3 Promise解析过程
  resolvePromise(promise, x) {
    // 2.3.1 如果promise 和 x 指向相同的值, 使用 TypeError做为原因将promise拒绝。
    if (promise === x) {
      promise.setPromise(
        STATUS.REJECTED,
        new TypeError("Chaining cycle detected for promise #<Promise>")
      );
      return;
    }
    // 2.3.2 如果 x 是一个promise, 采用其状态
    if (x instanceof Promise2) {
      // x.then(
      //   value => promise.resolvePromise(promise, value),
      //   error => promise.setPromise(STATUS.REJECTED, error)
      // );

      // 当 value 为 Promise 时，resolve 的值无法确定类型，需要再走一遍 resolvePromise
      switch (x.status) {
        // 2.3.2.2 如果 x 处于执行态，用相同的值执行 promise
        case STATUS.FULFILLED:
          promise.resolvePromise(promise, x.value)
          break;
        // 2.3.2.3 如果 x 处于拒绝态，用相同的据因拒绝 promise
        case STATUS.REJECTED:
          promise.setPromise(STATUS.REJECTED, x.value);
          break;
        //  2.3.2.1 如果 x 处于等待态， promise 需保持为等待态直至 x 被执行或拒绝
        case STATUS.PEDDING:
          x.then(
            value => promise.resolvePromise(promise, value),
            error => promise.setPromise(STATUS.REJECTED, error)
          );
          break;
      }
      return;
    }
    let type = getVariableType(x);
    // 2.3.3 如果x是一个对象或一个函数：
    if (type === "Object" || type === "Function") {
      let then;

      // 2.3.3.1 将 then 赋为 x.then
      try {
        then = x.then;
      } catch (error) {
        // 2.3.3.2 如果在取x.then值时抛出了异常，则以这个异常做为原因将promise拒绝。
        promise.setPromise(STATUS.REJECTED, error);
        return;
      }

      // 2.3.3.3 如果 then 是一个函数， 以x为this调用then函数， 且第一个参数是resolvePromise，第二个参数是rejectPromise
      if (getVariableType(then) === "Function") {
        // 2.3.3.3.3 如果 resolvePromise 和 rejectPromise 都被调用了，或者被调用了多次，则只第一次有效，后面的忽略。
        // 作为多次调用的标志位
        let isCalled = false;

        // 2.3.3.3.1 当 resolvePromise 被以 y为参数调用, 执行 [[Resolve]](promise, y).
        const resolvePromise = y => {
          if (!isCalled) {
            isCalled = true;
            this.resolvePromise(promise, y);
          }
        };
        // 2.3.3.3.2 当 rejectPromise 被以 r 为参数调用, 则以r为原因将promise拒绝。
        const rejectPromise = r => {
          if (!isCalled) {
            isCalled = true;
            promise.setPromise(STATUS.REJECTED, r);
          }
        };

        try {
          then.call(x, resolvePromise, rejectPromise);
        } catch (err) {
          // 2.3.3.3.4 如果在调用then时抛出了异常，则：
          if (isCalled) {
            // 2.3.3.3.4.1 如果 resolvePromise 或 rejectPromise 已经被调用了，则忽略它。
            return;
          } else {
            // 2.3.3.3.4.2 否则, 以e为reason将 promise 拒绝。
            promise.setPromise(STATUS.REJECTED, err);
          }
        }
      } else {
        // 2.3.3.4 如果 then 不是一个函数，则 以 x 为值 fulfill promise。
        promise.setPromise(STATUS.FULFILLED, x);
      }
    } else {
      // 2.3.4 如果 x 不是对象也不是函数，则以x为值 fulfill promise。
      promise.setPromise(STATUS.FULFILLED, x);
    }
  }
  triggerCallback(promise, callback) {
    nextTick(() => {
      let x;
      try {
        x = callback(this.value);
      } catch (error) {
        promise.setPromise(STATUS.REJECTED, error);
        return;
      }
      this.resolvePromise(promise, x);
    })
  }
  then(onFulfilled, onRejected) {
    let promise = new Promise2(() => {});

    switch (this.status) {
      case STATUS.FULFILLED:
        if (typeof onFulfilled === "function") {
          this.triggerCallback(promise, onFulfilled);
        } else {
          promise.setPromise(STATUS.FULFILLED, this.value);
        }

        break;
      case STATUS.REJECTED:
        if (typeof onRejected === "function") {
          this.triggerCallback(promise, onRejected);
        } else {
          promise.setPromise(STATUS.REJECTED, this.value);
        }

        break;
      case STATUS.PEDDING:
        let task = {
          onFulfilled,
          onRejected,
          next: promise
        };
        this.taskQueue.push(task);
        break;
      default:
        break;
    }
    return promise;
  }
  catch(onRejected) {
    return this.then(null, onRejected);
  }
}

// 执行测试用例需要用到的代码
Promise2.deferred = function() {
  let defer = {};
  defer.promise = new Promise2((resolve, reject) => {
    defer.resolve = resolve;
    defer.reject = reject;
  });
  return defer;
};

try {
  module.exports = Promise2;
} catch (e) {}
