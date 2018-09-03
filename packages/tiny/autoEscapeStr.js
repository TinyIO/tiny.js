// Escaped characters. Use empty strings to fill up unused entries.
// Using Array is faster than Object/Map
const escapedCodes = [
  /* 0 - 9 */ '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '%09',
  /* 10 - 19 */ '%0A',
  '',
  '',
  '%0D',
  '',
  '',
  '',
  '',
  '',
  '',
  /* 20 - 29 */ '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  /* 30 - 39 */ '',
  '',
  '%20',
  '',
  '%22',
  '',
  '',
  '',
  '',
  '%27',
  /* 40 - 49 */ '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  /* 50 - 59 */ '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  /* 60 - 69 */ '%3C',
  '',
  '%3E',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  /* 70 - 79 */ '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  /* 80 - 89 */ '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  /* 90 - 99 */ '',
  '',
  '%5C',
  '',
  '%5E',
  '',
  '%60',
  '',
  '',
  '',
  /* 100 - 109 */ '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  /* 110 - 119 */ '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  /* 120 - 125 */ '',
  '',
  '',
  '%7B',
  '%7C',
  '%7D'
];

// Automatically escape all delimiters and unwise characters from RFC 2396.
// Also escape single quotes in case of an XSS attack.
// Return the escaped string.
function autoEscapeStr(rest) {
  let escaped = '';
  let lastEscapedPos = 0;
  /* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
  for (let i = 0, len = rest.length; i < len; ++i) {
    // `escaped` contains substring up to the last escaped character.
    const escapedChar = escapedCodes[rest.charCodeAt(i)];
    if (escapedChar) {
      // Concat if there are ordinary characters in the middle.
      if (i > lastEscapedPos) escaped += rest.slice(lastEscapedPos, i);
      escaped += escapedChar;
      lastEscapedPos = i + 1;
    }
  }
  if (lastEscapedPos === 0)
    // Nothing has been escaped.
    return rest;

  // There are ordinary characters at the end.
  if (lastEscapedPos < rest.length) escaped += rest.slice(lastEscapedPos);

  return escaped;
}

module.exports = autoEscapeStr;
