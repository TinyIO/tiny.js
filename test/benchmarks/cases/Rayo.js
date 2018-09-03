const rayo = require('rayo');
const api = require('../../assets/github-api');

const app = rayo({ port: 3001 });

const handler = (req, res) => {
  res.end('find');
};

api.forEach((val) => {
  app[val[0].toLowerCase()](val[1], handler);
});

app.start();
