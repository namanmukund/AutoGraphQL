import { get } from 'lodash';
import { campaignTypes, batchCreationStatus } from '../../../../constants';
import createBatchesBasedOnBatchRules from '../../../../utils/createBatchesBasedOnBatchRules';

/* eslint-disable no-unused-vars */
const updateCampaignPostHookMethod = async (input, params, mutationName, context) => {
  const { id: campaignId, input: campaignInput, classesConnectIds } = params;
  const { batchRules } = campaignInput;

  const courseId = get(input, 'course.typeId');
  const status = get(input, 'batchCreationStatus');
  const type = get(input, 'type');

  // update campaign only when campaign type is b2b and batch creation status is todo
  if (type === campaignTypes.b2b && status === batchCreationStatus.todo) {
    createBatchesBasedOnBatchRules(campaignId, courseId, batchRules, classesConnectIds);
  }
};

export default updateCampaignPostHookMethod;
