const SEP = '/';
const [STYPE, PTYPE, ATYPE] = [0, 1, 2];
const [SLASH, COLON, ASTER] = [47, 58, 42, 63]; // / : *

const METHODS = ['CONNECT', 'DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT', 'TRACE'];

const EMPTY_ARRAY = [];
Object.freeze(EMPTY_ARRAY);

const FILTER = Symbol('*');
const WAY = Symbol('way');

const PARAM = Symbol('param');
const NAME = Symbol('name');
const TYPE = Symbol('type');
const HANDLER = Symbol('handler');

const strip = (str) => {
  if (str === SEP) return str;
  str.charCodeAt(0) === SLASH && (str = str.substr(1));
  const len = str.length - 1;
  return str.charCodeAt(len) === SLASH ? str.substr(0, len) : str;
};

const split = (str) => ((str = strip(str)) === SEP ? EMPTY_ARRAY : str.split(SEP));

module.exports = class Router {
  constructor(path = null) {
    this.basePath = path;
    this[WAY] = null;
    this.routes = {
      // FILTER(*) for through filter (aka use) handler
      [FILTER]: {
        [TYPE]: STYPE,
        [NAME]: SEP,
        [HANDLER]: [],
        [PARAM]: null
      }
    };

    METHODS.forEach((verb) => {
      const bind = path ? [verb, path] : [verb];
      this[verb.toLowerCase()] = this.add.bind(this, ...bind);
      this.routes[verb] = {
        [TYPE]: STYPE,
        [NAME]: SEP,
        [HANDLER]: [],
        [PARAM]: null
      };
    });

    const bind = path ? ['all', path] : ['all'];
    this.all = this.add.bind(this, ...bind);
  }

  add(verb, path, ...handlers) {
    handlers.forEach((handle) => {
      if (typeof handle !== 'function') {
        throw new Error(
          `${verb} route '${path}' requires a [function] but got a [${typeof handle}]`
        );
      }
    });

    const { routes } = this;

    const parse = (method) => {
      const result = routes[method];

      if (path === SEP) {
        result[HANDLER] = [...result[HANDLER], ...handlers];
        return;
      }

      const segs = split(path);
      let output = result;
      const params = [];
      for (let i = 0, len = segs.length; i < len; i++) {
        const element = segs[i];
        const c = element.charCodeAt(0);
        switch (c) {
          case COLON:
          case ASTER: {
            const type = c === COLON ? PTYPE : ATYPE;
            if (type === ATYPE && i + 1 !== len) {
              throw new Error('should be last');
            }

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
                [TYPE]: type,
                [NAME]: name,
                [HANDLER]: [],
                [PARAM]: null
              };
            } else if (current[TYPE] !== type) {
              throw new Error('a param with same path already exist');
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

      output[HANDLER] = [...output[HANDLER], ...handlers];
    };

    if (verb === 'all') {
      METHODS.forEach(parse);
    } else {
      parse(verb);
    }

    return this;
  }

  filter(base = SEP, ...handlers) {
    if (typeof base === 'function') {
      const routes = this.routes[FILTER];
      routes[HANDLER] = [...routes[HANDLER], base, ...handlers];
    } else if (base === SEP) {
      const routes = this.routes[FILTER];
      routes[HANDLER] = [...routes[HANDLER], ...handlers];
    } else {
      this.add(FILTER, base, ...handlers);
    }
    return this;
  }

  match(verb, url, param) {
    const segs = split(url);
    let route = this[WAY][verb];
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

  build(others) {
    const findBase = (ways, path) => {
      const segs = split(path);
      for (let i = 0, len = segs.length; i < len; i++) {
        let name = segs[i];
        const c = name.charCodeAt(0);
        switch (c) {
          case (COLON, ASTER): {
            name = name.substr(1);
            const type = c === COLON ? PTYPE : ATYPE;
            let current = ways[PARAM];
            if (!current) {
              current = ways[PARAM] = {
                [TYPE]: type,
                [NAME]: name,
                [HANDLER]: [],
                [PARAM]: null
              };
            }
            ways = current;
            break;
          }
          default: {
            let current = ways[name];
            if (!current) {
              current = ways[name] = {
                [TYPE]: STYPE,
                [NAME]: name,
                [HANDLER]: [],
                [PARAM]: null
              };
            }
            ways = current;
            break;
          }
        }
      }
      return ways;
    };

    const merge = (dest, src) => {
      if (!src && !dest) {
        return null;
      }
      const out = dest || {
        [TYPE]: src[TYPE],
        [NAME]: src[NAME],
        [HANDLER]: [],
        [PARAM]: null
      };

      if (out[TYPE] !== src[TYPE]) {
        throw new Error('type missmatch');
      }

      out[HANDLER] = [...out[HANDLER], ...src[HANDLER]];

      Object.keys(src).forEach((key) => {
        out[key] = merge(out[key], src[key]);
      });

      out[PARAM] = merge(out[PARAM], src[PARAM]);

      return out;
    };

    const loop = (output, input, basePath) => {
      Object.keys(input).forEach((key) => {
        let out = output[key];
        if (!out) {
          out = output[key] = {
            [TYPE]: STYPE,
            [NAME]: SEP,
            [HANDLER]: [],
            [PARAM]: null
          };
        }
        merge(findBase(out, basePath), input[key]);
      });
      let out = output[FILTER];
      if (!out) {
        out = output[FILTER] = {
          [TYPE]: STYPE,
          [NAME]: SEP,
          [HANDLER]: [],
          [PARAM]: null
        };
      }
      merge(findBase(out, basePath), input[FILTER]);
    };

    const ways = (this[WAY] = {});

    // build ways
    loop(ways, this.routes, '/');

    // merge sub routers
    if (others) {
      others.forEach((other) => {
        loop(ways, other.routes, other.basePath);
      });
    }

    // applay fliters
    const perpand = (route, handler) => {
      {
        const target = route[HANDLER];
        if (target.length > 0) {
          route[HANDLER] = [...handler, ...target];
        }
      }

      Object.values(route).forEach((item) => {
        perpand(item, handler);
      });

      if (route[PARAM]) {
        perpand(route[PARAM], handler);
      }
    };

    const walk = (way, filter) => {
      Object.keys(filter).forEach((key) => {
        walk(way[key], filter[key]);
      });
      if (filter[PARAM]) {
        walk(way[PARAM], filter[PARAM]);
      }
      const handler = filter[HANDLER];
      if (way && handler.length > 0) {
        perpand(way, handler);
      }
    };

    const filter = ways[FILTER];
    Object.values(ways).forEach((way) => {
      walk(way, filter);
    });

    // todo: should freeze this[WAY]?
    return this;
  }

  toString() {
    const print = (route, prefix) => {
      if (prefix === void 0) prefix = '';

      const childs = Object.values(route.childs);
      const methods = Object.keys(route.methods).join(',');
      const lines = methods.length > 0 ? `${route.name} [${methods}]` : route.name;

      return `${prefix + lines}\n${childs
        .map((child, ix) => {
          const last = ix === childs.length - 1;
          const more = Object.keys(child.childs).length;
          const prefix_ = `${prefix + (last ? ' ' : '│')} `;

          return `${prefix + (last ? '└' : '├')}─${more ? '┬' : '─'} ${print(child, prefix_).slice(
            prefix.length + 2
          )}`;
        })
        .join('')}`;
    };

    const compose = (method, routes, obj) => {
      let name = routes[NAME];
      const type = routes[TYPE];
      if (type === PTYPE) {
        name = `: ${name}`;
      } else if (type === ATYPE) {
        name = `* ${name}`;
      }
      const item = obj[name] || {
        name,
        methods: {},
        childs: {}
      };
      obj[name] = item;
      if (routes[HANDLER].length > 0) {
        item.methods[method] = true;
      }
      Object.values(routes).forEach((route) => {
        compose(
          method,
          route,
          item.childs
        );
      });
      if (routes[PARAM]) {
        compose(
          method,
          routes[PARAM],
          item.childs
        );
      }
    };

    const routes = this[WAY];
    const tree = {};

    compose(
      '*',
      routes[FILTER],
      tree
    );
    Object.keys(routes).forEach((method) => {
      compose(
        method,
        routes[method],
        tree
      );
    });

    return print(tree['/']);
  }
};
