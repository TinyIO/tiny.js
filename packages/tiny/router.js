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
Object.freeze(EMPTY_ARRAY);

const FILTER = Symbol('*');

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

const split = (str) => ((str = strip(str)) === SEP ? [SEP] : str.split(SEP));

module.exports = class Router {
  constructor(path = null) {
    this.basePath = path;
    this.ways = {};
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
      const bind = [verb];
      if (path) {
        bind.push(path);
      }
      this[verb.toLowerCase()] = this.add.bind(this, ...bind);
      this.routes[verb] = {
        [TYPE]: STYPE,
        [NAME]: SEP,
        [HANDLER]: [],
        [PARAM]: null
      };
    });

    const bind = ['all'];
    if (path) {
      bind.push(path);
    }
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

    const routes = this.routes;

    const parse = (method) => {
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
              throw new Error('a param with same path already exist');
            } else if (current[NAME] !== name) {
              throw new Error('param change name');
            }
            output = current;
            break;
          }
          case ASTER: {
            if (i + 1 !== len) {
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
      METHODS.forEach(parse);
    } else {
      parse(verb);
    }

    return this;
  }

  filter(base = SEP, ...handlers) {
    if (typeof base === 'function') {
      const routes = this.routes[FILTER];
      routes[HANDLER] = routes[HANDLER].concat(base, handlers);
    } else if (base === SEP) {
      const routes = this.routes[FILTER];
      routes[HANDLER] = routes[HANDLER].concat(handlers);
    } else {
      this.add(FILTER, base, ...handlers);
    }
    return this;
  }

  match(verb, url, param) {
    const segs = split(url);
    let route = this.ways[verb];
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

  build(other) {
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

      if (out[TYPE] != src[TYPE]) {
        throw new Error('type missmatch');
      }

      out[HANDLER] = out[HANDLER].concat(src[HANDLER]);

      Object.keys(src).forEach((key) => {
        out[key] = merge(out[key], src[key]);
      });

      out[PARAM] = merge(out[PARAM], src[PARAM]);

      return out;
    };

    const loop = (output, input) => {
      Object.keys(input).forEach((key) => {
        output[key] = merge(output[key], input[key]);
      });
      output[FILTER] = merge(output[FILTER], input[FILTER]);
    };

    // 先merge所有subRouter

    const ways = (this.ways = {});

    loop(ways, this.routes);

    if (other) {
      loop(ways, other.routes);
    }

    // 然后applay自身所有Filter

    const perpand = (route, handler) => {
      Object.keys(route).forEach((key) => {
        const target = route[key][HANDLER];
        if (target.length > 0) {
          route[key][HANDLER] = handler.concat(target);
        }
      });

      if (route[PARAM]) {
        const target = route[PARAM][HANDLER];
        if (target.length > 0) {
          route[PARAM][HANDLER] = handler.concat(target);
        }
      }

      {
        const target = route[HANDLER];
        if (target.length > 0) {
          route[HANDLER] = handler.concat(target);
        }
      }
    };

    const walk = (way, filter) => {
      const handler = filter[HANDLER];
      if (way && handler.length > 0) {
        perpand(way, handler);
      }
      Object.keys(filter).forEach((key) => {
        walk(way[key], filter[key]);
      });
      if (filter[PARAM]) {
        walk(way[PARAM], filter[PARAM]);
      }
    };

    const filter = ways[FILTER];
    Object.keys(ways).forEach((key) => {
      walk(ways[key], filter);
    });

    // 最后冻结
  }

  toString() {
    const print = (route, prefix) => {
      if (prefix === void 0) prefix = '';

      const childs = Object.keys(route.childs);
      const methods = Object.keys(route.methods).join(',');
      const lines = methods.length > 0 ? `${route.name} [${methods}]` : route.name;

      return `${prefix + lines}\n${childs
        .map((key, ix) => {
          const child = route.childs[key];
          const last = ix === childs.length - 1;
          const more = Object.keys(child.childs).length;
          const prefix_ = `${prefix + (last ? ' ' : '│')} `;

          return `${prefix + (last ? '└' : '├')}─${more ? '┬' : '─'} ${print(
            child,
            prefix_
          ).slice(prefix.length + 2)}`;
        })
        .join('')}`;
    };

    const compose = (method, route, obj) => {
      let name = route[NAME];
      const type = route[TYPE];
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
      if (route[HANDLER].length > 0) {
        item.methods[method] = true;
      }
      Object.keys(route).forEach((key) => {
        compose(
          method,
          route[key],
          item.childs
        );
      });
      if (route[PARAM]) {
        compose(
          method,
          route[PARAM],
          item.childs
        );
      }
    };

    const routes = this.ways;
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
