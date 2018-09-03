/* eslint no-console: 0 */

const tiny = require('../packages/tiny');
const send = require('../packages/send');

function onError(err, req, res) {
  console.log(err);
  res.end('error');
}

const app = tiny({ onError, port: 3001 });

const handler = (req, res, next) => {
  res.end(`Hello, ${req.params.alias}`);
};

const handler1 = (req, res, next) => {
  next();
};
const handler2 = (req, res, next) => {
  res.send(req.params);
  next();
};

app
  .use(send)
  .get('/users/:alias', handler)
  .run((address) => {
    console.log(address);
  });
