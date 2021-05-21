import { get } from 'lodash';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import getSelectedDays from '../../../postHookFunctions/utils/getSelectedDays';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { QueryController } from '../../../controllers';
import getPossibleDates from '../../../../../../utils/getPossibleDates';
import { MaxMentorSessionDaysError, StartEndDateError } from '../../../../../../constants/errors';
import { BULK_MENTOR_SESSION_DAYS_LIMIT } from '../../../../../../constants';
import getSelectedSlotsTime from '../../../preHookFunctions/validation/utils/getSelectedSlotsTime';
import { NoSlotSelectedError, OnlyOneSlotAllowedError } from '../../../../../../constants/errors/input';

// query to fetch mentorSession
const fetchMentorSessions = (userId, date) => `
  query{
    mentorSessions(
      filter: {and: [
        {sessionType: trial},
        {user_some: {id: "${userId}"}},
        {availabilityDate: "${date}"}
      ]}) {
      id
    }
  }
  `;

// mutation to add mentorSession
const createMentorSessions = (userId, date, slots) => `
  mutation {
    addMentorSession(input: {
      availabilityDate: "${date}",
      ${slots}
      sessionType: trial
    }, userConnectId: "${userId}") {
      id
    }
  }
  `;

// mutation to update mentorSession
const updateMentorSessions = (id, date, slots) => `
  mutation{
    updateMentorSession(id: "${id}", input: {
      availabilityDate: "${date}",
      ${slots}
    }) {
      id
    }
  }
  `;

/*
This is called when mentor tries to crate his sessions in bulk, here from frontend we will pass:
userId, timeTableRule(startDate, endDate, ...slots, ...weekdays)
in return we will send mentorSessions updated/added
*/
const bookB2B2CSlotsMutationResolver = async (
  root,
  params,
  typeName,
  info,
  mutationName,
  ast,
  context,
) => {
  validateAuthentication(context);
  const {
    input: {
      campaignId,
      studentProfileId,
      bookingDate,
      mentorSessionId,
      ...slots,
    },
  } = params;

  const slotTimeArray = getSelectedSlotsTime(slots);

  if (!slotTimeArray.length) {
    throw new NoSlotSelectedError();
  } else if (slotTimeArray.length > 1) {
    throw new OnlyOneSlotAllowedError();
  }

  // start, end dates
  const days = getSelectedDays(timeTableRule);
  const startDate = new Date(startDateInInput);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(endDateInInput);
  endDate.setHours(0, 0, 0, 0);

  // throw error in this case
  if (startDate > endDate) {
    throw new StartEndDateError();
  }

  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  const diffDays = Math.round(Math.abs((endDate - endDate) / oneDay));

  // throw error if duration for mentor sessions is more than 1 year
  if (diffDays > BULK_MENTOR_SESSION_DAYS_LIMIT) {
    throw new MaxMentorSessionDaysError();
  }

  // slots passed in input
  const { filteredSlotsString } = extractSlotsFromInput(slots);

  // getting dates on basis of startDate, endDate and days selected
  const possibleDates = getPossibleDates(startDate, endDate, days);

  // add/update mentorSession on the dates created and slots passed
  const mentorSessionArray = await constructMentorSessions(userId, possibleDates, filteredSlotsString);

  // constructing data in format to be returned
  const modelQuery = new QueryController('MentorSession', { bypass: true });
  const modelQueryRes = await modelQuery.fetchMultiple({ id: { $in: mentorSessionArray } });

  return {
    result: true,
  };
};

export default bookB2B2CSlotsMutationResolver;
