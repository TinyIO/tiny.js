const { STATUS_CODES } = require('http');

const TYPE = 'Content-Type';
const OSTREAM = 'application/octet-stream';

const send = (payload = '', code = 200, headers = {}) => {
  let type = headers[TYPE];

  if (!!payload && typeof payload.pipe === 'function') {
    this.setHeader(TYPE, type || OSTREAM);
    return payload.pipe(this);
  }

  if (payload instanceof Buffer) {
    type = type || OSTREAM;
  } else if (typeof payload === 'object') {
    payload = JSON.stringify(payload);
    type = 'application/json;charset=utf-8';
  } else {
    payload = payload || STATUS_CODES[code];
  }

  headers[TYPE] = type || 'text/plain';
  headers['Content-Length'] = Buffer.byteLength(payload);

  this.writeHead(code, headers);
  this.end(payload);
};

module.exports = (req, res, next) => {
  res.send = send.bind(res);
  next();
};
