const fastify = require('fastify')();
const api = require('../../assets/github-api');

const handler = (req, res) => {
  res.send('find');
};

api.forEach((val) => {
  fastify[val[0].toLowerCase()](val[1], handler);
});

fastify.listen(3001);
