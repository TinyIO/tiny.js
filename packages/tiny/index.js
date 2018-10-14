const { STATUS_CODES, createServer } = require('http');
const { parse } = require('querystring');
const parseurl = require('./parseurl');
const Router = require('./router');

const onError = (err, req, res) => {
  const code = (res.statusCode = err.code || err.status || 500);
  res.end((err && err.length) || err.message || STATUS_CODES[code]);
};

class Tiny extends Router {
  constructor(options) {
    super();
    ({
      onError: this.onError = onError,
      notFound: this.notFound = onError.bind(void 0, { code: 404 }),
      server: this.server = null
    } = options);
    this.handler = this.handler.bind(this);
    this.match = super.match;
    this.subRoutes = [];
  }

  listen(...args) {
    (this.server = this.server || createServer()).on('request', this.handler);
    this.server.listen(...args);
    return this;
  }

  static Router() {
    return new Router();
  }

  mount(base, router) {
    if (router.basePath != null) {
      throw new Error('');
    }
    router.basePath = base;
    this.subRoutes.push(router);
    return router;
  }

  route(basePath) {
    const router = new Router(basePath);
    this.subRoutes.push(router);
    return router;
  }

  handler(req, res) {
    const parsedUrl = parseurl(req);
    const params = {};
    const route = this.match(req.method, parsedUrl.pathname, params);
    if (route.length === 0) {
      this.notFound(req, res);
      return;
    }

    req.params = params;
    req.pathname = parsedUrl.pathname;
    req.query = parse(parsedUrl.query);

    const h = route;
    const errFun = this.onError;
    let i = 1;
    const next = (err) => (err ? errFun(err, req, res, next) : h[i++](req, res, next));
    h[0](req, res, next);
  }
}

module.exports = (options = {}) => new Tiny(options);
