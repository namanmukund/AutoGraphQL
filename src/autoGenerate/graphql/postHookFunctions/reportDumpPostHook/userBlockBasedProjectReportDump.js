import { get } from 'lodash';
import { operationName, topicComponents } from '../../../../../constants';

const { add, update } = operationName;

const addUserBlockBasedProjectReportDump = async (input, mutationOrQueryName) => {
  let eventType = add;
  if (mutationOrQueryName === 'updateUserBlockBasedProject') {
    eventType = update;
  }
  const reportsInputObj = {
    topicId: get(input, 'topic.typeId'),
    userId: get(input, 'user.typeId'),
    componentId: get(input, 'blockBasedProject.typeId'),
    componentType: topicComponents.blockBasedProject,
    eventType,
    recordRawDump: [{
      link: get(input, 'answerLink', ''),
      savedBlocks: get(input, 'savedBlocks', ''),
      attachments: get(input, 'attachments', []).map((attachment) => get(attachment, 'id')),
    }],
  };
  return reportsInputObj;
};

export default addUserBlockBasedProjectReportDump;
