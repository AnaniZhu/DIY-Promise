# DIY-Promise
### 自己动手实现一个符合Promise A+ 规范的Promise

#### 1. 什么是 Promise

> Promise是JS异步编程中的重要概念，异步抽象处理对象，是目前比较流行Javascript异步编程解决方案之一。
- [阮一峰Promise教程](http://es6.ruanyifeng.com/#docs/promise)

#### 2. 用途

> 避免回调地狱，优雅的异步编程方案



#### 3. FIXME:
 - [ ] [规范2.3.3.3](https://promisesaplus.com/#point-56)
>  x 为 thenable 的情况目前还有问题，待修复...

#### 4. TODO:
- [x] Promise.prototype.then()
- [ ] Promise.prototype.catch()
- [ ] Promise.prototype.finally()
- [ ] Promise.resolve
- [ ] Promise.reject
- [ ] Promise.all
- [ ] Promise.race

#### 5. 测试

```
npm run test
```
 - [Promise A+ 规范测试用例](https://github.com/promises-aplus/promises-tests)

### 参考
- [Promise A+ 规范【英文】](https://promisesaplus.com/)
- [Promise A+ 规范【中文】](https://malcolmyu.github.io/2015/06/12/Promises-A-Plus/#note-4)

