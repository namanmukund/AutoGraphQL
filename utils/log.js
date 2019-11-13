import PrettyError from 'pretty-error';
import Raven from 'raven';
import isSentryAppAndEnv from './isSentryAppAndEnv';

const application = process.env.APPLICATION || 'core';
const env = process.env.NODE_ENV || 'development';

const pe = new PrettyError();
// we can optionally configure prettyError to simplify the stack trace:
pe.skipNodeFiles(); // this will skip events.js and http.js and similar core node files
pe.skipPackage('express', 'graphql'); // this will skip express and graphql core files
pe.appendStyle({
  // this is a simple selector to the element that says 'Error'
  'pretty-error > header > title > kind': {
    display: 'none',
  },
  'pretty-error > header > colon': {
    display: 'none',
  },
  'pretty-error > header > message': {
    color: 'bright-white',
    // we can use black, red, green, yellow, blue, magenta, cyan, white,
    // grey, bright-red, bright-green, bright-yellow, bright-blue,
    // bright-magenta, bright-cyan, and bright-white
    background: 'grey',
  },

  'pretty-error > trace > item > header > pointer > file': {
    color: 'bright-cyan',
  },

  'pretty-error > trace > item > header > pointer > colon': {
    color: 'cyan',
  },

  'pretty-error > trace > item > header > pointer > line': {
    color: 'bright-cyan',
  },

  'pretty-error > trace > item > header > what': {
    color: 'bright-white',
  },

  'pretty-error > trace > item > footer > addr': {
    display: 'none',
  },
});
// JSON stringify Replacer function to stringify Error objects
export const replaceErrors = (key, value) => {
  if (value instanceof Error) {
    const error = {};
    Object.getOwnPropertyNames(value).forEach((singleKey) => {
      error[singleKey] = value[singleKey];
    });
    return error;
  }
  return value;
};

const log = (string, type = 'status', isSentry = false, isError = false) => {
  let dstring = string;
  if (typeof string !== 'string') {
    dstring = JSON.stringify(string, replaceErrors);
  }
  const formattedString = pe.render(dstring);
  /* eslint-disable no-console */
  console.log(`${type}: ${formattedString}`);
  /* eslint-enable no-console */
  if (isSentry && isSentryAppAndEnv(application, env)) {
    if (isError) {
      Raven.captureException(`Error: ${formattedString}`);
    } else {
      Raven.captureMessage(`Message: ${formattedString}`);
    }
  }
};

// for logging map of form: {key1:[1,2,3]}
const logMapOfArrays = (map, status = '') => {
  log(`${status}:`);
  Object.keys(map).forEach((key) => {
    log(`${key}:`);
    if (map[key] && Array.isArray(map[key])) {
      map[key].forEach((element) => {
        log(element);
      });
    }
  });
};

const logArray = (array, status = '') => {
  log(`${status}:`);
  array.forEach((el) => {
    log(`${el}`);
  });
};

export { log, logMapOfArrays, logArray };
