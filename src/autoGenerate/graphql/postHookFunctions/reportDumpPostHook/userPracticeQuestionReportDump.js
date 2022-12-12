import { get } from 'lodash';
import { childTopicComponents, operationName } from '../../../../../constants';

const { add, update } = operationName;

const userPracticeQuestionReportDump = async (input, mutationOrQueryName) => {
  let eventType = add;
  if (mutationOrQueryName === 'updateUserPracticeQuestionReport') {
    eventType = update;
  }
  const reportsInputObj = {
    userId: get(input, 'user.typeId'),
    topicId: get(input, 'topic.typeId'),
    componentId: get(input, 'learningObjective.typeId'),
    componentType: childTopicComponents.practiceQuestion,
    eventType,
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
  // if (get(learningObjData, 'topics', []).length) {
  //   Object.assign(reportsInputObj, {
  //     topicId: get(learningObjData, 'topics[0].id'),
  //   });
  // }
  return reportsInputObj;
};

export default userPracticeQuestionReportDump;
