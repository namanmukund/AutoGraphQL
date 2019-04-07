import { enrollmentTypes } from '../../../constants';

/*
checking if the topic fetched by user is unlocked or not, logic for isUnlocked=true is:
if fetched topic order is less than equal to current topic and user is pro or
if fetched topic order is less than equal to current topic and user and topic both are free
*/
const isTopicUnlocked = (enrollmentType, currentTopicOrder, topicOrder, isTrial) => {
  const { free, pro } = enrollmentTypes;
  if ((enrollmentType === pro &&
    topicOrder <= currentTopicOrder
  ) || (enrollmentType === free
    && topicOrder <= currentTopicOrder &&
    isTrial === true)
  ) {
    return true;
  }
  return false;
};

export default isTopicUnlocked;
