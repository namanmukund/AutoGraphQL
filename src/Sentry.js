import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import { ApolloError } from 'apollo-server-express';
import sentryDSN from '../config/sentry/index';
import { version } from '../package.json';
import isSentryAppAndEnv from '../utils/isSentryAppAndEnv';

const release = version || 'norelease';
const env = process.env.NODE_ENV || 'development';
const application = process.env.APPLICATION || 'core';
if (isSentryAppAndEnv(application, env)) {
  Sentry.init({
    dsn: sentryDSN,
    environment: env,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Tracing.Integrations.Apollo(),
    ],
    tracesSampleRate: 1.0,
    release,
  });
}

export const setSentryTransactionName = (request) => {
  const scope = Sentry.getCurrentHub().getScope();
  const transaction = scope?.getTransaction(); // retrieve ongoing transaction

  if (transaction) {
    const mutationName = request.operationName || '';
    const operationName =
      mutationName.charAt(0).toUpperCase() + mutationName.slice(1);
    // qualify transaction name
    // i.e. "POST /graphql" -> "POST /graphql: MyOperation"
    scope?.setTransactionName(`${transaction.name}: ${operationName}`);
  }
};

export const SentryApolloPlugin = {
  requestDidStart({ request }) {
    if (request.operationName) {
      setSentryTransactionName(request);
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
                level: Sentry.Severity.Debug,
              });
            }

            const transactionId = ctx.request.http.headers.get(
              'x-transaction-id',
            );
            if (transactionId) {
              scope.setTransaction(transactionId);
            }

            Sentry.captureException(err);
          });
        }
      },
    };
  },
};

export default Sentry;
