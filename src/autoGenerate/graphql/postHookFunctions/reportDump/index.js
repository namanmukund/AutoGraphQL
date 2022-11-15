/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-vars */
import cuid from 'cuid';
import MasterController from '../../controllers/MasterController';

const USER_SESSION_DUMP_TYPE = 'UserSessionDump';
const reportDump = async (input, mutationOrQueryName, context) => {
  const userSessionDumpController = new MasterController(USER_SESSION_DUMP_TYPE);
  switch (mutationOrQueryName) {
    case 'userQuiz':
      break;
    case 'userVideo':
      break;
    case 'userAssignment':
      break;
    case 'userBlockBasedProject':
      break;
    case 'userLearningObjective':
      break;
    case 'userBlockBasedPractice':
      break;
    case 'addUserActivityVideoDump':
      break;
    case 'addUserActivityChatDump':
      break;
    case 'addUserActivityPQDump':
      break;
    case 'addUserActivityQuizDump':
      break;
    case 'addUserActivityAssignmentDump':
      break;
    case 'addUserActivityComicStripDump':
      break;
    case 'addUserActivityBlockBasedPracticeDump':
      break;
    case 'addUserActivityBlockBasedProjectDump':
      break;
    case 'addUserActivityLearningSlideDump':
      break;
    default:
      break;
  }
  const docId = cuid();
  input.id = docId;
  const userSessionReport = await userSessionDumpController.Model.create({ ...input });
};

export default reportDump;
