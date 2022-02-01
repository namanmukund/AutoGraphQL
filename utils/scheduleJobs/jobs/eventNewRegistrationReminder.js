/* eslint-disable no-unused-vars */
import { get } from 'lodash';
import moment from 'moment';
import getIntlDateTime from '../../timeZoneDiff';
import callLocalGraphqlApi from '../../../src/api/callLocalGraphqlApi';
import getSelectedSlotsStringArray from '../../../src/autoGenerate/graphql/postHookFunctions/utils/getSelectedSlotsStringArray';
import getSlotTimesInString from '../../getSlotTimesInString';
import sendWhatsAppTemplateMessage from '../../../src/autoGenerate/utils/sendWhatsAppTemplateMessage';

const addToCommsSendLogs = async ({
  templateName, triggeredAt, studentProfileId, eventId,
}) => {
  const addQuery = `mutation {
    addCommsSendLog(
      input: { templateName: "${templateName}", triggeredAt: "${new Date(triggeredAt).toISOString()}" }
      studentProfileConnectId: "${studentProfileId}"
      eventConnectId: "${eventId}"
    ) {
      id
    }
  }
  `;
  const result = await callLocalGraphqlApi(addQuery);
  return get(result, 'data.addCommsSendLog', null);
};

const getEventDetails = async (eventId) => {
  const query = `{
  event(id: "${eventId}") {
    id
    name
    eventTimeTableRule {
      startDate
      endDate
      ${getSlotTimesInString()}
    }
    timeZone
    geoLocation
    locationType
    pincode
    address
    city
    state
    meetingId
    meetingPassword
    sessionLink
    summary
    overview
    speakers {
      id
      user {
        id
        name
      }
    }
  }
}
`;
  const eventDetail = await callLocalGraphqlApi(query);
  return get(eventDetail, 'data.event');
};

const getUserDetail = async (studentProfileId) => {
  const userQuery = `{
  studentProfile(id: "${studentProfileId}") {
    parents {
      user {
        name
        email
        phone {
          countryCode
          number
        }
      }
    }
    grade
    user{
      name
    }
  }
}`;
  const studentProfile = await callLocalGraphqlApi(userQuery);
  return get(studentProfile, 'data.studentProfile');
};

const eventNewRegistrationReminder = async ({
  eventId,
  studentProfileId,
  commsVariables,
  templateName,
  isEmailRule,
}, deleteJob = () => { }) => {
  const eventDetail = await getEventDetails(eventId);
  const userDetail = await getUserDetail(studentProfileId);
  const { ...slots } = get(eventDetail, 'eventTimeTableRule', {});
  const slotTimeStringArray = getSelectedSlotsStringArray(slots);
  const slotNumber = slotTimeStringArray[0].split('slot')[1];
  const startDate = get(eventDetail, 'eventTimeTableRule.startDate', '');
  const timeZone = get(eventDetail, 'timeZone');
  const { dateObject, startTime } = getIntlDateTime(startDate, slotNumber, timeZone);
  const eventStartdate = moment(dateObject).format('dddd, Do MMMM, YYYY');
  const eventName = get(eventDetail, 'name');
  let speakerName = '';
  const meetingId = get(eventDetail, 'meetingId');
  const meetingPassword = get(eventDetail, 'meetingPassword');
  const sessionLink = get(eventDetail, 'sessionLink');
  const summary = get(eventDetail, 'summary');
  const geoLocation = get(eventDetail, 'geoLocation');
  const address = `${get(eventDetail, 'address') || ''}, ${get(eventDetail, 'city') || ''}, ${get(eventDetail, 'state') || ''}, ${get(eventDetail, 'pincode') || ''}`;
  get(eventDetail, 'speakers', []).forEach((speaker, index) => { speakerName += `${get(speaker, 'user.name')}${index === get(eventDetail, 'speakers', []).length - 1 ? '' : ','}`; });
  const commsObj = {
    studentName: get(userDetail, 'user.name'),
    parentName: get(userDetail, 'parents[0].user.name'),
    studentGrade: get(userDetail, 'grade'),
    parentEmail: get(userDetail, 'parents[0].user.email'),
    parentPhone: `${get(userDetail, 'parents[0].user.phone.countryCode')}${get(userDetail, 'parents[0].user.phone.number')}`,
    eventDate: eventStartdate,
    eventName,
    speakerName,
    eventTime: startTime,
    meetingId,
    meetingLink: sessionLink,
    meetingPassword,
    geoLocation,
    address,
    summary,
    eventRegistrationLink: `${process.env.TEKIE_WEB_URL}/events/${get(eventDetail, 'id')}`,
  };
  if (get(commsObj, 'parentPhone')) {
    const parameters = [];
    commsVariables.forEach((comm) => {
      if (get(comm, 'dataField') !== 'parentPhone') {
        parameters.push({
          name: get(comm, 'whatsappVariableName'),
          value: commsObj[get(comm, 'dataField')],
        });
      }
    });
    const newPhoneNumber = get(commsObj, 'parentPhone').replace('+', '');
    sendWhatsAppTemplateMessage(
      newPhoneNumber,
      templateName,
      newPhoneNumber,
      parameters,
    );
    addToCommsSendLogs({
      templateName, triggeredAt: new Date(), eventId, studentProfileId,
    });
  }
  deleteJob();
};

export default eventNewRegistrationReminder;
