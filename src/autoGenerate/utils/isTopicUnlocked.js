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
  batchCurrentComponentInfo,
  schoolInfo,
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
  // check if user belongs to a batch, we will calculate this on basis of batch
  // else we will do calculation as before
  if (batchCurrentComponentInfo) {
    const {
      currentTopic,
      enrollmentType: batchEnrollmentType,
    } = batchCurrentComponentInfo;

    const batchCurrentTopicOrder = currentTopic && currentTopic.order;
    let combinedEnrollmentType = (enrollmentType === free && batchEnrollmentType === free) ? free : pro;
    if (schoolInfo) {
      const schoolEnrollmentType = get(schoolInfo, 'enrollmentType', enrollmentTypes.free);
      combinedEnrollmentType = (combinedEnrollmentType === enrollmentTypes.free && schoolEnrollmentType === enrollmentTypes.free ? enrollmentTypes.free : enrollmentTypes.pro);
    }
    if ((combinedEnrollmentType === pro
      && topicOrder <= batchCurrentTopicOrder
    ) || (combinedEnrollmentType === free
      && topicOrder <= batchCurrentTopicOrder
      && checkIfTopicIsFree === true && page === video)
      || (combinedEnrollmentType === free
        && topicOrder <= batchCurrentTopicOrder
        && page !== video)
    ) {
      return true;
    }
  } else {
    /* eslint no-lonely-if:0 */
    let combinedEnrollmentType = enrollmentType;
    if (schoolInfo) {
      const schoolEnrollmentType = get(schoolInfo, 'enrollmentType', enrollmentTypes.free);
      combinedEnrollmentType = (combinedEnrollmentType === enrollmentTypes.free && schoolEnrollmentType === enrollmentTypes.free ? enrollmentTypes.free : enrollmentTypes.pro);
    }

    if ((combinedEnrollmentType === pro
      && topicOrder <= currentTopicOrder
    ) || (combinedEnrollmentType === free
      && topicOrder <= currentTopicOrder
      && checkIfTopicIsFree === true && page === video)
      || (combinedEnrollmentType === free
        && topicOrder <= currentTopicOrder
        && page !== video)
    ) {
      return true;
    }
  }
  return false;
};

export default isTopicUnlocked;
