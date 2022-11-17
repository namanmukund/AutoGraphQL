/* eslint-disable no-case-declarations */
import cuid from 'cuid';
import { get } from 'lodash';
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
      const loModal = getTypeQueryController(documentTypes.LEARNING_OBJECTIVE);
      const loData = await loModal.fetchOne({ id: get(input, 'learningObjective.typeId') });
      reportsInputObj = await userLearningObjectiveReportDump(input, loData);
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
    reportsInputObj = {
      ...reportsInputObj,
      id: cuid(),
      sessionId: activeSessionId || '',
      classroomId: activeClassroomId || '',
      mongoDocCreatedAt: get(input, 'createdAt'),
      mongoDocUpdatedAt: get(input, 'updatedAt'),
    };
    const userSessionDumpController = new MasterController(documentTypes.USER_SESSION_DUMP_TYPE);
    await userSessionDumpController.Model.create({ ...reportsInputObj });
  }
};

export default reportDumpPostHook;
