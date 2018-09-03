const polka = require('polka');
const api = require('../../assets/github-api');

const app = polka();

const handler = (req, res) => {
  res.end('find');
};

api.forEach((val) => {
  app[val[0].toLowerCase()](val[1], handler);
});

app.listen(3001);
