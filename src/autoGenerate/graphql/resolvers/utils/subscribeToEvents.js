import { camelCase, get } from 'lodash';
import { mappedMutationsWithSubscriptionEvents } from '../../../../../constants/subscriptionEvents';

const subscribeToEvents = (
  typeName,
  mutationName,
  context,
  dbData,
  parsedASTMap,
) => {
  const { pubsub } = context;
  const mutationType = mutationName.split(typeName)[0];
  const { subscribe } = parsedASTMap[typeName];
  const subscribedEvents = get(subscribe, 'events', []);
  if (
    subscribedEvents.length
    && subscribedEvents.includes(mappedMutationsWithSubscriptionEvents[mutationType])
    && dbData && dbData.id
  ) {
    pubsub.publish(camelCase(typeName), {
      mutation: mappedMutationsWithSubscriptionEvents[mutationType],
      typeName: camelCase(typeName),
      typeId: dbData.id,
      dbData,
    });
  }
  return true;
};

export default subscribeToEvents;
