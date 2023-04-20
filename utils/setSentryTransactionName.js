import * as Sentry from '@sentry/node';

const setSentryTransactionName = (transactionName) => {
  const scope = Sentry.getCurrentHub().getScope();
  const transaction = scope?.getTransaction(); // retrieve ongoing transaction

  if (transaction && !scope._transactionName) {
    // qualify transaction name
    // i.e. "POST /graphql" -> "POST /graphql: MyOperation"
    scope.setTransactionName(`${transaction.name}: ${transactionName}`);
  }
};

export default setSentryTransactionName;
