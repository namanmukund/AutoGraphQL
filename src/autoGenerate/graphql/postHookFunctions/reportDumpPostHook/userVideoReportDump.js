import { get } from 'lodash';
import { operationName, topicComponents } from '../../../../../constants';

const { add, update } = operationName;

const userVideoReportDump = async (input, mutationOrQueryName) => {
  let eventType = add;
  if (mutationOrQueryName === 'updateUserVideo') {
    eventType = update;
  }
  const reportsInputObj = {
    topicId: get(input, 'topic.typeId'),
    userId: get(input, 'user.typeId'),
    componentId: get(input, 'video.typeId'),
    componentType: topicComponents.video,
    eventType,
  };
  return reportsInputObj;
};

export default userVideoReportDump;
