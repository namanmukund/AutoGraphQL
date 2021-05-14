import { get } from 'lodash';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import getSelectedDays from '../../../postHookFunctions/utils/getSelectedDays';
import extractSlotsFromInput from '../../../postHookFunctions/utils/extractSlotsFromInput';
import getPossibleDates from '../../../postHookFunctions/utils/getPossibleDates';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { QueryController } from '../../../controllers';

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
const createMentorSessions = (userId, courseId, date, slots) => `
  mutation {
    addMentorSession(input: {
      availabilityDate: "${date}",
      ${slots}
      sessionType: trial
    }, userConnectId: "${userId}", courseConnectId: "${courseId}") {
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

// method to add/update mentorSession on all the provided dates and slots
const constructMentorSessions = async (userId, courseId, possibleDates, filteredSlots) => {
  // mentorSessionIds array to track alll the mentorSession ids added + updated
  const mentorSessionsIdArray = [];
  if (possibleDates.length) {
    // eslint-disable-next-line no-restricted-syntax
    for (const date of possibleDates) {
      try {
        // fetching mentorSession on the given date and if it exists we will update otherwise create
        // eslint-disable-next-line no-await-in-loop
        const mentorSessionsQueryRes = await callLocalGraphqlApi(fetchMentorSessions(userId, date.toISOString()));
        const mentorSessionId = get(mentorSessionsQueryRes, 'data.mentorSessions[0].id', '');

        if (mentorSessionId) {
          // eslint-disable-next-line no-await-in-loop
          const updateMentorSessionsMutationRes = await callLocalGraphqlApi(updateMentorSessions(
            mentorSessionId,
            date.toISOString(),
            filteredSlots,
          ));
          const updatedMentorSessionId = get(updateMentorSessionsMutationRes, 'data.updateMentorSession.id', '');
          mentorSessionsIdArray.push(updatedMentorSessionId);
        } else {
          // eslint-disable-next-line no-await-in-loop
          const addMentorSessionsMutationRes = await callLocalGraphqlApi(createMentorSessions(
            userId,
            courseId,
            date.toISOString(),
            filteredSlots,
          ));
          const addMentorSessionId = get(addMentorSessionsMutationRes, 'data.addMentorSession.id', '');
          mentorSessionsIdArray.push(addMentorSessionId);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log('----------------------addBulkMentorSession error', e);
      }
    }
  }
  return mentorSessionsIdArray;
};

/*
This is called when mentor tries to crate his sessions in bulk, here from frontend we will pass:
userId, courseId, timeTableRule(startDate, endDate, ...slots, ...weekdays)
in return we will send mentorSessions updated/added
*/
const addBulkMentorSessionMutationResolver = async (
  root,
  params,
  typeName,
  info,
  mutationName,
  ast,
  context,
) => {
  validateAuthentication(context);
  const { input: { userId, courseId, timeTableRule } } = params;
  const { startDate: startDateInInput, endDate: endDateInInput, ...slots } = timeTableRule;

  // start, end dates
  const days = getSelectedDays(timeTableRule);
  const startDate = new Date(startDateInInput);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(endDateInInput);
  endDate.setHours(0, 0, 0, 0);

  // slots passed in input
  const { filteredSlotsString } = extractSlotsFromInput(slots);

  // getting dates on basis of startDate, endDate and days selected
  const possibleDates = getPossibleDates(startDate, endDate, days);

  // add/update mentorSession on the dates created and slots passed
  const mentorSessionArray = await constructMentorSessions(userId, courseId, possibleDates, filteredSlotsString);

  // constructing data in format to be returned
  const modelQuery = new QueryController('MentorSession', { bypass: true });
  const modelQueryRes = await modelQuery.fetchMultiple({ id: { $in: mentorSessionArray } });

  return modelQueryRes;
};

export default addBulkMentorSessionMutationResolver;
