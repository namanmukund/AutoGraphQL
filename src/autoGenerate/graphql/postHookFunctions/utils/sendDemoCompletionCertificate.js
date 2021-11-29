import { get } from 'lodash';
import { log } from '../../../../../utils';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import getEmailObject from '../../../../../services/email/utils/getEmailObject';
import sendEmail from '../../../../../services/email/utils/sendEmail';
import sendWhatsAppTemplateMessage from '../../../utils/sendWhatsAppTemplateMessage';
import getPostDemoSalesReportUrl from '../../resolvers/mutation/pdf/uploadCertificates/postDemoSalesReport';

const capitalize = (str, lower = false) => (lower ? str.toLowerCase() : str).replace(/(?:^|\s|["'([{])+\S/g, (match) => match.toUpperCase());

const generateCertificate = async (id, regenerateCertificate, eventId, date) => {
  const query = `
    mutation{
      generateCertificate(input:{
        userId:"${id}"
        regenerateCertificate:${regenerateCertificate ? 'true' : 'false'}
        isEventCertificate: false
        ${eventId ? `eventId: "${eventId}"` : ''}
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
    {user_some: {id: "${userId}"}}
      {courses_some: {id: "${courseId}"}}
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
          email
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

const iqaReportQuery = (userId) => `
{
  iqaReports(filter: {
    and: [
      {user_some: {id: "${userId}"}}
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

const slugifyID = (ID) => (ID ? ID.toString().trim().toUpperCase().replace(/\w{5}(?=.)/g, '$&-') : '');

const sendDemoCompletionCertificate = async (userId, courseId) => {
  // first create an event corresponding to demo completion if not already created else fethc the created event id
  const events = get(await callLocalGraphqlApi(eventsQuery()), 'data.events', []);
  let eventId = '';
  if (events && events.length) {
    eventId = get(events, '[0].id');
  } else {
    eventId = get(await callLocalGraphqlApi(addEventMutation()), 'data.addEvent.id');
  }
  let hasGivenIqaTest = false;
  const certificateDetails = await generateCertificate(userId, true, eventId);
  const certificateId = get(certificateDetails, 'id');
  // check if iqa report is generated to send that also
  const user = get(await callLocalGraphqlApi(userQuery(userId)), 'data.user');
  const childName = get(user, 'name', '');
  const parentName = get(user, 'studentProfile.parents[0].user.name', '');
  const parentPhone = get(user, 'studentProfile.parents[0].user.phone.countryCode', '+91').split('+')[1] + get(user, 'studentProfile.parents[0].user.phone.number');
  let iqaReportId = '';
  const parentEmail = get(user, 'studentProfile.parents[0].user.email');

  // check if the iqa report is already present for the given user, then link it to the userCourse else we don't
  const iqaReports = await get(callLocalGraphqlApi(iqaReportQuery(userId)), 'data.iqaReports', []);
  if (iqaReports && iqaReports.length) {
    hasGivenIqaTest = true;
    iqaReportId = get(iqaReports, '[0].id');
  }
  // check if the userCourse exists, if it does, then update it with the given demo certificate, else we just add the userCourse and the demoCompletion certificate with it
  const userCourses = get(await callLocalGraphqlApi(userCoursesQuery(userId, courseId)), 'data.userCourses', []);
  let userCourseId = '';
  if (userCourses && userCourses.length) {
    userCourseId = get(userCourses, '[0].id');
    await callLocalGraphqlApi(updateUserCourseQuery(userCourseId, certificateId, iqaReportId));
    log('Updated user course with demo completion certificate');
  } else {
    userCourseId = get(await callLocalGraphqlApi(addUserCourseQuery(userId, courseId, certificateId, iqaReportId)), 'data.addUserCourse.id');
    log('Added user course with demo completion certificate');
  }
  const certificateLink = `${process.env.TEKIE_WEB_URL}/iqa-report/${slugifyID(userCourseId)}`;

  // wati send
  const parameters = [
    { name: 'parent_name', value: parentName },
    { name: 'student_name', value: childName },
    { name: 'iqa_report_snapshot_link', value: certificateLink },
  ];
  const bookTemplate = hasGivenIqaTest ? 'iqa_report_snapshot_and_certificate' : 'iqa_report_only_certificate';
  // email send
  const emailTo = [`${parentEmail}`];
  // const emailTo = ['gokul.madhusudhan@tekie.in'];
  const ccEmail = '';
  const bccEmail = '';
  const subject = 'Tekie - Demo Completion Certificate';
  const html = hasGivenIqaTest ? `Congratulations ${capitalize(parentName)}!
Our Academic experts found ${capitalize(childName)}'s performance at the IQ assessment extraordinary and have created a personalized report for you.
You can download their certificate here : ${certificateLink}` : `Congratulations ${capitalize(parentName)}!
Our Computer Science Expert found ${capitalize(childName)}'s performance during the session extraordinary and shared a personalized certificate for you.
You can download their certificate here : ${certificateLink}
`;
  const emailMsgObject = getEmailObject(emailTo, ccEmail, bccEmail, subject, '', html, 'hello@tekie.in');
  sendEmail(emailMsgObject);
  await sendWhatsAppTemplateMessage(parentPhone, bookTemplate, parentPhone, parameters);
  // send the post demo pre/post test report to leadsquared
  getPostDemoSalesReportUrl(userId);
  return true;
};

export default sendDemoCompletionCertificate;
