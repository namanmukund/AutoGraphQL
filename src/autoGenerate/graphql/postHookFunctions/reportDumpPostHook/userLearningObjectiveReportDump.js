import { get } from 'lodash';
import { operationName, topicComponents } from '../../../../../constants';

const userLearningObjectiveReportDump = async (input, loData) => {
  const reportsInputObj = {
    userId: get(input, 'user.typeId'),
    topicId: get(input, 'topic.typeId'),
    componentId: get(input, 'learningObjective.typeId'),
    componentType: topicComponents.learningObjective,
    eventType: operationName.add,
  };
  if (get(loData, 'topics', []).length && !reportsInputObj.topicId) {
    Object.assign(reportsInputObj, {
      topicId: get(loData, 'topics[0].typeId'),
    });
  }
  return reportsInputObj;
};

export default userLearningObjectiveReportDump;
