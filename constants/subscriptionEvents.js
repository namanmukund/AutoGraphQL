const CREATED = 'CREATED';
const UPDATED = 'UPDATED';
const DELETED = 'DELETED';

const mappedMutationsWithSubscriptionEvents = {
  add: CREATED,
  update: UPDATED,
  delete: DELETED,
};

const allEvents = [
  CREATED,
  UPDATED,
  DELETED,
];

export {
  CREATED,
  UPDATED,
  DELETED,
  allEvents,
  mappedMutationsWithSubscriptionEvents,
};
