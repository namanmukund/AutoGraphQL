import {
  InvalidSubscriptionKeyError,
  SubscriptionKeyNotDefinedError,
} from '../../../../../constants/errors/types';

const injectSubscriptionWithCommonAsyncIterator = (
  subscriptionKey,
  resolver = (payload) => payload,
) => {
  if (!subscriptionKey) {
    throw new SubscriptionKeyNotDefinedError();
  }
  if (!Array.isArray(subscriptionKey)) {
    throw new InvalidSubscriptionKeyError();
  }
  const subscriptionPayload = {
    subscribe: (root, params, context) => {
      const { pubsub } = context;
      return pubsub.asyncIterator(subscriptionKey);
    },
    resolve: resolver,
  };
  return subscriptionPayload;
};

export default injectSubscriptionWithCommonAsyncIterator;
