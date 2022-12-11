import { get } from 'lodash';
import { operationName, topicComponents } from '../../../../../constants';

const userLearningObjectiveReportDump = async (input, loData) => {
  const reportsInputObj = {
    userId: get(input, 'user.typeId'),
    componentId: get(input, 'learningObjective.typeId'),
    componentType: topicComponents.learningObjective,
    eventType: operationName.add,
  };
  if (get(loData, 'topics', []).length) {
    Object.assign(reportsInputObj, {
      topicId: get(loData, 'topics[0].id'),
    });
  }
  return reportsInputObj;
};

export default userLearningObjectiveReportDump;
