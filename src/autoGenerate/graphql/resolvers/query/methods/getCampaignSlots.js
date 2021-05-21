import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import getSlotTimesInString from '../../../../../../utils/getSlotTimesInString';

const getCampaign = (code) => `
{
  campaigns(filter: {code: "${code}"}){
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
    poster {
      id
    }
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
  const { input: { code } } = params;
  // this will be sent in output
  const result = {};
  const slotsArray = [];

  const getCampaignRes = await callLocalGraphqlApi(getCampaign(code));
  console.log(code, JSON.stringify(get(getCampaignRes, 'data'), null, 2));
  const campaign = get(getCampaignRes, 'data.campaigns[0]', {});
  const schoolName = get(getCampaignRes, 'data.campaigns[0].school.name', '');
  const schoolLogoId = get(getCampaignRes, 'data.campaigns[0].school.logo.id', '');
  const posterId = get(getCampaignRes, 'data.campaigns[0].school.logo.id', '');
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
  result.poster = { type: 'File', typeId: `${posterId}` };
  result.campaignType = type;

  return result;
});

export default getCampaignSlots;
