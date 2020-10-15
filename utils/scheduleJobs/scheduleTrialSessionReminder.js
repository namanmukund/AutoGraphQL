import { get, startCase, toLower } from 'lodash';
import callLocalGraphqlApi from '../../src/api/callLocalGraphqlApi';
import getSelectedSlotsStringArray
  from '../../src/autoGenerate/graphql/postHookFunctions/utils/getSelectedSlotsStringArray';
import getSlotLabel from '../getSlotLabel';
import getFormatedDate from '../getFormatedDate';
import sendWhatsAppTemplateMessage from '../../src/autoGenerate/utils/sendWhatsAppTemplateMessage';
import getLongDate from '../getLongDate';
import transactionalMessageBody from '../../constants/transactionalMessageBody';
import updateScheduleStatusOfMenteeSession from './updateScheduleStatusOfMenteeSession';

const getMentorMenteeSession = async(menteeSessionId) => {
  const query = `
 query{
  mentorMenteeSessions(filter:{
      menteeSession_some:{id:"${menteeSessionId}"}
  }){
    id
    mentorSession{
      id
      user{
        id
        name
        mentorProfile{
          id
          sessionLink
        }
      }
    }
  }
}
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.mentorMenteeSessions[0]');
};
const scheduleTrialSessionReminder = async () => {
  const dt = new Date().setHours(0, 0, 0, 0);
  const parsedDate = new Date(dt).toISOString();
  const hourValue = new Date().getHours();
  if (hourValue > 6 && hourValue < 22) {
    const query = `
query{
  menteeSessions(
    filter:{
      and:[
        {scheduleRunStatus_not_in:[completed]}
        {bookingDate: "${parsedDate}"}
        {topic_some:{order:1}}
        {or:[
          {slot${hourValue + 1}:true}
          {slot${hourValue + 2}:true}
          {slot${hourValue + 3}:true}
        ]}
      ]
    }
  ){
    id
    bookingDate
    slot${hourValue + 1}
    slot${hourValue + 2}
    slot${hourValue + 3}
    user{
      id
      name
      studentProfile{
        id
        parents{
          id
          user{
            id
            name
            phone{
              countryCode
              number
            }
          }
        }
      }
    }
  }
}
`;
    const menteeSessionsData = await callLocalGraphqlApi(query);
    const menteeSessions = get(menteeSessionsData, 'data.menteeSessions');
    if (menteeSessions && menteeSessions.length) {
      // eslint-disable-next-line no-restricted-syntax
      for (const menteeSession of menteeSessions) {
        const {
          id: menteeSessionId, user: menteeInfo, bookingDate, ...slots
        } = menteeSession;

        const slotTimeStringArray = getSelectedSlotsStringArray(slots);
        if (slotTimeStringArray && slotTimeStringArray.length) {
          const slotNumber = slotTimeStringArray[0].split('slot')[1];
          const { startTime, endTime } = getSlotLabel(slotNumber);

          const parentInfo = get(menteeInfo, 'studentProfile.parents[0].user');
          const menteeObj = {
            date: getFormatedDate(bookingDate),
            startTime,
            endTime,
            name: startCase(toLower(get(menteeInfo, 'name') || '')),
            grade: get(menteeInfo, 'studentProfile.grade') || '',
            parentName: startCase(toLower(get(parentInfo, 'name') || '')),
            parentEmail: get(parentInfo, 'email') || '',
            parentNumber: get(parentInfo, 'phone.number') || '',
            countryCode: get(parentInfo, 'phone.countryCode') || '',
          };

          const {
            parentName, parentNumber, countryCode, name,
          } = menteeObj;
          // eslint-disable-next-line no-await-in-loop
          const mentorMenteeSession = await getMentorMenteeSession(menteeSessionId);
          const sessionLink = get(mentorMenteeSession, 'mentorSession.user.mentorProfile.sessionLink');
          const parameters = [{
            name: 'parent_name',
            value: parentName,
          },
          {
            name: 'student_name',
            value: name,
          },
          {
            name: 'session_date',
            value: getLongDate(bookingDate),
          },
          {
            name: 'session_time',
            value: startTime,
          },
          {
            name: 'phone',
            value: `${countryCode}-${parentNumber}`,
          },
          {
            name: 'session_link',
            value: sessionLink,
          },
          ];

          // const phone = 919654347463;
          const phone = countryCode.split('+')[1] + parentNumber;
          // eslint-disable-next-line no-await-in-loop
          await sendWhatsAppTemplateMessage(
            phone,
            transactionalMessageBody.sessionReminder,
            parentName,
            parameters,
          );
          // update  status
          // eslint-disable-next-line no-await-in-loop
          await updateScheduleStatusOfMenteeSession(menteeSessionId, 'completed');
        }
      }
    }
  }
};

export default scheduleTrialSessionReminder;
