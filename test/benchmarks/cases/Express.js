const express = require('express');
const api = require('../../assets/github-api');

const cluster = require('../cluster');

cluster(() => {
  const app = express();
  app.disable('etag');
  app.disable('x-powered-by');

  const handler = (req, res) => {
    res.end('find');
  };

  api.forEach((val) => {
    app[val[0].toLowerCase()](val[1], handler);
  });

  app.listen(3001);
});
