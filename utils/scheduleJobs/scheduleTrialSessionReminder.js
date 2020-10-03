import { get, startCase, toLower } from 'lodash';
import callLocalGraphqlApi from '../../src/api/callLocalGraphqlApi';
import getSelectedSlotsStringArray
  from '../../src/autoGenerate/graphql/postHookFunctions/utils/getSelectedSlotsStringArray';
import getSlotLabel from '../getSlotLabel';
import getFormatedDate from '../getFormatedDate';
import sendWhatsAppTemplateMessage from '../../src/autoGenerate/utils/sendWhatsAppTemplateMessage';
import { MutationController } from '../../src/autoGenerate/graphql/controllers';

const updateScheduleStatusOfMenteeSession = (id) => {
  const modelMutations = new MutationController('MenteeSession', { bypass: true });
  return modelMutations.updateOne({ id }, { scheduleRunStatus: 'completed' });
};

const scheduleTrialSessionReminder = async () => {
  const date = new Date().setHours(0, 0, 0, 0);
  const parsedDate = new Date(date).toISOString();
  const hourValue = new Date().getHours();
  if (hourValue > 7 && hourValue < 22) {
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
          value: date,
        },
        {
          name: 'session_time',
          value: startTime,
        },
        ];

        // const phone = 919654347463;
        const phone = countryCode.split('+')[1] + parentNumber;
        sendWhatsAppTemplateMessage(
          phone,
          'reminder_new',
          'Tekie',
          parameters,
        );
        // update  status
        // eslint-disable-next-line no-await-in-loop
        await updateScheduleStatusOfMenteeSession(menteeSessionId);
      }
    }
  }
};

export default scheduleTrialSessionReminder;
