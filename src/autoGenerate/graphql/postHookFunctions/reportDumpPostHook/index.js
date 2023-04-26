/* eslint-disable no-case-declarations */
import cuid from 'cuid';
import { get } from 'lodash';
import { log } from '../../../../../utils';
import getDataFromContext from '../../../../../utils/getDataFromContext';
import { QueryController } from '../../controllers';
import MasterController from '../../controllers/MasterController';
import batchSessionReportDump from './batchSessionReportDump';
import userAssignmentReportDump from './userAssignmentReportDump';
import addUserBlockBasedPracticeReportDump from './userBlockBasedPracticeReportDump';
import addUserBlockBasedProjectReportDump from './userBlockBasedProjectReportDump';
import userLearningObjectiveReportDump from './userLearningObjectiveReportDump';
import userPracticeQuestionReportDump from './userPracticeQuestionReportDump';
import userQuizReportDump from './userQuizReportDump';
import userVideoReportDump from './userVideoReportDump';

const documentTypes = {
  USER_SESSION_DUMP_TYPE: 'UserSessionDump',
  FILE: 'File',
  LEARNING_OBJECTIVE: 'LearningObjective',
  ASSIGNMENT_QUESTION: 'AssignmentQuestion',
  BLOCK_BASED_PROJECT: 'BlockBasedProject',
  USER: 'User',
  STUDENT_PROFILE: 'StudentProfile',
};

const getTypeQueryController = (
  typeName,
  authentication = {
    bypass: true,
  },
) => new QueryController(typeName, authentication);

const reportDumpPostHook = async (input, mutationOrQueryName, context) => {
  let reportsInputObj = {};
  switch (mutationOrQueryName) {
    case 'addUserVideo':
    case 'updateUserVideo':
      reportsInputObj = await userVideoReportDump(input, mutationOrQueryName);
      break;
    case 'addUserQuizReport':
    case 'updateUserQuizReport':
      reportsInputObj = await userQuizReportDump(input, mutationOrQueryName);
      break;
    case 'addUserAssignment':
    case 'updateUserAssignment':
      const assignmentModal = getTypeQueryController(documentTypes.ASSIGNMENT_QUESTION);
      const assignmentIds = get(input, 'assignment', []).map((question) => get(question, 'assignmentQuestion.typeId'));
      const assignmentsData = await assignmentModal.fetchMultiple({ id: { $in: assignmentIds } });
      reportsInputObj = await userAssignmentReportDump(input, mutationOrQueryName, assignmentsData);
      break;
    case 'addUserBlockBasedPractice':
    case 'updateUserBlockBasedPractice':
      // Need to add gSuite as well
      let attachments = [];
      if (get(input, 'attachments', []).length) {
        const fileModal = getTypeQueryController(documentTypes.FILE);
        const attachmentIds = get(input, 'attachments', []).map((attachment) => get(attachment, 'typeId'));
        const attachmentsData = await fileModal.fetchMultiple({ id: { $in: attachmentIds } });
        attachments = attachmentsData.map((attachment) => get(attachment, 'uri'));
      }
      const blockBasedPracticeModal = getTypeQueryController(documentTypes.BLOCK_BASED_PROJECT);
      const blockBasedPracticeData = await blockBasedPracticeModal.fetchOne({ id: get(input, 'blockBasedPractice.typeId') });

      reportsInputObj = await addUserBlockBasedPracticeReportDump(input, mutationOrQueryName, attachments, blockBasedPracticeData);
      break;
    case 'addUserBlockBasedProject':
    case 'updateUserBlockBasedProject':
      reportsInputObj = await addUserBlockBasedProjectReportDump(input, mutationOrQueryName);
      break;
    case 'addUserLearningObjective':
    case 'updateUserLearningObjective':
      const loModal = getTypeQueryController(documentTypes.LEARNING_OBJECTIVE);
      const loData = await loModal.fetchOne({ id: get(input, 'learningObjective.typeId') });
      reportsInputObj = await userLearningObjectiveReportDump(input, loData, mutationOrQueryName);
      break;
    case 'addUserPracticeQuestionReport':
    case 'updateUserPracticeQuestionReport':
      const learningObjModal = getTypeQueryController(documentTypes.LEARNING_OBJECTIVE);
      const learningObjData = await learningObjModal.fetchOne({ id: get(input, 'learningObjective.typeId') });
      reportsInputObj = await userPracticeQuestionReportDump(input, mutationOrQueryName, learningObjData);
      break;
    case 'addBatchSession':
    case 'updateBatchSession':
    case 'deleteBatchSession':
      reportsInputObj = await batchSessionReportDump(input, context, mutationOrQueryName);
      break;
    default:
      break;
  }
  if (Object.keys(reportsInputObj).length) {
    const activeClassroomId = getDataFromContext(context, 'activeClassroom');
    const activeSessionId = getDataFromContext(context, 'activeSessionId');

    if (!reportsInputObj.classroomId) {
      reportsInputObj.classroomId = activeClassroomId;
      if (!reportsInputObj.classroomId && reportsInputObj.userId) {
        const studentProfileController = getTypeQueryController(documentTypes.STUDENT_PROFILE);
        const studentProfileRes = await studentProfileController.fetchMultiple({ 'user.typeId': reportsInputObj.userId });
        const studentProfile = studentProfileRes && studentProfileRes[0];
        if (studentProfile && !get(studentProfile, 'mentor.typeId')) {
          if (get(studentProfileRes[0], 'batch.typeId')) {
            reportsInputObj.classroomId = get(studentProfileRes[0], 'batch.typeId');
          } else if (get(studentProfileRes[0], 'batches', []).length) {
            reportsInputObj.classroomId = get(studentProfileRes[0], 'batches[0].typeId');
          }
        }
      }
    }
    reportsInputObj = {
      recordRawDump: [],
      ...reportsInputObj,
      id: cuid(),
      sessionId: activeSessionId || '',
      mongoDocCreatedAt: get(input, 'createdAt'),
      mongoDocUpdatedAt: get(input, 'updatedAt'),
    };
    const userSessionDumpController = new MasterController(documentTypes.USER_SESSION_DUMP_TYPE);
    log(reportsInputObj);
    await userSessionDumpController.Model.create({ ...reportsInputObj });
  }
};

export default reportDumpPostHook;
