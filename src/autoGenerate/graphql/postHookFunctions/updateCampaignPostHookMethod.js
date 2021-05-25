import { get } from 'lodash';
import { campaignTypes, batchCreationStatus } from '../../../../constants';
import { createB2BBatchesBasedOnBatchRules, createB2B2CEventBatchesBasedOnBatchRules } from '../../../../utils/createBatchesBasedOnBatchRules';

/* eslint-disable no-unused-vars */
const updateCampaignPostHookMethod = async (input, params, mutationName, context) => {
  const { id: campaignId, input: campaignInput, classesConnectIds } = params;
  const { batchRules, timeTableRules } = campaignInput;

  const courseId = get(input, 'course.typeId');
  const schoolId = get(input, 'school.typeId');

  const prevBatchCreationStatus = get(context, 'prevBatchCreationStatus');
  const type = get(input, 'type');

  // update campaign only when campaign type is b2b and batch creation status is todo
  if (type === campaignTypes.b2b && prevBatchCreationStatus === batchCreationStatus.todo) {
    createB2BBatchesBasedOnBatchRules(campaignId, courseId, batchRules, classesConnectIds, schoolId);
  } else if (type === campaignTypes.b2b2cEvent && prevBatchCreationStatus === batchCreationStatus.todo) {
    createB2B2CEventBatchesBasedOnBatchRules(campaignId, courseId, batchRules, timeTableRules, schoolId, classesConnectIds, context);
  }
};

export default updateCampaignPostHookMethod;
