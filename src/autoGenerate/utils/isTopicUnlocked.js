import { enrollmentTypes, topicTypes } from '../../../constants';

/*
checking if the topic fetched by user is unlocked or not, logic for isUnlocked=true is:
if fetched topic order is less than equal to current topic and user is pro or
if fetched topic order is less than equal to current topic and user and topic both are free
*/
const isTopicUnlocked = (enrollmentType, currentTopicOrder, topicOrder, isTrial, page) => {
  const { free, pro } = enrollmentTypes;
  const { video } = topicTypes;
  if ((enrollmentType === pro &&
      topicOrder <= currentTopicOrder
  ) || (enrollmentType === free
    && topicOrder <= currentTopicOrder &&
    isTrial === true && page === video)
    || (enrollmentType === free
      && topicOrder <= currentTopicOrder &&
      page !== video)
  ) {
    return true;
  }
  return false;
};

export default isTopicUnlocked;
