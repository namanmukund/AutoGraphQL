import Raven from 'raven';
import path from 'path';
import sentryDSN from '../config/sentry/index';
import { version } from '../package.json';
import isSentryAppAndEnv from '../utils/isSentryAppAndEnv';

const release = version || 'norelease';
const env = process.env.NODE_ENV || 'development';
const application = process.env.APPLICATION || 'core';
if (isSentryAppAndEnv(application, env)) {
  Raven.config(sentryDSN, {
    release,
    autoBreadcrumbs: true,
    captureUnhandledRejections: true,
    dataCallback(data) {
      const stacktrace = data.exception && data.exception[0].stacktrace;
      if (stacktrace && stacktrace.frames) {
        stacktrace.frames.forEach((frame) => {
          if (frame.filename.startsWith('/')) {
            // eslint-disable-next-line no-param-reassign
            frame.filename = `app:///${path.basename(frame.filename)}`;
          }
        });
      }
      return data;
    },
  });
  Raven.install();
}

export default Raven;
