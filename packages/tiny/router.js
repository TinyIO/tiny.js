const { METHODS } = require('http');

const SEP = '/';
const [STYPE, PTYPE, ATYPE] = [0, 1, 2];
const [SLASH, COLON, ASTER, QMARK] = [47, 58, 42, 63]; // / : * ?

const EMPTY_ARRAY = [];

const PARAM = Symbol('param');
const NAME = Symbol('name');
const TYPE = Symbol('type');
const HANDLER = Symbol('handler');

const subRoutes = [];

const strip = (str) => {
  if (str === SEP) return str;
  str.charCodeAt(0) === SLASH && (str = str.substr(1));
  const len = str.length - 1;
  return str.charCodeAt(len) === SLASH ? str.substr(0, len) : str;
};

const split = (str) => ((str = strip(str)) === SEP ? [SEP] : str.split(SEP));

module.exports = class Router {
  constructor(path = null) {
    this.basePath = path;
    this.routes = {};
    this.routes['*'] = {
      [TYPE]: STYPE,
      [NAME]: SEP,
      [HANDLER]: [],
      [PARAM]: null
    };

    const genVerb = (verb) => {
      const bind = [verb];
      if (path) {
        bind.push(path);
      }
      this[verb.toLowerCase()] = this.route.bind(this, ...bind);
      this.routes[verb] = {
        [TYPE]: STYPE,
        [NAME]: SEP,
        [HANDLER]: [],
        [PARAM]: null
      };
    };

    genVerb('all');

    METHODS.forEach(genVerb);

    if (!path) {
      this.subRoute = (basePath) => {
        const subRoute = new Router(basePath);
        subRoutes.push(subRoute);
        return subRoute;
      };
    }
  }

  use(...handlers) {
    if (!handlers.length) {
      return this;
      // TODO attachSubRouter;
    }

    const [verb, path] = this.basePath ? ['all', this.basePath] : ['*', '*'];
    return this.route(verb, path, ...handlers);
  }

  route(verb, path, ...handlers) {
    const routes = this.routes;

    const setMethod = (method) => {
      if (path === SEP) {
        routes[method][HANDLER] = routes[method][HANDLER].concat(handlers);
        return;
      }

      const result = routes[method];
      const segs = split(path);
      let output = result;
      segs.forEach((element) => {
        const c = element.charCodeAt(0);
        if (c === COLON || c === ASTER) {
          const name = element.substr(1);
          let current = output[PARAM];
          if (current) {
            const currentName = current[NAME];
            if (currentName && currentName !== name) {
              throw new Error('duplic param');
            }
          } else {
            current = output[PARAM] = {
              [TYPE]: c === COLON ? PTYPE : ATYPE,
              [NAME]: name,
              [HANDLER]: [],
              [PARAM]: null
            };
          }
          output = current;
        } else {
          const name = element;
          let current = output[element];
          if (current) {
            // 需要检查吗？
          } else {
            current = output[element] = {
              [TYPE]: STYPE,
              [NAME]: name,
              [HANDLER]: [],
              [PARAM]: null
            };
          }
          output = current;
        }
      });

      output[HANDLER] = output[HANDLER].concat(handlers);
    };

    if (verb === 'all') {
      METHODS.forEach(setMethod);
    } else {
      setMethod(verb);
    }

    return this;
  }

  match(verb, url, param) {
    const segs = split(url);
    let route = this.routes[verb];
    for (let i = 0, len = segs.length; i < len; i++) {
      const part = segs[i];
      let out = route[part];
      if (!out) {
        out = route[PARAM];
        if (!out || out[TYPE] === 0) {
          return EMPTY_ARRAY;
        }
        param[out[NAME]] = part;
      }
      route = out;
    }
    return route[HANDLER];
  }
};
