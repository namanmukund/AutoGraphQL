import { get } from 'lodash';
import { sessionStatus } from '../../../../constants';
import {
  removeStudentFromBatchSessionAttendance,
  fetchAllottedBatchSessions,
  fetchStudentProfile,
  fetchUserCurrentTopicComponentStatuses,
  fetchNextTopicId,
  updateUserCurrentTopicComponentStatus,
} from './utils/removeFromBatchStudentProfileHelperMethods';

/*
  Post hook of remove from batch student profile
*/
/* eslint-disable no-unused-vars */
const removeFromBatchStudentProfilePosthookMethod = async (input, params, mutationName, context) => {
  const { studentProfileId, batchId } = params;
  // fetch the batch sessions (allotted) which are linked to the given batchId
  const batchSessions = await fetchAllottedBatchSessions(batchId);
  if (batchSessions && batchSessions.length > 0) {
    // call to remove student for each batch
    /*  eslint-disable no-restricted-syntax */
    for (const batchSession of batchSessions) {
      removeStudentFromBatchSessionAttendance(batchSession, studentProfileId);
    }
  }
  // update userCurrTopicComponent to BatchCurrTopicComponent data
  // fetch student profile which provide current component status
  const studentProfiles = await fetchStudentProfile(studentProfileId, batchId);
  const studentProfile = studentProfiles && studentProfiles[0];

  // fetch the userCurrentComponent from the userId
  const userId = get(studentProfile, 'user.id', '');
  const userCurrentComponent = await fetchUserCurrentTopicComponentStatuses(userId);

  // proceed to update only if the current topic in batch is greater than current topic in user
  const batchCurrentTopicOrder = get(studentProfile, 'batch.currentComponent.currentTopic.order', '');
  const batchCurrentTopicComponentType = get(studentProfile, 'batch.currentComponent.currentTopicComponentType', '');
  const userCurrentTopicOrder = get(userCurrentComponent, 'currentTopic.order', '');
  const userCurrentComponentId = get(userCurrentComponent, 'id', '');
  if (batchCurrentTopicOrder > userCurrentTopicOrder) {
    // check latest session status and update accordingly
    const latestSessionStatus = get(studentProfile, 'batch.currentComponent.latestSessionStatus', '');
    if (latestSessionStatus !== sessionStatus.completed) {
      const batchCurrentTopicId = get(studentProfile, 'batch.currentComponent.currentTopic.id', '');
      const batchCurrentLOId = get(studentProfile, 'batch.currentComponent.currentLearningObjective.id', '');
      await updateUserCurrentTopicComponentStatus(userCurrentComponentId, batchCurrentTopicId, batchCurrentTopicComponentType, batchCurrentLOId);
    } else {
      const topics = await fetchNextTopicId(batchCurrentTopicOrder + 1);
      const nextTopicId = get(topics[0], 'id');
      const firstLearningObjectiveId = get(topics[0], 'learningObjectives[0].id', '')
      await updateUserCurrentTopicComponentStatus(userCurrentComponentId, nextTopicId, 'video', firstLearningObjectiveId);
    }
  }
};

export default removeFromBatchStudentProfilePosthookMethod;
