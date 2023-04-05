import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import { version } from '../../package.json';
import sentryDSN from '.';

const sentryConfig = {
  dsn: sentryDSN,
  environment: process.env.NODE_ENV || 'staging',
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Tracing.Integrations.Apollo(),
  ],
  tracesSampleRate: 1.0,
  release: version || 'norelease',
};

export default sentryConfig;
