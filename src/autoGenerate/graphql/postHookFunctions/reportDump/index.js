/* eslint-disable no-case-declarations */
import cuid from 'cuid';
import { get } from 'lodash';
import { childTopicComponents, operationName, topicComponents } from '../../../../../constants';
import getDataFromContext from '../../../../../utils/getDataFromContext';
import { QueryController } from '../../controllers';
import MasterController from '../../controllers/MasterController';

const {
  video, learningObjective, assignment, quiz, blockBasedProject,
  blockBasedPractice, homeworkPractice,
} = topicComponents;

const { practiceQuestion } = childTopicComponents;

const { add, update } = operationName;

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

const reportDump = async (input, mutationOrQueryName, context) => {
  const userSessionDumpController = new MasterController(documentTypes.USER_SESSION_DUMP_TYPE);
  let reportsInputObj = {};
  switch (mutationOrQueryName) {
    case 'addUserVideo':
    case 'updateUserVideo':
      reportsInputObj = {
        topicId: get(input, 'topic.typeId'),
        userId: get(input, 'user.typeId'),
        componentId: get(input, 'video.typeId'),
        componentType: video,
        eventType: add,
      };
      if (mutationOrQueryName === 'updateUserVideo') {
        Object.assign(reportsInputObj, {
          eventType: update,
        });
      }
      break;
    case 'addUserQuizReport':
    case 'updateUserQuizReport':
      reportsInputObj = {
        topicId: get(input, 'topic.typeId'),
        userId: get(input, 'user.typeId'),
        componentId: get(input, 'id'),
        componentType: quiz,
        eventType: add,
        recordRawDump: [{
          attempted: !!get(input, 'quizReport.totalQuestionCount', false),
          totalQuestionCount: get(input, 'quizReport.totalQuestionCount', 0),
          correctQuestionCount: get(input, 'quizReport.correctQuestionCount', 0),
          inCorrectQuestionCount: get(input, 'quizReport.inCorrectQuestionCount', 0),
          unansweredQuestionCount: get(input, 'quizReport.unansweredQuestionCount', 0),
          masteryLevel: get(input, 'quizReport.masteryLevel') || '',
          questions: get(input, 'quizAnswers', []).map((answer) => ({
            questionId: get(answer, 'question.typeId'),
            isAttempted: get(answer, 'isAttempted', false),
            isCorrect: get(answer, 'isCorrect'),
          })),
        }],
      };
      if (mutationOrQueryName === 'updateUserQuizReport') {
        Object.assign(reportsInputObj, {
          eventType: update,
        });
      }
      break;
    case 'addUserAssignment':
    case 'updateUserAssignment':
      const assignmentModal = getTypeQueryController(documentTypes.ASSIGNMENT_QUESTION);
      const assignmentIds = get(input, 'assignment', []).map((question) => get(question, 'assignmentQuestion.typeId'));
      const assignmentsData = await assignmentModal.fetchMultiple({ id: { $in: assignmentIds } });
      const assignmentQuestions = [];
      get(input, 'assignment', []).forEach((question) => {
        const assignmentQuestion = assignmentsData.find((assignmentData) => get(assignmentData, 'assignmentQuestion.typeId') === get(question, 'id'));
        if (assignmentQuestion) {
          assignmentQuestions.push({
            codingAssignmentId: get(question, 'assignmentQuestion.typeId'),
            attempted: !!get(question, 'userAnswerCodeSnippet'),
            isHomework: get(assignmentQuestion, 'isHomework', false),
            code: get(question, 'userAnswerCodeSnippet') && get(question, 'userAnswerCodeSnippet') !== 'null' ? get(question, 'userAnswerCodeSnippet') : '',
          });
        }
      });
      reportsInputObj = {
        topicId: get(input, 'topic.typeId'),
        userId: get(input, 'user.typeId'),
        componentId: get(input, 'id'),
        componentType: assignment,
        eventType: add,
        recordRawDump: assignmentQuestions,
      };
      if (mutationOrQueryName === 'updateUserAssignment') {
        Object.assign(reportsInputObj, {
          eventType: update,
        });
      }
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
      let componentType = blockBasedPractice;
      if (get(blockBasedPracticeData, 'isHomework')) componentType = homeworkPractice;
      reportsInputObj = {
        topicId: get(input, 'topic.typeId'),
        userId: get(input, 'user.typeId'),
        componentId: get(input, 'blockBasedPractice.typeId'),
        componentType,
        eventType: add,
        recordRawDump: [{
          link: get(input, 'answerLink', ''),
          savedBlocks: get(input, 'savedBlocks', ''),
          attachments,
        }],
      };
      if (mutationOrQueryName === 'updateUserBlockBasedPractice') {
        Object.assign(reportsInputObj, {
          eventType: update,
        });
      }
      break;
    case 'addUserBlockBasedProject':
    case 'updateUserBlockBasedProject':
      reportsInputObj = {
        topicId: get(input, 'topic.typeId'),
        userId: get(input, 'user.typeId'),
        componentId: get(input, 'blockBasedProject.typeId'),
        componentType: blockBasedProject,
        eventType: add,
        recordRawDump: [{
          link: get(input, 'answerLink', ''),
          savedBlocks: get(input, 'savedBlocks', ''),
          attachments: get(input, 'attachments', []).map((attachment) => get(attachment, 'id')),
        }],
      };
      if (mutationOrQueryName === 'updateUserBlockBasedProject') {
        Object.assign(reportsInputObj, {
          eventType: update,
        });
      }
      break;
    case 'addUserLearningObjective':
      const loModal = getTypeQueryController(documentTypes.LEARNING_OBJECTIVE);
      const loData = await loModal.fetchOne({ id: get(input, 'learningObjective.typeId') });
      reportsInputObj = {
        userId: get(input, 'user.typeId'),
        componentId: get(input, 'learningObjective.typeId'),
        componentType: learningObjective,
        eventType: add,
      };
      if (get(loData, 'topics', []).length) {
        Object.assign(reportsInputObj, {
          topicId: get(loData, 'topics[0].id'),
        });
      }
      break;
    case 'addUserPracticeQuestionReport':
    case 'updateUserPracticeQuestionReport':
      reportsInputObj = {
        userId: get(input, 'user.typeId'),
        componentId: get(input, 'learningObjective.typeId'),
        componentType: practiceQuestion,
        eventType: add,
        recordRawDump: [{
          firstTryCount: get(input, 'firstTryCount'),
          secondTryCount: get(input, 'secondTryCount'),
          threeOrMoreTryCount: get(input, 'threeOrMoreTryCount'),
          questions: get(input, 'detailedReport', []).map((report) => ({
            questionId: get(report, 'question.id'),
            firstTry: get(report, 'firstTry', false),
            secondTry: get(report, 'secondTry', false),
            thirdOrMoreTry: get(report, 'thirdOrMoreTry', false),
          })),
        }],
      };
      const learningObjModal = getTypeQueryController(documentTypes.LEARNING_OBJECTIVE);
      const learningObjData = await learningObjModal.fetchOne({ id: get(input, 'learningObjective.typeId') });
      if (get(learningObjData, 'topics', []).length) {
        Object.assign(reportsInputObj, {
          topicId: get(learningObjData, 'topics[0].id'),
        });
      }
      if (mutationOrQueryName === 'updateUserPracticeQuestionReport') {
        Object.assign(reportsInputObj, {
          eventType: update,
        });
      }
      break;
    default:
      break;
  }
  if (Object.keys(reportsInputObj).length) {
    const activeClassroomId = getDataFromContext(context, 'activeClassroom');
    const activeSessionId = getDataFromContext(context, 'activeSessionId');
    const docId = cuid();
    reportsInputObj = {
      ...reportsInputObj,
      id: docId,
      sessionId: activeSessionId || '',
      classroomId: activeClassroomId || '',
      mongoDocCreatedAt: get(input, 'createdAt'),
      mongoDocUpdatedAt: get(input, 'updatedAt'),
    };
    await userSessionDumpController.Model.create({ ...reportsInputObj });
  }
};

export default reportDump;
