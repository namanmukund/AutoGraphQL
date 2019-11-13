import { enrollmentTypes, topicTypes } from '../../../constants';

/*
checking if the topic fetched by user is unlocked or not, logic for isUnlocked=true is:
if fetched topic order is less than equal to current topic and user is pro or
if fetched topic order is less than equal to current topic and user and topic both are free
*/
const isTopicUnlocked = (
  enrollmentType,
  currentTopicOrder,
  topicOrder,
  isTrial,
  page,
  checkForPaidLogic,
) => {
  const { free, pro } = enrollmentTypes;
  const { video } = topicTypes;
  // checkForPaidLogic is added to check if we need to validate component for locked/unlocked
  // on basis of whether topic is paid/free.
  // If call for addUserActivityVideoDump/userVideo is made from
  // backend application, we will not check for paid component logic since we will be skipping
  // the video with status as skipped
  let checkIfTopicIsFree = isTrial;
  if (!checkForPaidLogic) checkIfTopicIsFree = true;
  if ((enrollmentType === pro
      && topicOrder <= currentTopicOrder
  ) || (enrollmentType === free
    && topicOrder <= currentTopicOrder
    && checkIfTopicIsFree === true && page === video)
    || (enrollmentType === free
      && topicOrder <= currentTopicOrder
      && page !== video)
  ) {
    return true;
  }
  return false;
};

export default isTopicUnlocked;
