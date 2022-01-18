/* eslint-disable indent */
/* eslint-disable no-unused-vars */
import { get } from 'lodash';
import moment from 'moment';
import { log } from '../../utils';
import callLocalGraphqlApi from '../api/callLocalGraphqlApi';
import generateCertificateScript from '../autoGenerate/graphql/resolvers/query/scriptMethods/generateCertificateScript';
import getCountryCodeAndNumber from '../autoGenerate/graphql/validation/getCountryCodeAndNumber';
import getHashDigest from './typeform-utils/getHashDigest';
import EVENTS from './typeform-utils/eventConstants';
import updateLeadSquared from '../../services/leadsquared/updateLeadSquared';
// import sendEmail from '../../services/email/utils/sendEmail';
// import getEmailObject from '../../services/email/utils/getEmailObject';
import sendWhatsAppTemplateMessage from '../autoGenerate/utils/sendWhatsAppTemplateMessage';
import getPostDemoSalesReportUrl from '../autoGenerate/graphql/resolvers/mutation/pdf/uploadCertificates/postDemoSalesReport';

const getEventId = (formId) => {
  let eventId = '';
  switch (formId) {
    case EVENTS.DOODLING.formId:
      eventId = EVENTS.DOODLING.eventId.staging;
      if (process.env.NODE_ENV === 'production') {
        eventId = EVENTS.DOODLING.eventId.production;
        if (process.env.DATA_MASKING) {
          eventId = EVENTS.DOODLING.eventId.preprod;
        }
      }
      break;
    case EVENTS.SPYSQUADCAMP.formId:
      eventId = EVENTS.SPYSQUADCAMP.eventId.staging;
      if (process.env.NODE_ENV === 'production') {
        eventId = EVENTS.SPYSQUADCAMP.eventId.production;
        if (process.env.DATA_MASKING) {
          eventId = EVENTS.SPYSQUADCAMP.eventId.preprod;
        }
      }
      break;
    case EVENTS.CANVA.formId:
      eventId = EVENTS.CANVA.eventId.staging;
      if (process.env.NODE_ENV === 'production') {
        eventId = EVENTS.CANVA.eventId.production;
        if (process.env.DATA_MASKING) {
          eventId = EVENTS.CANVA.eventId.preprod;
        }
      }
      break;
    case EVENTS.STORYSPREE.formId:
      eventId = EVENTS.STORYSPREE.eventId.staging;
      if (process.env.NODE_ENV === 'production') {
        eventId = EVENTS.STORYSPREE.eventId.production;
        if (process.env.DATA_MASKING) {
          eventId = EVENTS.STORYSPREE.eventId.preprod;
        }
      }
      break;
    case EVENTS.GENZENVIRONMENT.formId:
      eventId = EVENTS.GENZENVIRONMENT.eventId.staging;
      if (process.env.NODE_ENV === 'production') {
        eventId = EVENTS.GENZENVIRONMENT.eventId.production;
        if (process.env.DATA_MASKING) {
          eventId = EVENTS.GENZENVIRONMENT.eventId.preprod;
        }
      }
      break;
    case EVENTS.CRACKTHECODE.formId:
      eventId = EVENTS.CRACKTHECODE.eventId.staging;
      if (process.env.NODE_ENV === 'production') {
        eventId = EVENTS.CRACKTHECODE.eventId.production;
        if (process.env.DATA_MASKING) {
          eventId = EVENTS.CRACKTHECODE.eventId.preprod;
        }
      }
      break;
    case EVENTS.CHRISTMASCARNIVAL.formId:
    case EVENTS.CHRISTMASCARNIVAL.formId25th:
      eventId = EVENTS.CHRISTMASCARNIVAL.eventId.staging;
      if (process.env.NODE_ENV === 'production') {
        eventId = EVENTS.CHRISTMASCARNIVAL.eventId.production;
        if (process.env.DATA_MASKING) {
          eventId = EVENTS.CHRISTMASCARNIVAL.eventId.preprod;
        }
      }
      break;
    default:
      eventId = EVENTS.SPYSQUADCAMP.eventId.staging;
      if (process.env.NODE_ENV === 'production') {
        eventId = EVENTS.SPYSQUADCAMP.eventId.production;
        if (process.env.DATA_MASKING) {
          eventId = EVENTS.SPYSQUADCAMP.eventId.preprod;
        }
      }
      break;
  }
  return eventId;
};

const getEventDetails = (formId) => {
  const eventDetailsObject = {};
  switch (formId) {
    case EVENTS.CHRISTMASCARNIVAL.registrationFormId24th:
      eventDetailsObject.eventDate = EVENTS.CHRISTMASCARNIVAL.eventDate.dec24;
      eventDetailsObject.eventTime = EVENTS.CHRISTMASCARNIVAL.eventTime.dec24;
      eventDetailsObject.eventDateTime = EVENTS.CHRISTMASCARNIVAL.eventDateTime.dec24;
      break;
    case EVENTS.CHRISTMASCARNIVAL.registrationFormId25th:
      eventDetailsObject.eventDate = EVENTS.CHRISTMASCARNIVAL.eventDate.dec25;
      eventDetailsObject.eventTime = EVENTS.CHRISTMASCARNIVAL.eventTime.dec25;
      eventDetailsObject.eventDateTime = EVENTS.CHRISTMASCARNIVAL.eventDateTime.dec25;
      break;
    case EVENTS.CHRISTMASCARNIVAL.registrationFormId25thRS:
      eventDetailsObject.eventDate = EVENTS.CHRISTMASCARNIVAL.eventDate.dec25RS;
      eventDetailsObject.eventTime = EVENTS.CHRISTMASCARNIVAL.eventTime.dec25RS;
      eventDetailsObject.eventDateTime = EVENTS.CHRISTMASCARNIVAL.eventDateTime.dec25RS;
      break;
    case EVENTS.CHRISTMASCARNIVAL.registrationFormId26th:
      eventDetailsObject.eventDate = EVENTS.CHRISTMASCARNIVAL.eventDate.dec26;
      eventDetailsObject.eventTime = EVENTS.CHRISTMASCARNIVAL.eventTime.dec26;
      eventDetailsObject.eventDateTime = EVENTS.CHRISTMASCARNIVAL.eventDateTime.dec26;
      break;
    case EVENTS.STORYSPREE.rsRegiformId:
      eventDetailsObject.eventDate = EVENTS.STORYSPREE.eventDate;
      eventDetailsObject.eventTime = EVENTS.STORYSPREE.eventTime;
      eventDetailsObject.eventDateTime = EVENTS.STORYSPREE.eventDateTime;
      break;
    case EVENTS.DOODLING.registrationFormId:
      eventDetailsObject.eventDate = EVENTS.DOODLING.eventDate;
      eventDetailsObject.eventTime = EVENTS.DOODLING.eventTime;
      eventDetailsObject.eventDateTime = EVENTS.DOODLING.eventDateTime;
      break;
    default:
      eventDetailsObject.eventDate = EVENTS.CHRISTMASCARNIVAL.eventDate.dec24;
      eventDetailsObject.eventTime = EVENTS.CHRISTMASCARNIVAL.eventTime.dec24;
      eventDetailsObject.eventDateTime = EVENTS.CHRISTMASCARNIVAL.eventDateTime.dec24;
      break;
  }
  return eventDetailsObject;
};

const updateEventAttendanceStatus = async (eventAttendanceId) => {
  const query = `mutation {
  updateEventAttendance(id: "${eventAttendanceId}", input: { attendance: present }) {
    id
  }
}
`;
  return get(await callLocalGraphqlApi(query), 'data.updateEventAttendance');
};

const addNewEventAttendanceWithStatus = async (userId, studentProfileId, eventId) => {
  const query = `mutation {
  addEventAttendance(
    input: { attendance: present }
    userConnectId: "${userId}"
    studentProfileConnectId: "${studentProfileId}"
    eventConnectId: "${eventId}"
  ) {
    id
  }
}
`;
  return get(await callLocalGraphqlApi(query), 'data.addEventAttendance');
};

const getEventAttendances = async (userId, eventId) => {
  const query = `{
  eventAttendances(
    filter: { and: [{ user_some: { id: "${userId}" } }, { event_some: { id: "${eventId}" } }] }
  ) {
    id
  }
}
`;
  return get(await callLocalGraphqlApi(query), 'data.eventAttendances', []);
};

const generateCertificate = async (id, regenerateCertificate, eventId, date) => {
  const query = `
    mutation{
      generateCertificate(input:{
        userId:"${id}"
        regenerateCertificate:${regenerateCertificate ? 'true' : 'false'}
        eventId:"${eventId}"
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

const usersData = async (studentDetailsObject, formId, doGenerateCertificate) => {
  let filter = '';
  const {
    childName, parentEmail = '', parentPhone: { number = '' },
    utmCampaign, utmSource,
  } = studentDetailsObject;
  const utmDetails = {
    utmCampaign,
    utmSource,
  };
  if (number) {
    filter = `
        {studentProfile_some: {
        parents_some: {
          user_some:{
            and:[
              {phone_number_subDoc: "${number}"}
            ]
          }
        }
      }}`;
    const numberQuery = `{
    users(
      filter: ${filter}
    ) {
      id
      studentProfile{
        id
      }
    }
  }`;
    const users = get(await callLocalGraphqlApi(numberQuery), 'data.users', []);
    // uses the same formId parameter passed from controller, to generate eventId dynamically
    if (users && users.length) {
      if (doGenerateCertificate) {
        const eventAttendances = await getEventAttendances(get(users, '[0].id'), getEventId(formId));
        if (eventAttendances && eventAttendances.length) {
          log(`updating attendance for ${childName} with id ${get(users, '[0].id')}`);
          await updateEventAttendanceStatus(get(eventAttendances, '[0].id'));
          generateCertificateScript([get(users, '[0].id')], false, getEventId(formId), null, utmDetails);
        } else {
          log(`adding attendance for ${childName} with id ${get(users, '[0].id')}`);
          await addNewEventAttendanceWithStatus(get(users, '[0].id'), get(users, '[0].studentProfile.id'), getEventId(formId));
          generateCertificateScript([get(users, '[0].id')], false, getEventId(formId), null, utmDetails);
        }
      }
    } else if (parentEmail) {
      filter = `{studentProfile_some: {
          parents_some: {
            user_some: {email:"${parentEmail.trim()}"}
          }
        }}`;
      const query = `{
      users(
        filter: ${filter}
      ) {
        id
        studentProfile{
          id
        }
      }
    }`;
      const user = get(await callLocalGraphqlApi(query), 'data.users', []);
      if (user && user.length) {
        if (doGenerateCertificate) {
          const eventAttendances = await getEventAttendances(get(user, '[0].id'), getEventId(formId));
          if (eventAttendances && eventAttendances.length) {
            log(`updating attendance for ${childName} with id ${get(user, '[0].id')}`);
            await updateEventAttendanceStatus(get(eventAttendances, '[0].id'));
            generateCertificateScript([get(user, '[0].id')], false, getEventId(formId), null, utmDetails);
          } else {
            log(`adding attendance for ${childName} with id ${get(user, '[0].id')}`);
            await addNewEventAttendanceWithStatus(get(user, '[0].id'), get(user, '[0].studentProfile.id'), getEventId(formId));
            generateCertificateScript([get(user, '[0].id')], false, getEventId(formId), null, utmDetails);
          }
        }
      } else {
        const parentChildSignUpQuery = `mutation parentChildSignUp($input: ParentChildSignUpInput) {
        parentChildSignUp(input: $input) {
          id
          name
          email
          parentProfile {
            id
            children {
              id
              grade
              user {
                id
                name
              }
            }
          }
        }
      }
      `;
        log(`creating a parentChildSignUp for ${childName}`);
        const result = await callLocalGraphqlApi(parentChildSignUpQuery, '', { input: studentDetailsObject });
        if (get(result, 'data.parentChildSignUp') && doGenerateCertificate) {
          const children = get(result, 'data.parentChildSignUp.parentProfile.children');
          // eslint-disable-next-line no-restricted-syntax
          for (const child of children) {
            log(`got added child for ${get(child, 'user.name')}`);
            if (get(child, 'user.name') === childName) {
              // adding attendance for only that child how filled the form
              log(`adding attendance for ${childName} with id ${get(child, 'user.id')}`);
              // eslint-disable-next-line no-await-in-loop
              await addNewEventAttendanceWithStatus(get(child, 'user.id'), get(child, 'id'), getEventId(formId));
              generateCertificateScript([get(child, 'user.id')], false, getEventId(formId), null, utmDetails);
            }
          }
        }
      }
    }
  }
  if (!doGenerateCertificate) {
    const eventDetails = getEventDetails(formId);
    log('Sending Lead on Registration');
    updateLeadSquared({
      Phone: number,
      mx_Event_Date: eventDetails.eventDate,
      mx_Event_Time: eventDetails.eventTime,
      mx_Event_Date_Time: eventDetails.eventDateTime,
    }, false, {
      ActivityEvent: 208,
      Fields: [
        {
          SchemaName: 'mx_Custom_1',
          Value: utmSource,
        },
        {
          SchemaName: 'mx_Custom_2',
          Value: utmCampaign,
        },
      ],
    });
  }
};

const addIqaReport = async (studentDetailsObject) => {
  let filter = '';
  const {
    parentPhone: { number = '', countryCode = '+91' },
    iqaRank,
    globalRank,
    iqaScore,
    maximumScore,
    parentName,
    childName,
    // parentEmail,
  } = studentDetailsObject;
  if (number) {
    filter = `{
      and:[
        {user_some: {
          studentProfile_some: {
            parents_some: {
              user_some: {
                phone_number_subDoc: "${number}"
              }
            }
          }
        }}
      ]
    }`;
    const iqaReportQuery = `{
      iqaReports(filter:${filter}){
        id
        user{
          id
        }
      }
    }`;
    filter = `{
      and:[
        {
          studentProfile_some: {
            parents_some: {
              user_some: {
                phone_number_subDoc: "${number}"
              }
            }
          }
        }
      ]
    }`;
    const usersQuery = `{
        users(filter:${filter}){
          id
          studentProfile{
            parents{
              user{
                phone{
                  number
                  countryCode
                }
                email
              }
            }
          }
        }
      }`;
    const iqaReports = get(await callLocalGraphqlApi(iqaReportQuery), 'data.iqaReports', []);
    // uses the same formId parameter passed from controller, to generate eventId dynamically
    if (iqaReports && iqaReports.length) {
      log(`Updating Existing IQA report for given phone number ${number}`);
      const users = get(await callLocalGraphqlApi(usersQuery), 'data.users', []);
      if (users && users.length) {
        const userId = get(users, '[0].id');
        const updateIqaReport = `mutation{
        updateIqaReport(
          id:"${get(iqaReports, '[0].id')}"
          userConnectId:"${userId}"
          input:{
          phone:{
            countryCode:"${get(users, '[0].studentProfile.parents[0].user.phone.countryCode')}"
            number:"${get(users, '[0].studentProfile.parents[0].user.phone.number')}"
          }
          email:"${get(users, '[0].studentProfile.parents[0].user.email')}"
          iqaRank:${iqaRank}
          globalRank:${globalRank}
          iqaScore:${iqaScore}
          maximumScore:${maximumScore}
        }){
          id
        }
      }
      `;
        get(await callLocalGraphqlApi(updateIqaReport), 'data.addIqaReport.id');
      }
    } else {
      const users = get(await callLocalGraphqlApi(usersQuery), 'data.users', []);
      if (users && users.length) {
        const userId = get(users, '[0].id');
        const addIqaReportMutation = `mutation{
        addIqaReport(
          userConnectId:"${userId}"
          input:{
          phone:{
            countryCode:"${get(users, '[0].studentProfile.parents[0].user.phone.countryCode')}"
            number:"${get(users, '[0].studentProfile.parents[0].user.phone.number')}"
          }
          email:"${get(users, '[0].studentProfile.parents[0].user.email')}"
          iqaRank:${iqaRank}
          globalRank:${globalRank}
          iqaScore:${iqaScore}
          maximumScore:${maximumScore}
        }){
          id
        }
      }
      `;
        const updateIqaReportMutation = (iqaReportId, assetUrl) => `mutation{
        updateIqaReport(id:"${iqaReportId}",
        input:{
          assetUrl:"${assetUrl}"
        }){
          id
        }
      }
      `;
        const userCourseQuery = `{
        userCourses(filter:{
          user_some: {id: "${userId}"}
        }){
          id
          demoCompletion{
            id
          }
        }
      }
      `;
        const addUserCourse = (iqaReportId) => `mutation{
          addUserCourse(
            userConnectId: "${userId}"
            iqaReportConnectIds: ["${iqaReportId}"]
            input:{}
          ){
            id
          }
        }
      `;
        const updateUserCourse = (userCourseId, iqaReportId) => `mutation{
        updateUserCourse(id: "${userCourseId}",
        iqaReportConnectIds: ["${iqaReportId}"]
        input:{}){
          id
        }
      }
      `;
        const eventsQuery = () => `
        {
          events(filter:{
            and: [
              {eventType:userAchievement}
              {eventName:iqaReport}
            ]
          }, orderBy: createdAt_DESC){
            id
          }
        }
        `;
        const addEventMutation = () => `
        mutation{
          addEvent(input:{
            eventType: userAchievement
            eventName: iqaReport
          }){
            id
          }
        }
        `;
        const slugifyID = (ID) => (ID ? ID.toString().trim().toUpperCase().replace(/\w{5}(?=.)/g, '$&-') : '');
        // const capitalize = (str, lower = false) => (lower ? str.toLowerCase() : str).replace(/(?:^|\s|["'([{])+\S/g, (match) => match.toUpperCase());
        try {
          const iqaReportId = get(await callLocalGraphqlApi(addIqaReportMutation), 'data.addIqaReport.id');
          const userCourses = get(await callLocalGraphqlApi(userCourseQuery), 'data.userCourses', []);
          let userCourseId = '';
          let isDemoCompleted = false;
          // if userCourse is found, then we add the user
          if (userCourses && userCourses.length) {
            if (get(userCourses, '[0].demoCompletion.id')) {
              isDemoCompleted = true;
            }
            userCourseId = get(userCourses, '[0].id');
            await callLocalGraphqlApi(updateUserCourse(userCourseId, iqaReportId));
          } else {
            userCourseId = get(await callLocalGraphqlApi(addUserCourse(iqaReportId)), 'data.addUserCourse.id');
          }
          const events = get(await callLocalGraphqlApi(eventsQuery()), 'data.events', []);
          let eventId = '';
          if (events && events.length) {
            eventId = get(events, '[0].id');
          } else {
            eventId = get(await callLocalGraphqlApi(addEventMutation()), 'data.addEvent.id');
          }
          // create a iqa report
          const generateCertRes = await generateCertificate(userId, false, eventId, '');
          const assetUrl = get(generateCertRes, 'assetUrl');
          const certificateLink = `${process.env.TEKIE_WEB_URL}/iqa-report/${slugifyID(userCourseId)}`;
          // if the demo is completed, we have to ensure that the link is sent again
          // if (isDemoCompleted) {
          // wati send
          // const parameters = [
          //   { name: 'parent_name', value: parentName },
          //   { name: 'student_name', value: childName },
          //   { name: 'iqa_report_snapshot_link', value: certificateLink },
          // ];
          // const parentPhone = countryCode.split('+')[1] + number;
          // const bookTemplate = 'iqa_report_snapshot_and_certificate';
          // email send
          // const emailTo = [`${parentEmail}`];
          // const emailTo = ['gokul99.gm@gmail.com'];
          //             const ccEmail = '';
          //             const bccEmail = '';
          //             const subject = 'Tekie - IQA Report Certificate';
          //             const html = `Congratulations ${capitalize(parentName)}!
          // Our Academic experts found ${capitalize(childName)}'s performance at the IQ assessment extraordinary and have created a personalized report for you.
          // You can download their certificate here : ${certificateLink}`;
          //             const emailMsgObject = getEmailObject(emailTo, ccEmail, bccEmail, subject, '', html, 'hello@tekie.in');
          //             sendEmail(emailMsgObject);
          //   await sendWhatsAppTemplateMessage(parentPhone, bookTemplate, parentPhone, parameters);
          // }
          log(`cert link ${certificateLink}`);
          // update iqaReport with new tekieUrl
          await callLocalGraphqlApi(updateIqaReportMutation(iqaReportId, assetUrl));
          updateLeadSquared({
            Phone: number,
            mx_IQA_Certificate_Snapshot: certificateLink,
          }, false);
          getPostDemoSalesReportUrl(userId);
        } catch (err) {
          log(err);
        }
      } else {
        log(`User does not exist with given phone number ${number}`);
      }
    }
  }
};

const typeformWebhookController = async (req, res) => {
  const digest = getHashDigest(get(req, 'body'));
  log(`digest ${digest}`);
  if (get(req, 'headers.user-agent') === 'Typeform Webhooks' && get(req, 'body.event_type') === 'form_response') {
    const fields = get(req, 'body.form_response.definition.fields', []);
    let studentDetailsObject = {};
    const answers = get(req, 'body.form_response.answers', []);
    const variables = get(req, 'body.form_response.variables', []);
    const formId = get(req, 'body.form_response.form_id', '');
    const hidden = get(req, 'body.form_response.hidden', '');
    // Form - IQA test, Grade6 and above
    if (formId === 'weKBAxh5' || formId === 'l3s8cO8K') {
      // loop over fields and store details in object, then calculate score and create IQA report
      // eslint-disable-next-line no-restricted-syntax
      for (const variable of variables) {
        const { key, number } = variable;
        if (key === 'global_rank') studentDetailsObject.globalRank = number;
        if (key === 'iqa_rank') studentDetailsObject.iqaRank = number;
        if (key === 'score') studentDetailsObject.iqaScore = number;
      }
      studentDetailsObject.maximumScore = 100;
      // eslint-disable-next-line no-restricted-syntax
      for (const field of fields) {
        const { title, ref, type } = field;
        const studentAnswer = answers.find((answer) => get(answer, 'field.ref') === ref);
        if (title === 'Child Name') studentDetailsObject.childName = get(studentAnswer, 'text');
        if (title === 'Parent Name') studentDetailsObject.parentName = get(studentAnswer, 'text');
        if (title === 'Email ID' || title === 'Email ID ') studentDetailsObject.parentEmail = get(studentAnswer, type);
        if (title === 'Student Grade') studentDetailsObject.grade = `Grade${get(studentAnswer, 'choice.label')}`;
        if (title === 'Phone number ' || title === 'Phone number') studentDetailsObject.parentPhone = getCountryCodeAndNumber(get(studentAnswer, type));
      }
      addIqaReport(studentDetailsObject);
    } else if (formId === 'Rk1uvLn9') {
      // form to receive councelling session date/time from CTA on IQA Report
      // eslint-disable-next-line no-restricted-syntax
      for (const field of fields) {
        const { title, ref } = field;
        const studentAnswer = answers.find((answer) => get(answer, 'field.ref') === ref);
        if (title === 'Preferred date for counselling session') studentDetailsObject.preferredDate = get(studentAnswer, 'date');
        if (title === 'Preferred time for counselling session on {{field:01FNK51S4DBT5K77W5W644BTDF}}') studentDetailsObject.preferredTime = get(studentAnswer, 'choice.label').toUpperCase();
      }
      if (studentDetailsObject.preferredTime.length === 4) {
        studentDetailsObject.preferredTime = `0${studentDetailsObject.preferredTime}`;
      }
      studentDetailsObject.preferredTime = `${studentDetailsObject.preferredTime.substring(0, 2)}:00:00 ${studentDetailsObject.preferredTime.substring(3, 5)}`;

      const counsellingDate = moment(new Date(`${studentDetailsObject.preferredDate} ${studentDetailsObject.preferredTime}`))
        .subtract(5, 'hours').subtract(30, 'minutes').format('YYYY-MM-DD HH:mm:ss');
      const parentPhone = `${get(hidden, 'phone_number').trim()}`;
      updateLeadSquared({
        Phone: parentPhone,
      }, false, {
        ActivityEvent: 211,
        Fields: [
          {
            SchemaName: 'mx_Custom_1',
            Value: counsellingDate,
          },
        ],
      });
    } else {
      // eslint-disable-next-line no-restricted-syntax
      for (const field of fields) {
        const { title, ref, type } = field;
        const studentAnswer = answers.find((answer) => get(answer, 'field.ref') === ref);
        if (title === 'Student Name') studentDetailsObject.childName = get(studentAnswer, 'text');
        if (title === 'Parent Name') studentDetailsObject.parentName = get(studentAnswer, 'text');
        if (title === 'Email') studentDetailsObject.parentEmail = get(studentAnswer, type);
        if (title === 'Grade/Standard') studentDetailsObject.grade = `Grade${get(studentAnswer, 'choice.label')}`;
        if (title === 'Phone Number') studentDetailsObject.parentPhone = getCountryCodeAndNumber(get(studentAnswer, type));
      }
      // include switch case based on event parameter form_response.form_id
      // check this form_id param from typeform admin dashboard
      let country;
      let timezone;
      let utmSource;
      let utmCampaign;
      let utmContent;
      let utmMedium;
      let utmTerm;
      let doGenerateCertificate = true;
      switch (formId) {
        case EVENTS.SPYSQUADCAMP.formId:
          country = 'india';
          timezone = 'Asia/Kolkata';
          utmSource = 'communityevent';
          utmCampaign = 'spysquadcamp_18dec';
          break;
        case EVENTS.CANVA.formId:
          country = 'india';
          timezone = 'Asia/Kolkata';
          utmSource = 'communityevent';
          utmCampaign = 'canva_Nov14';
          break;
        case EVENTS.GENZENVIRONMENT.formId:
          country = 'india';
          timezone = 'Asia/Kolkata';
          utmSource = 'communityevent';
          utmCampaign = 'environment_30nov';
          break;
        case EVENTS.STORYSPREE.formId:
          country = 'india';
          timezone = 'Asia/Kolkata';
          utmSource = 'radiostreet';
          utmCampaign = 'storyspree';
          break;
        case EVENTS.STORYSPREE.rsRegiformId:
          country = 'india';
          timezone = 'Asia/Kolkata';
          utmSource = 'radiostreet';
          utmCampaign = 'storyspree';
          utmTerm = '23rdJan2022';
          doGenerateCertificate = false;
          break;
        case EVENTS.GENZENVIRONMENT.registrationFormId:
          country = 'india';
          timezone = 'Asia/Kolkata';
          utmSource = 'communityevent';
          utmCampaign = 'environment_30nov';
          doGenerateCertificate = false;
          break;
        case EVENTS.CRACKTHECODE.formId:
          country = 'india';
          timezone = 'Asia/Kolkata';
          utmSource = 'events';
          utmCampaign = 'crackthecode';
          break;
        case EVENTS.CHRISTMASCARNIVAL.registrationFormId24th:
          country = 'india';
          timezone = 'Asia/Kolkata';
          utmSource = 'communityevent';
          utmCampaign = 'christmascarnival_24dec';
          doGenerateCertificate = false;
          break;
        case EVENTS.CHRISTMASCARNIVAL.registrationFormId25th:
          country = 'india';
          timezone = 'Asia/Kolkata';
          utmSource = 'events';
          utmCampaign = 'doodling';
          utmTerm = '23rdJan2022';
          doGenerateCertificate = false;
          break;
        case EVENTS.CHRISTMASCARNIVAL.registrationFormId25thRS:
          country = 'india';
          timezone = 'Asia/Kolkata';
          utmSource = 'radiostreet';
          utmCampaign = 'christmascarnival_25dec';
          doGenerateCertificate = false;
          break;
        case EVENTS.CHRISTMASCARNIVAL.registrationFormId26th:
          country = 'india';
          timezone = 'Asia/Kolkata';
          utmSource = 'communityevent';
          utmCampaign = 'christmascarnival_26dec';
          doGenerateCertificate = false;
          break;
        case EVENTS.CHRISTMASCARNIVAL.formId:
          country = 'india';
          timezone = 'Asia/Kolkata';
          utmSource = 'communityevent';
          utmCampaign = 'christmascarnival_24dec';
          break;
        case EVENTS.CHRISTMASCARNIVAL.formId25th:
          country = 'india';
          timezone = 'Asia/Kolkata';
          utmSource = 'events';
          utmCampaign = 'doodling';
          break;
        case EVENTS.DOODLING.formId:
          country = 'india';
          timezone = 'Asia/Kolkata';
          utmSource = 'events';
          utmCampaign = 'doodling';
          break;
        default:
          country = 'india';
          timezone = 'Asia/Kolkata';
          utmSource = 'communityevent';
          utmCampaign = 'spysquadcamp_18dec';
          break;
      }

      if (get(hidden, 'utm_campaign')) {
        utmCampaign = get(hidden, 'utm_campaign');
      }
      if (get(hidden, 'utm_content')) {
        utmContent = get(hidden, 'utm_content');
      }
      if (get(hidden, 'utm_medium')) {
        utmMedium = get(hidden, 'utm_medium');
      }
      if (get(hidden, 'utm_source')) {
        utmSource = get(hidden, 'utm_source');
      }
      if (get(hidden, 'utm_term')) {
        utmTerm = get(hidden, 'utm_term');
      }
      studentDetailsObject = {
        ...studentDetailsObject,
        country,
        timezone,
        utmSource,
        utmCampaign,
        utmContent,
        utmMedium,
        utmTerm,
      };
      usersData(studentDetailsObject, formId, doGenerateCertificate);
    }
    res.sendStatus(200);
  } else {
    res.status(401).send('Unauthorized');
  }
};

export default typeformWebhookController;
