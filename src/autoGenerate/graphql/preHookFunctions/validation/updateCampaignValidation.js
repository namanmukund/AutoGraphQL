import { get } from 'lodash';
import { validateTimeTableRule } from './utils/updateCampaignPrehookHelperMethods';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { DatabaseRecordNotFoundError } from '../../../../../constants/errors';

const getCampaignData = async (id) => {
  const query = `
    query{
      campaign(id:"${id}"){
        id
        batchCreationStatus
      }
    }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.campaign');
};

/* eslint-disable no-unused-vars */
const updateCampaignValidation = async (params, mutationName, context) => {
  const {
    id,
    input: {
      timeTableRules,
    },
  } = params;

  const campaignDoc = await getCampaignData(id);
  if (!(campaignDoc && campaignDoc.id)) {
    throw new DatabaseRecordNotFoundError();
  }

  context.prevBatchCreationStatus = campaignDoc && campaignDoc.batchCreationStatus;
  if (timeTableRules) {
    const timeTableRulesArray = get(timeTableRules, 'replace', []);
    for (let i = 0; i < timeTableRulesArray.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await validateTimeTableRule(timeTableRulesArray[i]);
    }
  }
};

export default updateCampaignValidation;
