module.exports = (req) => {
  const { url, _parsedUrl } = req;
  if (_parsedUrl && _parsedUrl._raw === url) {
    return _parsedUrl;
  }

  if (!url && url !== '') return void 0;

  const obj = {
    query: null,
    search: null,
    href: url,
    path: url,
    pathname: url,
    _raw: url
  };

  const idx = url.indexOf('?', 1);
  if (idx !== -1) {
    obj.search = url.substring(idx);
    obj.query = obj.search.substring(1);
    obj.pathname = url.substring(0, idx);
  }

  return (req._parsedUrl = obj);
};
