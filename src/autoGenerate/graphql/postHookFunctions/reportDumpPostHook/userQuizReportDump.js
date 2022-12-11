import { get } from 'lodash';
import { operationName, topicComponents } from '../../../../../constants';

const { add, update } = operationName;

const userQuizReportDump = async (input, mutationOrQueryName) => {
  let eventType = add;
  if (mutationOrQueryName === 'updateUserQuizReport') {
    eventType = update;
  }
  const reportsInputObj = {
    topicId: get(input, 'topic.typeId'),
    userId: get(input, 'user.typeId'),
    componentId: get(input, 'id'),
    componentType: topicComponents.quiz,
    eventType,
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
  return reportsInputObj;
};

export default userQuizReportDump;
