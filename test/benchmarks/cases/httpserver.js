const { createServer } = require('http');

createServer((req, res) => {
  res.end('find');
}).listen(3001);
