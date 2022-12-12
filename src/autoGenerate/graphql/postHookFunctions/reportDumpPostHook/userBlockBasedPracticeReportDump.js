import { get } from 'lodash';
import { operationName, topicComponents } from '../../../../../constants';

const { add, update } = operationName;

const addUserBlockBasedPracticeReportDump = async (input, mutationOrQueryName, attachments = [], blockBasedPracticeData) => {
  let eventType = add;
  if (mutationOrQueryName === 'updateUserBlockBasedPractice') {
    eventType = update;
  }
  let componentType = topicComponents.blockBasedPractice;
  if (get(blockBasedPracticeData, 'isHomework')) componentType = topicComponents.homeworkPractice;
  const reportsInputObj = {
    topicId: get(input, 'topic.typeId'),
    userId: get(input, 'user.typeId'),
    componentId: get(input, 'blockBasedPractice.typeId'),
    eventType,
    componentType,
    recordRawDump: [{
      link: get(input, 'answerLink', ''),
      savedBlocks: get(input, 'savedBlocks', ''),
      attachments,
    }],
  };
  return reportsInputObj;
};

export default addUserBlockBasedPracticeReportDump;
