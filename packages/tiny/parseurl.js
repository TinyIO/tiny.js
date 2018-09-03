const autoEscapeStr = require('./autoEscapeStr.js');
const decodeURIComponent = require('./decodeURIComponent');

const PROTOCOL = /([a-z][a-z0-9.+-]{0,15}:)/.source;
const SLASHES = /(\/\/|)/.source;
const AUTH = /(?:([^@/?#]+?)@|@|)/.source;
const HOST = /([^@/?#\s"';<>\\^`{|}]{0,255}?)/.source;
const PATHNAME = /(\/[^?#]*|)/.source;
const SEARCH = /(\?[^#]*|)/.source;
const HASH = /(#.*|)/.source;

const HOSTNAME = /\[?(.+?)\]?/.source;
const PORT = /(?::(\d{0,24})|)/.source;

const URL = new RegExp(
  `^(?:${PROTOCOL}${SLASHES}${AUTH}${HOST}|)${PATHNAME}${SEARCH}${HASH}$`
);
const HOSTNAME_PORT = new RegExp(`^${HOSTNAME}${PORT}$`);

function parse(url) {
  let href = autoEscapeStr(url.trim());
  let [, protocol, slashes, auth, host, pathname, search, hash] = URL.exec(href) || [
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    href,
    undefined,
    undefined
  ];
  const [, hostname, port] = host ? HOSTNAME_PORT.exec(host.toLowerCase()) : [];
  if (slashes && hostname && !pathname) {
    pathname = '/';
    href += '/';
  }
  return {
    protocol,
    slashes: !!slashes || void 0,
    auth: auth ? decodeURIComponent(auth) : void 0,
    hostname,
    port,
    host,
    pathname: pathname || void 0,
    path: (pathname || '') + (search || '') || void 0,
    search: search || void 0,
    query: search ? search.substr(1) : void 0,
    hash: hash || void 0,
    href,
    _raw: url
  };
}

function fastparse(str) {
  if (typeof str !== 'string' || str.charCodeAt(0) !== 0x2f /* / */) {
    return parse(str);
  }

  let pathname = str;
  let query = null;
  let search = null;

  // This takes the regexp from https://github.com/joyent/node/pull/7878
  // Which is /^(\/[^?#\s]*)(\?[^#\s]*)?$/
  // And unrolls it into a for loop
  for (let i = 1, len = str.length; i < len; i++) {
    switch (str.charCodeAt(i)) {
      case 0x3f /* ?  */:
        if (search === null) {
          pathname = str.substr(0, i);
          query = str.substr(i + 1);
          search = str.substr(i);
        }
        break;
      case 0x09: /* \t */
      case 0x0a: /* \n */
      case 0x0c: /* \f */
      case 0x0d: /* \r */
      case 0x20: /*    */
      case 0x23: /* #  */
      case 0xa0:
      case 0xfeff:
        return parse(str);
    }
  }

  return {
    pathname,
    path: str,
    search,
    query,
    href: str,
    _raw: str
  };
}

function parseurl(req) {
  const { url, _parsedUrl } = req;
  if (_parsedUrl && _parsedUrl._raw === url) {
    return _parsedUrl;
  }
  if (!url && url !== '') return;
  const parsed = (req._parsedUrl = fastparse(url));
  return parsed;
}

module.exports = parseurl;
