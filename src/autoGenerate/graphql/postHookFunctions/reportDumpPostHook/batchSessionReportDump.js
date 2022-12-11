import { get } from 'lodash';
import { operationName } from '../../../../../constants';
import { validateTokenAndExtractInformation } from '../../preHookFunctions/validation/utils';

const { add, update, delete: deleteOperation } = operationName;

const batchSessionReportDump = async (input, context, mutationOrQueryName) => {
  const userInfo = validateTokenAndExtractInformation(context, false);
  let eventType = add;
  if (mutationOrQueryName === 'updateBatchSession') eventType = update;
  if (mutationOrQueryName === 'deleteBatchSession') eventType = deleteOperation;
  const reportsInputObj = {
    topicId: get(input, 'topic.typeId'),
    componentType: 'batchSession',
    classroomId: get(input, 'batch.typeId'),
    sessionId: get(input, 'id'),
    componentId: get(input, 'id'),
    eventType,
    userId: get(userInfo, 'currentUser.id'),
    recordRawDump: [{
      sessionId: get(input, 'id'),
      classroomId: get(input, 'batch.typeId'),
      bookingDate: get(input, 'bookingDate'),
      sessionStartDate: get(input, 'sessionStartDate'),
      sessionEndDate: get(input, 'sessionEndDate'),
      sessionStatus: get(input, 'sessionStatus'),
    }],
  };
  return reportsInputObj;
};

export default batchSessionReportDump;
