import { get } from 'lodash';
import { validateTimeTableRule } from './utils/updateCampaignPrehookHelperMethods';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { DatabaseRecordNotFoundError } from '../../../../../constants/errors';

const getCampaignData = async (id) => {
  const query = `
    query{
      campaign(id:"${id}"){
        id
        school{
          id
        }
        batchCreationStatus
        timeTableRules{
          bookingDate
          slot0
          slot1
          slot2
          slot3
          slot4
          slot5
          slot6
          slot7
          slot8
          slot9
          slot10
          slot11
          slot12
          slot13
          slot14
          slot15
          slot16
          slot17
          slot18
          slot19
          slot20
          slot21
          slot22
          slot23
          allottedMentor{
            id
          }
          mentorSession{
            id
          }
        }
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
  const preParsedTimetableRules = campaignDoc && campaignDoc.timeTableRules;
  // parse the object to remove the prototype and hence compare with new timeTableRules input
  context.prevTimeTableRules = JSON.parse(JSON.stringify(preParsedTimetableRules));
};

export default updateCampaignValidation;
