const fs = require('fs');
const { join, resolve } = require('path');
const tglob = require('tiny-glob/sync');
const mime = require('mime/lite');

const parseurl = require('./parseurl');

const noop = () => {};

const toEtag = (obj) => `W/"${obj.size.toString(16)}-${obj.mtime.getTime().toString(16)}"`;

const toAssume = (uri, extns) => {
  let i = 0;
  let x;
  const len = uri.length - 1;
  if (uri.charCodeAt(len) === 47) uri = uri.substring(0, len);

  const arr = [];
  const tmp = `${uri}/index`;
  for (; i < extns.length; i++) {
    x = `.${extns[i]}`;
    if (uri) arr.push(uri + x);
    arr.push(tmp + x);
  }

  return arr;
};

const is404 = (res) => ((res.statusCode = 404), res.end());

const defaultExt = ['html', 'htm'];

module.exports = function(dir, opts = {}) {
  dir = resolve(dir || '.');
  const FILES = {};
  const find = (uri, extns) => {
    if (~uri.lastIndexOf('.')) return FILES[uri];
    let i = 0;
    let data;
    const arr = toAssume(uri, extns);
    for (; i < arr.length; i++) {
      if ((data = FILES[arr[i]])) break;
    }
    return data;
  };

  const notFound = opts.onNoMatch || is404;
  const setHeaders = opts.setHeaders || noop;
  const extensions = opts.extensions || defaultExt;

  if (opts.dev) {
    return (req, res, next) => {
      const uri = req.path || req.pathname || parseurl(req).pathname;
      const arr = uri.includes('.') ? [uri] : toAssume(uri, extensions);
      const file = arr.map((x) => join(dir, x)).find(fs.existsSync);
      if (!file) return notFound(res);
      res.setHeader('content-type', mime.getType(file));
      fs.createReadStream(file).pipe(res);
    };
  }

  let cc = opts.maxAge && `public,max-age=${opts.maxAge}`;
  cc && opts.immutable && (cc += ',immutable');

  opts.cwd = dir;
  let abs;
  let stats;
  let headers;
  opts.dot = !!opts.dotfiles;
  tglob('**/*.*', opts).forEach((str) => {
    abs = join(dir, str);
    stats = fs.statSync(abs);
    headers = {
      'content-length': stats.size,
      'content-type': mime.getType(str),
      'last-modified': stats.mtime.toUTCString()
    };
    cc && (headers['cache-control'] = cc);
    opts.etag && (headers.etag = toEtag(stats));
    FILES[`/${str.replace(/\\+/g, '/')}`] = { abs, stats, headers };
  });

  return (req, res, next) => {
    const pathname = req.path || req.pathname || parseurl(req).pathname;
    const data = find(pathname, extensions);
    if (!data) return notFound(res);

    setHeaders(res, pathname, data.stats);
    res.writeHead(200, data.headers);

    fs.createReadStream(data.abs).pipe(res);
  };
};
