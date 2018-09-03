const express = require('express');

const app = express();
app.disable('etag');
app.disable('x-powered-by');
const handler = (req, res, next) => {
  // next();
  res.end(`Hello, ${req.params.alias}`);
  next();
};

app.get('/users/:alias', handler).listen(3001);
