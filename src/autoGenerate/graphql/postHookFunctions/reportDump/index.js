/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-vars */
import cuid from 'cuid';
import MasterController from '../../controllers/MasterController';

const USER_SESSION_DUMP_TYPE = 'UserSessionDump';
const reportDump = async (input, mutationOrQueryName, context) => {
  const userSessionDumpController = new MasterController(USER_SESSION_DUMP_TYPE);
  switch (mutationOrQueryName) {
    case 'addUserQuiz':
      break;
    case 'updateUserQuiz':
      break;
    case 'addUserVideo':
      break;
    case 'updateUserVideo':
      break;
    case 'addUserAssignment':
      break;
    case 'updateUserAssignment':
      break;
    case 'addUserBlockBasedPractice':
      break;
    case 'updateUserBlockBasedPractice':
      break;
    case 'addUserLearningObjective':
      break;
    case 'updateUserLearningObjective':
      break;
    case 'addUserBlockBasedProject':
      break;
    case 'updateUserBlockBasedProject':
      break;
    default:
      break;
  }
  const docId = cuid();
  input.id = docId;
  const userSessionReport = await userSessionDumpController.Model.create({ ...input });
};

export default reportDump;
