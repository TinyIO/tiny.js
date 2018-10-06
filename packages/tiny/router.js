const SEP = '/';
const [STYPE, PTYPE, ATYPE] = [0, 1, 2];
const [SLASH, COLON, ASTER] = [47, 58, 42, 63]; // / : *

const METHODS = [
  'CONNECT',
  'DELETE',
  'GET',
  'HEAD',
  'OPTIONS',
  'PATCH',
  'POST',
  'PUT',
  'TRACE'
];

const EMPTY_ARRAY = [];

const PARAM = Symbol('param');
const NAME = Symbol('name');
const TYPE = Symbol('type');
const HANDLER = Symbol('handler');

const flattenRoutes = (route) => {};

const strip = (str) => {
  if (str === SEP) return str;
  str.charCodeAt(0) === SLASH && (str = str.substr(1));
  const len = str.length - 1;
  return str.charCodeAt(len) === SLASH ? str.substr(0, len) : str;
};

const split = (str) => ((str = strip(str)) === SEP ? [SEP] : str.split(SEP));

const addRoute = (router, verb, path, ...handlers) => {
  handlers.forEach((handle) => {
    if (typeof handle !== 'function') {
      throw new Error(
        `${verb} route '${path}' requires a [function] but got a [${typeof handle}]`
      );
    }
  });

  const routes = router.routes;

  const process = (method) => {
    if (path === SEP) {
      routes[method][HANDLER] = routes[method][HANDLER].concat(handlers);
      return;
    }

    const result = routes[method];
    const segs = split(path);
    let output = result;
    const params = [];
    for (let i = 0, len = segs.length; i < len; i++) {
      const element = segs[i];
      const c = element.charCodeAt(0);
      switch (c) {
        case COLON: {
          const name = element.substr(1);
          if (!name) {
            throw new Error('need param name');
          }
          let current = output[PARAM];
          if (!current) {
            params.forEach((param) => {
              if (param === name) {
                throw new Error('dup param');
              }
            });
            params.push(name);

            current = output[PARAM] = {
              [TYPE]: PTYPE,
              [NAME]: name,
              [HANDLER]: [],
              [PARAM]: null
            };
          } else if (current[TYPE] !== PTYPE) {
            throw new Error('param change type');
          } else if (current[NAME] !== name) {
            throw new Error('param change name');
          }
          output = current;
          break;
        }
        case ASTER: {
          let current = output[PARAM];
          const name = element.substr(1);
          if (!name) {
            throw new Error('need param name');
          }
          if (i + 1 !== len) {
            throw new Error('should be last');
          }
          if (!current) {
            params.forEach((param) => {
              if (param === name) {
                throw new Error('dup param');
              }
            });
            params.push(name);
            current = output[PARAM] = {
              [TYPE]: ATYPE,
              [NAME]: name,
              [HANDLER]: [],
              [PARAM]: null
            };
          } else if (current[TYPE] !== ATYPE) {
            throw new Error('param change type');
          } else if (current[NAME] !== name) {
            throw new Error('param change name');
          }
          output = current;
          break;
        }
        default: {
          let current = output[element];
          if (!current) {
            current = output[element] = {
              [TYPE]: STYPE,
              [NAME]: element,
              [HANDLER]: [],
              [PARAM]: null
            };
          }
          output = current;
          break;
        }
      }
    }

    output[HANDLER] = output[HANDLER].concat(handlers);
  };

  if (verb === 'all') {
    METHODS.forEach(process);
  } else {
    process(verb);
  }

  return router;
};

module.exports = class Router {
  constructor(path = null) {
    this.routes = {
      // * for through (aka use) handler
      '*': {
        [TYPE]: STYPE,
        [NAME]: SEP,
        [HANDLER]: [],
        [PARAM]: null
      }
    };

    METHODS.forEach((verb) => {
      const bind = [this, verb];
      if (path) {
        bind.push(path);
      }
      this[verb.toLowerCase()] = addRoute.bind(void 0, ...bind);
      this.routes[verb] = {
        [TYPE]: STYPE,
        [NAME]: SEP,
        [HANDLER]: [],
        [PARAM]: null
      };
    });

    const bind = [this, 'all'];
    if (path) {
      bind.push(path);
    }
    this.all = addRoute.bind(void 0, ...bind);

    if (!path) {
      this.route = (basePath) => {
        if (basePath) return new Router(basePath);
      };
    }
  }

  use(base = SEP, ...handlers) {
    if (typeof base === 'function') {
      const routes = this.routes['*'];
      routes[HANDLER] = routes[HANDLER].concat(base, handlers);
    } else if (base === SEP) {
      const routes = this.routes['*'];
      routes[HANDLER] = routes[HANDLER].concat(handlers);
    } else {
      addRoute(this, '*', base, ...handlers);
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
        if (!out) {
          return EMPTY_ARRAY;
        }
        if (out[TYPE] === ATYPE) {
          param[out[NAME]] = segs.slice(i);
          return out[HANDLER];
        }
        param[out[NAME]] = part;
      }
      route = out;
    }
    return route[HANDLER];
  }
};
