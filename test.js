const MyPromise = require('./new_promise')

function sleep(time, val, isReject) {
  return new MyPromise((resolve, reject) => {
    setTimeout(isReject ? reject : resolve, time, val)
  })
}

// MyPromise.all([sleep(1000, '1'), sleep(2000, '2'), sleep(5000, '3')]).then(res => {
//   console.log('rt1', res)
// }, err => {
//   console.log('err1', err)
// })
// MyPromise.all([sleep(1000, '1'), sleep(2000, '2'), new MyPromise((resolve, reject) => setTimeout(() => {reject('err')}, 1500))]).then(res => {
//   console.log('rt2', res)
// }, err => {
//   console.log('err2', err)
// })

// MyPromise.race([sleep(1000, '1'), sleep(2000, '2'), sleep(5000, '3')]).then(res => {
//   console.log('rt1', res)
// }, err => {
//   console.log('err1', err)
// })
// MyPromise.race([sleep(1600, '1'), sleep(2000, '2'), sleep(1500, 'err', true)]).then(res => {
//   console.log('rt2', res)
// }, err => {
//   console.log('err2', err)
// })

MyPromise.allSettled([
  sleep(1000, '1'),
  sleep(2000, '2'),
  sleep(3000, '3')
]).then(res => console.log('res1', res), err => console.log('err1', err))

MyPromise.allSettled([
  sleep(500, '1'),
  sleep(1000, 'err', true),
  sleep(1500, '3')
]).then(res => console.log('res2', res), err => console.log('err2', err))


// MyPromise.resolve(3).then(res => console.log('res1', res), err => console.log('err1', err))
// MyPromise.resolve(sleep(1500, 'err', true)).then(res => console.log('res1', res), err => console.log('err1', err))


// MyPromise.reject(3).then(res => console.log('res1', res), err => console.log('err1', err))
// MyPromise.reject(sleep(1500, 'succ')).then(res => console.log('res1', res), err => console.log('err1', err))
