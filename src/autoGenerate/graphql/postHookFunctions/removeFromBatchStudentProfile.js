import {
  removeStudentFromBatchSessionAttendance,
  fetchAllottedBatchSessions,
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
    for (const batchSession of batchSessions) {
      removeStudentFromBatchSessionAttendance(batchSession, studentProfileId);
    }
  }

};

export default removeFromBatchStudentProfilePosthookMethod;
