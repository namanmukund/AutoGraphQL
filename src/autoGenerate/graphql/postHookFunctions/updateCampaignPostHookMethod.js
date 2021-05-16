import { get } from 'lodash';
import { campaignTypes, batchCreationStatus } from '../../../../constants';
import { fetchCampaign } from './utils/updateCampaignHelperMethods';

/* eslint-disable no-unused-vars */
const updateCampaignPostHookMethod = async (input, params, mutationName, context) => {
  const { id: campaignId, input: campaignInput, classesConnectIds } = params;
  const { batchRules } = campaignInput;

  const campaign = await fetchCampaign(campaignId);
  const courseId = get(campaign, 'course.id');
  // update campaign only when campaign type is b2b and batch creation status is todo
  if (campaign && campaign.type === campaignTypes.b2b && campaign.batchCreationStatus === batchCreationStatus.todo) {
    createBatchesBasedOnBatchRules(campaignId, courseId, batchRules, classesConnectIds);
  }
};

export default updateCampaignPostHookMethod;
