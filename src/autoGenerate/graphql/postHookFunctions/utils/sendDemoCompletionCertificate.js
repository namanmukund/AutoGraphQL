import { get } from 'lodash';
import { log } from '../../../../../utils';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import getEmailObject from '../../../../../services/email/utils/getEmailObject';
import sendEmail from '../../../../../services/email/utils/sendEmail';
import sendWhatsAppTemplateMessage from '../../../utils/sendWhatsAppTemplateMessage';

const generateCertificate = async (id, regenerateCertificate, eventId, date) => {
  const query = `
    mutation{
      generateCertificate(input:{
        userId:"${id}"
        regenerateCertificate:${regenerateCertificate ? 'true' : 'false'}
        isEventCertificate: false
        ${eventId ? `date: "${eventId}"` : ''}
        ${date ? `date: "${date}"` : ''}
      })
      {
        id
        assetUrl
        tekieUrl
      }
    }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.generateCertificate', {});
};

const userCoursesQuery = (userId, courseId) => `
{
  userCourses(filter:{
    and:[
    {user_some: {id: ${userId}}}
      {courses_some: {id: ${courseId}}}
    ]
  }){
    id
  }
}
`;

const addUserCourseQuery = (userId, courseId, certificateId, iqaReportId) => `
  mutation {
      addUserCourse(userConnectId: "${userId}",
      coursesConnectIds: ["${courseId}"],
      demoCompletionConnectIds: ["${certificateId}"],
      ${iqaReportId ? `iqaReportConnectIds: ["${iqaReportId}"]` : ''}
      input: {}) {
          id
      }
  }
`;

const updateUserCourseQuery = (id, certificateId, iqaReportId) => `
  mutation {
      updateUserCourse(id: "${id}",
      demoCompletionConnectIds: ["${certificateId}"],
      ${iqaReportId ? `iqaReportConnectIds: ["${iqaReportId}"]` : ''}
      input: {}) {
          id
      }
  }
`;

const userQuery = (userId) => `
{
  user(id: "${userId}"){
    id
    name
    studentProfile{
      parents{
        user{
          name
          phone{
            number
            countryCode
          }
        }
      }
    }
  }
}
`;

const eventsQuery = () => `
{
  events(filter:{
    and: [
      {eventType:userAchievement}
      {eventName:demoCompletion}
    ]
  }){
    id
  }
}
`;

const addEventMutation = () => `
mutation{
  addEvent(input:{
    eventType: userAchievement
    eventName: demoCompletion
  }){
    id
  }
}
`;

const sendDemoCompletionCertificate = async (userId, courseId) => {
  // first create an event corresponding to demo completion if not already created else fethc the created event id
  const events = get(await callLocalGraphqlApi(eventsQuery()), 'data.events', []);
  let eventId = '';
  if (events && events.length) {
    eventId = get(events, '[0].id');
  } else {
    eventId = get(await callLocalGraphqlApi(addEventMutation()), 'data.addEvent.id');
  }
  const certificateDetails = await generateCertificate(userId, false, eventId);
  // check if iqa report is generated to send that also
  const { id: certificateId, certificateLink } = `${process.env.TEKIE_WEB_URL}/${get(certificateDetails, 'tekieUrl')}`;

  const user = await get(callLocalGraphqlApi(userQuery(userId)), 'data.user');
  const childName = get(user, 'name', '');
  const parentName = get(user, 'studentProfile.parents[0].user.name', '');
  const parentPhone = get(user, 'studentProfile.parents[0].user.phone.countryCode', '+91').substring(1) + get(user, 'studentProfile.parents[0].user.phone.number');
  let iqaReportId = '';
  // check if the iqa report is already present for the given user, then link it to the userCourse else we don't
  const iqaReports = await get(callLocalGraphqlApi(iqaReportQuery(userId)), 'data.iqaReports', []);
  if (iqaReports && iqaReports.length) {
    iqaReportId = get(iqaReports, '[0].id');
  }
  // check if the userCourse exists, if it does, then update it with the given demo certificate, else we just add the userCourse and the demoCompletion certificate with it
  const userCourses = get(await callLocalGraphqlApi(userCoursesQuery(userId, courseId)), 'data.userCourses', []);
  if (userCourses && userCourses.length) {
    const userCourseId = get(userCourses, '[0].id');
    await callLocalGraphqlApi(updateUserCourseQuery(userCourseId, certificateId, iqaReportId));
    log('Updated user course with demo completion certificate');
  } else {
    await callLocalGraphqlApi(addUserCourseQuery(userId, courseId, certificateId, iqaReportId));
    log('Added user course with demo completion certificate');
  }

  // wati send
  const parameters = [
    { name: 'parent_name', value: parentName },
    { name: 'student_name', value: childName },
    { name: 'iqa_report_snapshot_link', value: certificateLink },
  ];
  const bookTemplate = 'iqa_report_snapshot_and_certificate';
  // email send
  const ccEmail = '';
  const bccEmail = '';
  const subject = 'Tekie - Demo Completion Certificate';
  const text = `Congratulations ${parentName}!
Our Academic experts found ${childName}'s performance at the IQ assessment extraordinary and have created a personalized report for you.
You can download their certificate here : ${certificateLink}
`;
  getEmailObject(emailTo, ccEmail, bccEmail, subject, text);
  sendEmail(emailMsgObject);
  sendWhatsAppTemplateMessage(parentPhone, bookTemplate, parentPhone, parameters);
  return true;
};

export default sendDemoCompletionCertificate;
