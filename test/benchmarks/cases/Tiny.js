const tiny = require('../../../packages/tiny');
const api = require('../../assets/github-api');

const app = tiny();

const handler = (req, res) => {
  res.end('find');
};

api.forEach((val) => {
  app[val[0].toLowerCase()](val[1], handler);
});

app.build().listen(3001);
