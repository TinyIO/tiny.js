/* eslint no-console: 0 */

const tiny = require('../packages/tiny');
// const api = require('./assets/github-api');

function onError(err, req, res) {
  console.log(err);
  res.end('error');
}

const app = tiny({ onError });

const handler = (req, res) => {
  res.end(`handler, ${req.params.alias}`);
};

const handlerA = (req, res) => {
  res.end(`handlerA, ${req.params.alias}`);
};
const handlerID = (req, res) => {
  res.end(`handlerID, ${req.params.alias}`);
};

const handlerIDID = (req, res) => {
  res.end(`handlerIDID, ${req.params.alias}`);
};

// api.forEach((val) => {
//   app[val[0].toLowerCase()](val[1], handler);
// });

const app2 = tiny({ onError });

// .get('/:test', handler)
// .get('/test', handler)
// .filter('/test', handlerA)
// .get('/test/:hello', handler);

app2
  .filter(handlerA)
  .get('/', handlerID)
  .get('/users/:group/:id', handlerIDID);

app
  .filter('authorizations', handler)
  .mount('sub', app2)
  .get('/*all', handler);

app.build();

function test1() {
  const foo = (req, res, next) => {
    req.foo = 'hello';
    next();
  };

  const bar = (req, res, next) => {
    req.bar = 'world';
    next();
  };

  const sub = tiny()
    .filter(bar)
    .get('/', (req, res) => {
      res.end('hello from sub@index');
    })
    .get('/a/:bar', (req, res) => {
      res.end('hello from sub@show');
    });

  const app3 = tiny()
    .filter(foo)
    .mount('sub', sub)
    .get('/', (req, res) => {
      res.end('hello from main');
    });

  app3.build();

  console.log(app3.toString());

  const params = {};
  console.log(app3.match('GET', '/sub/hi', params));
  console.log(JSON.stringify(params));
}

test1();

console.log(app.toString());

let params = {};
console.log(app.match('GET', '/', params));
console.log(JSON.stringify(params));
params = {};
console.log(app.match('GET', '/users/', params));
console.log(JSON.stringify(params));
params = {};
console.log(app.match('GET', '/authorizations/1', params));
console.log(JSON.stringify(params));
params = {};
console.log(app.match('GET', '/users/1/2', params));
console.log(JSON.stringify(params));
params = {};
console.log(app.match('GET', '/test', params));
console.log(JSON.stringify(params));
params = {};
console.log(app.match('GET', '/test/', params));
console.log(JSON.stringify(params));
params = {};
console.log(app.match('GET', '/test/123', params));
console.log(JSON.stringify(params));
params = {};

// app.run((address) => {
//     console.log(address);
//   });
