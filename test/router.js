/* eslint no-console: 0 */

const Router = require('../packages/tiny/router');
const api = require('./assets/github-api');

const app = new Router();

api.forEach((val) => {
  app[val[0].toLowerCase()](val[1], () => {
    console.log(val[1]);
  });
});

api.forEach((val) => {
  const param = {};
  const c = app.match(val[0], val[2], param);
  console.log(val[1]);
  c[0]();
  console.log(val[2]);
  console.log(param);
});
