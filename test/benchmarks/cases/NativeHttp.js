const { createServer } = require('http');

createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/user/keys/233') {
    res.end('find');
  } else {
    res.end('404');
  }
}).listen(3001);
