import { trimEnd, get, camelCase } from 'lodash';
import getParsedASTMap from '../utils/getParsedASTMap';
import { types } from '../../../utils';

let subscriptionString = 'type Subscription {';
const SUBSCRIPTION_PAYLOAD = 'SubscriptionPayload';
const subscriptionPayloadTypes = [];

const parsedASTMap = getParsedASTMap(types);

const getFilterName = (typeName) => `${typeName}Filter`;

const makeSubscriptionTypePayload = (
  type,
) => `type ${type}${SUBSCRIPTION_PAYLOAD}{
     mutation: String!,
     data: ${type}!
  }`;

Object.keys(parsedASTMap).forEach((type) => {
  const definition = parsedASTMap[type];
  const {
    subscribe,
  } = definition;
  if (get(subscribe, 'events', []).length) {
    const filterName = getFilterName(type);
    subscriptionString += `${camelCase(type)}(filter: ${filterName}) : ${type}${SUBSCRIPTION_PAYLOAD},`;
    subscriptionPayloadTypes.push(makeSubscriptionTypePayload(type));
  }
});

subscriptionString = trimEnd(subscriptionString, ',');
subscriptionString += '}';
const subscription = subscriptionString;

export { subscription, subscriptionPayloadTypes };
