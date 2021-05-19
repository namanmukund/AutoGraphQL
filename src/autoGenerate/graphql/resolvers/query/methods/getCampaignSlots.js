import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import getSlotTimesInString from '../../../../../../utils/getSlotTimesInString';

const getCampaign = (id) => `
{
  campaign(id: "${id}"){
    timeTableRules{
      bookingDate
       ${getSlotTimesInString()}
      mentorSession{
        id
      }
      allottedMentor{
        id
      }
    }
    type
    school{
      id
      name
      logo{
        id
      }
    }
  }
}
`;

const getCampaignSlots = (async (root, params, context) => {
  validateAuthentication(context, 'app');
  context.currentUser = true;
  // getting input from params
  const { input: { campaignId } } = params;
  // this will be sent in output
  const result = {};
  const slotsArray = [];

  const getCampaignRes = await callLocalGraphqlApi(getCampaign(campaignId));
  const campaign = get(getCampaignRes, 'data.campaign', {});
  const schoolName = get(getCampaignRes, 'data.campaign.school.name', '');
  const schoolLogoId = get(getCampaignRes, 'data.campaign.school.logo.id', '');
  const { timeTableRules, type } = campaign;

  if (timeTableRules && timeTableRules.length) {
    timeTableRules.forEach((timeTableRule) => {
      const {
        bookingDate, mentorSession, allottedMentor, ...slots
      } = timeTableRule;

      slotsArray.push({
        bookingDate, allottedMentorId: allottedMentor && allottedMentor.id, mentorSessionId: mentorSession && mentorSession.id, ...slots,
      });
    });
  }
  result.slots = slotsArray;
  result.schoolName = schoolName;
  result.schoolLogo = { type: 'File', typeId: `${schoolLogoId}` };
  result.campaignType = type;

  return result;
});

export default getCampaignSlots;
