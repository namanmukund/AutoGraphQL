/* eslint-disable no-restricted-syntax */
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import { ApolloError } from 'apollo-server-express';
import sentryDSN from '../config/sentry/index';
import { version } from '../package.json';
import { log } from '../utils';
import isAPMEnabledAppAndEnv from '../utils/isAPMEnabledAppAndEnv';
import setSentryTransactionName from '../utils/setSentryTransactionName';

const APMConnectors = {
  SENTRY: 'sentry',
};

const release = version || 'norelease';
const env = process.env.NODE_ENV || 'staging';
const application = process.env.APPLICATION || 'core';

class APM {
  apmInstances = [];

  constructor(config = {}) {
    if (isAPMEnabledAppAndEnv(application, env)) {
      for (const key of Object.keys(config)) {
        switch (key) {
          case APMConnectors.SENTRY: {
            const sentryInstance = Sentry.init(config[key]);
            log('Sentry APM Initialized');
            this.apmInstances.push({
              type: APMConnectors.SENTRY,
              instance: sentryInstance,
            });
            break;
          }
          default: {
            break;
          }
        }
      }
    }
  }

  setRequestAndTracingHandlers = (app) => {
    // Must configure Sentry before doing anything else with it
    if (isAPMEnabledAppAndEnv(application, env)) {
      for (const instance of this.apmInstances) {
        switch (instance.type) {
          case APMConnectors.SENTRY: {
            // The request handler must be the first middleware on the app
            app.use(Sentry.Handlers.requestHandler());

            // TracingHandler creates a trace for every incoming request
            app.use(Sentry.Handlers.tracingHandler());
            break;
          }
          default: {
            break;
          }
        }
      }
    }
  };

  setErrorHandler = (app) => {
    for (const instance of this.apmInstances) {
      switch (instance.type) {
        case APMConnectors.SENTRY: {
          app.use(Sentry.Handlers.errorHandler());
          break;
        }
        default: {
          break;
        }
      }
    }
  };

  setContext = (label, context) => {
    for (const instance of this.apmInstances) {
      switch (instance.type) {
        case APMConnectors.SENTRY: {
          Sentry.setContext(label, context);
          break;
        }
        default: {
          break;
        }
      }
    }
  };

  captureException = (reason) => {
    for (const instance of this.apmInstances) {
      switch (instance.type) {
        case APMConnectors.SENTRY: {
          Sentry.captureException(reason);
          break;
        }
        default: {
          break;
        }
      }
    }
  };

  captureException = (message) => {
    for (const instance of this.apmInstances) {
      switch (instance.type) {
        case APMConnectors.SENTRY: {
          Sentry.captureMessage(message);
          break;
        }
        default: {
          break;
        }
      }
    }
  };

  setTransactionName = (request) => {
    if (request && request.operationName) {
      const mutationName = request.operationName || '';
      const operationName = mutationName.charAt(0).toUpperCase() + mutationName.slice(1);

      for (const instance of this.apmInstances) {
        switch (instance.type) {
          case APMConnectors.SENTRY: {
            setSentryTransactionName(operationName);
            break;
          }
          default: {
            break;
          }
        }
      }
    }
  };

  getPluginsForApollo = () => {
    const plugins = [];
    for (const instance of this.apmInstances) {
      switch (instance.type) {
        case APMConnectors.SENTRY: {
          plugins.push(this.buildSentryApolloPlugin());
          break;
        }
        default: {
          break;
        }
      }
    }
    return plugins;
  };

  buildSentryApolloPlugin = () => ({
    requestDidStart({ request }) {
      if (request.operationName) {
        setSentryTransactionName(request.operationName);
      }
      /* Within this returned object, define functions that respond
            to request-specific lifecycle events. */
      return {
        didEncounterErrors(ctx) {
          // If we couldn't parse the operation, don't
          // do anything here
          if (!ctx.operation) {
            return;
          }

          // eslint-disable-next-line no-restricted-syntax
          for (const err of ctx.errors) {
            // Only report internal server errors,
            // all errors extending ApolloError should be user-facing
            if (err instanceof ApolloError) {
              // eslint-disable-next-line no-continue
              continue;
            }

            // Add scoped report details and send to Sentry
            Sentry.withScope((scope) => {
              // Annotate whether failing operation was query/mutation/subscription
              scope.setTag('kind', ctx.operation.operation);

              // Log query and variables as extras (make sure to strip out sensitive data!)
              scope.setExtra('query', ctx.request.query);
              scope.setExtra('variables', ctx.request.variables);

              if (err.path) {
                // We can also add the path as breadcrumb
                scope.addBreadcrumb({
                  category: 'query-path',
                  message: err.path.join(' > '),
                  level: 'debug',
                });
              }

              const transactionId = ctx.request.http.headers.get('x-transaction-id');
              if (transactionId) {
                scope.setTransaction(transactionId);
              }

              Sentry.captureException(err);
            });
          }
        },
      };
    },
  });
}

const sentryConfig = {
  dsn: sentryDSN,
  environment: env,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Tracing.Integrations.Apollo(),
  ],
  tracesSampleRate: 1.0,
  release,
};

export default new APM({
  [APMConnectors.SENTRY]: sentryConfig,
});
