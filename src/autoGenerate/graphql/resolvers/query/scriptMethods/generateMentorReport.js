/* eslint-disable no-console */
import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import {
  MENTOR_REPORT_DAYS,
  MENTOR_REPORT_COUNTRY,
  MENTOR_REPORT_SESSION_TYPE,
  leadStatus,
} from '../../../../../../constants';

const mentorMenteeSessionsQuery = (
  startDate,
  endDate,
) => `
  query{
    mentorMenteeSessions(filter: {and: [${MENTOR_REPORT_SESSION_TYPE === 'trial' ? '{topic_some: {order: 1}},' : ''} {source_not: school}, {menteeSession_some:{user_some:{studentProfile_some:{batch_exists:false}}}}, {sessionStartDate_gt: "${startDate}"}, {sessionStartDate_lte: "${endDate}"}]}, orderBy: sessionStartDate_DESC) {
      id
      leadStatus
      sessionStatus
      hasRescheduled
      mentorSession {
        id
        user {
          id
          name
          username
        }
      }
      salesOperation {
        id
        enrollmentType
        leadStatus
        userPaymentPlan{
          id
          finalSellingPrice
          product{
            type
          }
        }
        salesOperationLog{
          topic{
            order
          }
        }
        parentCounsellingDone
        oneToOne
        notRelevantDifferentStream
        noPayingPower
        notInterestedInCoding
        oneToTwo
        extrovertStudent
        studentEnglishSpeakingSkill
        nextCallOn
        otherReasonForNextStep
        nextSteps
        knowCoding
        fastLearner
        notAQualifiedLeadComment
        ageNotAppropriate
        learningAptitudeIssue
        lookingForAdvanceCourse
        prodigyChild
        pricingPitched
        parentEnglishSpeakingSkill
        leadNotVerifiedProperly
        oneToThree
        hasRescheduled
        zoomIssue
        turnedUpButLeftAbruptly
        rescheduledDate
        rescheduledDateProvided
        notResponseAndDidNotTurnUp
        internetIssue
        powerCut
        otherReasonForReschedule
        chromeIssue
        laptopIssue
      }
      rating
      sessionRecordingLink
    }
  }
  `;

const mentorSessionsQuery = (
  startDate,
  endDate,
) => `
  query{
    mentorSessions(filter: {and: [{sessionType: ${MENTOR_REPORT_SESSION_TYPE}}, {availabilityDate_gt: "${startDate}"}, {availabilityDate_lte: "${endDate}"}]}, orderBy: availabilityDate_DESC) {
      id
      course {
        id
      }
      createdAt
      updatedAt
      availabilityDate
      sessionType
      user {
        id
        name
        email
        username
        phone {
          countryCode
          number
        }
      }
      slot0
      slot1
      slot2
      slot3
      slot4
      slot5
      slot6
      slot7
      slot8
      slot9
      slot10
      slot11
      slot12
      slot13
      slot14
      slot15
      slot16
      slot17
      slot18
      slot19
      slot20
      slot21
      slot22
      slot23
    }
  }
  `;

const mentorReportQuery = (
  mentorId,
  startDate,
  endDate,
) => `
  query{
    mentorReports(filter:{
      and:[
        {
          reportDate_gt: "${startDate}"
        },
        {
          reportDate_lte: "${endDate}"
        },
        {
          mentor_some:{
            id:"${mentorId}"
          }
        },
        {
          country: ${MENTOR_REPORT_COUNTRY}
        },
        {
          sessionType: ${MENTOR_REPORT_SESSION_TYPE}
        }
      ]
    }){
      id
    }
  }
  `;

const addMentorReportQuery = (
  mentorId,
  reportDate,
  slotsOpened,
  bookingsAssigned,
  bookingsRescheduled,
  formFilled,
  sessionLinkUploaded,
  trialsCompleted,
  unfit,
  lost,
  cold,
  pipeline,
  hot,
  won,
  oneToOneConversion,
  oneToTwoConversion,
  oneToThreeConversion,
  pythonCourseRating1,
  pythonCourseRating2,
  pythonCourseRating3,
  pythonCourseRating4,
  pythonCourseRating5,
) => `
mutation{
  addMentorReport(
    mentorConnectId:"${mentorId}",
    input:{
      reportDate:"${reportDate}",
      slotsOpened: ${slotsOpened},
      bookingsAssigned: ${bookingsAssigned},
      bookingsRescheduled: ${bookingsRescheduled},
      formFilled: ${formFilled},
      sessionLinkUploaded: ${sessionLinkUploaded},
      trialsCompleted: ${trialsCompleted},
      unfit: ${unfit},
      lost: ${lost},
      cold: ${cold},
      pipeline: ${pipeline},
      hot: ${hot},
      won: ${won},
      oneToOneConversion: ${oneToOneConversion},
      oneToTwoConversion: ${oneToTwoConversion},
      oneToThreeConversion: ${oneToThreeConversion},
      pythonCourseRating1: ${pythonCourseRating1},
      pythonCourseRating2: ${pythonCourseRating2},
      pythonCourseRating3: ${pythonCourseRating3},
      pythonCourseRating4: ${pythonCourseRating4},
      pythonCourseRating5: ${pythonCourseRating5},
      country: ${MENTOR_REPORT_COUNTRY},
      sessionType: ${MENTOR_REPORT_SESSION_TYPE},
    }
  ){
    id
  }
}
`;

const updateMentorReportQuery = (
  mentorReportId,
  slotsOpened,
  bookingsAssigned,
  bookingsRescheduled,
  formFilled,
  sessionLinkUploaded,
  trialsCompleted,
  unfit,
  lost,
  cold,
  pipeline,
  hot,
  won,
  oneToOneConversion,
  oneToTwoConversion,
  oneToThreeConversion,
  pythonCourseRating1,
  pythonCourseRating2,
  pythonCourseRating3,
  pythonCourseRating4,
  pythonCourseRating5,
) => `
mutation{
  updateMentorReport(
    id:"${mentorReportId}",
    input:{
      slotsOpened: ${slotsOpened},
      bookingsAssigned: ${bookingsAssigned},
      bookingsRescheduled: ${bookingsRescheduled},
      formFilled: ${formFilled},
      sessionLinkUploaded: ${sessionLinkUploaded},
      trialsCompleted: ${trialsCompleted},
      unfit: ${unfit},
      lost: ${lost},
      cold: ${cold},
      pipeline: ${pipeline},
      hot: ${hot},
      won: ${won},
      oneToOneConversion: ${oneToOneConversion},
      oneToTwoConversion: ${oneToTwoConversion},
      oneToThreeConversion: ${oneToThreeConversion},
      pythonCourseRating1: ${pythonCourseRating1},
      pythonCourseRating2: ${pythonCourseRating2},
      pythonCourseRating3: ${pythonCourseRating3},
      pythonCourseRating4: ${pythonCourseRating4},
      pythonCourseRating5: ${pythonCourseRating5},
      country: ${MENTOR_REPORT_COUNTRY},
      sessionType: ${MENTOR_REPORT_SESSION_TYPE},
    }
  ){
    id
  }
}
`;

const getIsFormFilled = (salesOperationData) => {
  console.log('-------------------------------salesOperationData', salesOperationData);
  const logs = get(salesOperationData, 'salesOperationLog');
  const cmntStatusCheckKeys = [
    'parentCounsellingDone',
    'oneToOne',
    'notRelevantDifferentStream',
    'noPayingPower',
    'notInterestedInCoding',
    'oneToTwo',
    'extrovertStudent',
    'studentEnglishSpeakingSkill',
    'leadStatus',
    'nextCallOn',
    'otherReasonForNextStep',
    'nextSteps',
    'knowCoding',
    'fastLearner',
    'notAQualifiedLeadComment',
    'ageNotAppropriate',
    'learningAptitudeIssue',
    'lookingForAdvanceCourse',
    'prodigyChild',
    'pricingPitched',
    'parentEnglishSpeakingSkill',
    'leadNotVerifiedProperly',
    'oneToThree',
  ];
  const statusKeysFromSession = [
    'hasRescheduled',
    'zoomIssue',
    'turnedUpButLeftAbruptly',
    'rescheduledDate',
    'rescheduledDateProvided',
    'notResponseAndDidNotTurnUp',
    'internetIssue',
    'powerCut',
    'otherReasonForReschedule',
    'chromeIssue',
    'laptopIssue',
  ];

  // for comments
  if (logs && logs.length > 0) {
    for (let i = 0; i < logs.length; i += 1) {
      if (get(logs[i], 'topic.order') === 1) {
        return true;
      }
    }
  }
  if (salesOperationData) {
    // for other checks
    for (let item = 0; item < cmntStatusCheckKeys.length; item += 1) {
      if (salesOperationData[cmntStatusCheckKeys[item]]) {
        return true;
      }
    }
    for (let item = 0; item < statusKeysFromSession.length; item += 1) {
      if (salesOperationData[statusKeysFromSession[item]]) {
        return true;
      }
    }
  }
  return false;
};

const generateMentorReport = async () => {
  let totalLoopDays = MENTOR_REPORT_DAYS;
  let endDate = new Date();
  const startDate = new Date();
  endDate.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);

  while (totalLoopDays > 0) {
    const mentorReportsObj = {};
    totalLoopDays -= 1;
    startDate.setDate(endDate.getDate() - 1);
    console.log('----------------------startDate', startDate);
    console.log('----------------------endDate', endDate);
    // eslint-disable-next-line no-await-in-loop
    const mentorMenteeSessionsRes = await callLocalGraphqlApi(mentorMenteeSessionsQuery(startDate, endDate));
    const mentorMenteeSessions = get(mentorMenteeSessionsRes, 'data.mentorMenteeSessions', []);
    // console.log('-----------------------------mentorMenteeSessions', mentorMenteeSessions);
    // eslint-disable-next-line no-restricted-syntax
    for (const mentorMenteeSession of mentorMenteeSessions) {
      console.log('-----------------------------mentorMenteeSession', mentorMenteeSession);
      const mentorIdInMentorMenteeSession = get(mentorMenteeSession, 'mentorSession.user.id', '');
      if (mentorIdInMentorMenteeSession) {
        const bookingsAssigned = 1;

        const hasRescheduled = get(mentorMenteeSession, 'hasRescheduled', false);
        const bookingsRescheduled = hasRescheduled ? 1 : 0;

        const sessionRecordingLink = get(mentorMenteeSession, 'sessionRecordingLink', '');
        const sessionLinkUploaded = sessionRecordingLink ? 1 : 0;

        const isFormFilled = getIsFormFilled(get(mentorMenteeSession, 'salesOperation', ''));
        const formFilled = isFormFilled ? 1 : 0;

        const sessionStatus = get(mentorMenteeSession, 'sessionStatus', '');
        const trialsCompleted = sessionStatus === 'completed' ? 1 : 0;

        const userLeadStatus = get(mentorMenteeSession, 'leadStatus', '');
        console.log('------------------------------userLeadStatus', userLeadStatus);
        const unfit = userLeadStatus === leadStatus.unfit ? 1 : 0;
        const lost = userLeadStatus === leadStatus.lost ? 1 : 0;
        const cold = userLeadStatus === leadStatus.cold ? 1 : 0;
        const pipeline = userLeadStatus === leadStatus.pipeline ? 1 : 0;
        const hot = userLeadStatus === leadStatus.hot ? 1 : 0;
        const won = userLeadStatus === leadStatus.won ? 1 : 0;

        const userConvertedModel = get(mentorMenteeSession, 'salesOperation.userPaymentPlan.product.type', '');
        const oneToOneConversion = userConvertedModel === 'oneToOne' ? 1 : 0;
        const oneToTwoConversion = userConvertedModel === 'oneToTwo' ? 1 : 0;
        const oneToThreeConversion = userConvertedModel === 'oneToThree' ? 1 : 0;

        const mentorRating = get(mentorMenteeSession, 'rating', 0);
        const pythonCourseRating1 = mentorRating === 1 ? 1 : 0;
        const pythonCourseRating2 = mentorRating === 2 ? 1 : 0;
        const pythonCourseRating3 = mentorRating === 3 ? 1 : 0;
        const pythonCourseRating4 = mentorRating === 4 ? 1 : 0;
        const pythonCourseRating5 = mentorRating === 5 ? 1 : 0;

        if (mentorReportsObj[`${mentorIdInMentorMenteeSession}`]) {
          mentorReportsObj[`${mentorIdInMentorMenteeSession}`].bookingsAssigned = mentorReportsObj[`${mentorIdInMentorMenteeSession}`].bookingsAssigned + bookingsAssigned;
          mentorReportsObj[`${mentorIdInMentorMenteeSession}`].bookingsRescheduled = mentorReportsObj[`${mentorIdInMentorMenteeSession}`].bookingsRescheduled + bookingsRescheduled;
          mentorReportsObj[`${mentorIdInMentorMenteeSession}`].formFilled = mentorReportsObj[`${mentorIdInMentorMenteeSession}`].formFilled + formFilled;
          mentorReportsObj[`${mentorIdInMentorMenteeSession}`].sessionLinkUploaded = mentorReportsObj[`${mentorIdInMentorMenteeSession}`].sessionLinkUploaded + sessionLinkUploaded;
          mentorReportsObj[`${mentorIdInMentorMenteeSession}`].trialsCompleted = mentorReportsObj[`${mentorIdInMentorMenteeSession}`].trialsCompleted + trialsCompleted;
          mentorReportsObj[`${mentorIdInMentorMenteeSession}`].unfit = mentorReportsObj[`${mentorIdInMentorMenteeSession}`].unfit + unfit;
          mentorReportsObj[`${mentorIdInMentorMenteeSession}`].lost = mentorReportsObj[`${mentorIdInMentorMenteeSession}`].lost + lost;
          mentorReportsObj[`${mentorIdInMentorMenteeSession}`].cold = mentorReportsObj[`${mentorIdInMentorMenteeSession}`].cold + cold;
          mentorReportsObj[`${mentorIdInMentorMenteeSession}`].pipeline = mentorReportsObj[`${mentorIdInMentorMenteeSession}`].pipeline + pipeline;
          mentorReportsObj[`${mentorIdInMentorMenteeSession}`].hot = mentorReportsObj[`${mentorIdInMentorMenteeSession}`].hot + hot;
          mentorReportsObj[`${mentorIdInMentorMenteeSession}`].won = mentorReportsObj[`${mentorIdInMentorMenteeSession}`].won + won;
          mentorReportsObj[`${mentorIdInMentorMenteeSession}`].oneToOneConversion = mentorReportsObj[`${mentorIdInMentorMenteeSession}`].oneToOneConversion + oneToOneConversion;
          mentorReportsObj[`${mentorIdInMentorMenteeSession}`].oneToTwoConversion = mentorReportsObj[`${mentorIdInMentorMenteeSession}`].oneToTwoConversion + oneToTwoConversion;
          mentorReportsObj[`${mentorIdInMentorMenteeSession}`].oneToThreeConversion = mentorReportsObj[`${mentorIdInMentorMenteeSession}`].oneToThreeConversion + oneToThreeConversion;
          mentorReportsObj[`${mentorIdInMentorMenteeSession}`].pythonCourseRating1 = mentorReportsObj[`${mentorIdInMentorMenteeSession}`].pythonCourseRating1 + pythonCourseRating1;
          mentorReportsObj[`${mentorIdInMentorMenteeSession}`].pythonCourseRating2 = mentorReportsObj[`${mentorIdInMentorMenteeSession}`].pythonCourseRating2 + pythonCourseRating2;
          mentorReportsObj[`${mentorIdInMentorMenteeSession}`].pythonCourseRating3 = mentorReportsObj[`${mentorIdInMentorMenteeSession}`].pythonCourseRating3 + pythonCourseRating3;
          mentorReportsObj[`${mentorIdInMentorMenteeSession}`].pythonCourseRating4 = mentorReportsObj[`${mentorIdInMentorMenteeSession}`].pythonCourseRating4 + pythonCourseRating4;
          mentorReportsObj[`${mentorIdInMentorMenteeSession}`].pythonCourseRating5 = mentorReportsObj[`${mentorIdInMentorMenteeSession}`].pythonCourseRating5 + pythonCourseRating5;
        } else {
          mentorReportsObj[`${mentorIdInMentorMenteeSession}`] = {
            slotsOpened: 0,
            bookingsAssigned,
            bookingsRescheduled,
            formFilled,
            sessionLinkUploaded,
            trialsCompleted,
            unfit,
            lost,
            cold,
            pipeline,
            hot,
            won,
            oneToOneConversion,
            oneToTwoConversion,
            oneToThreeConversion,
            pythonCourseRating1,
            pythonCourseRating2,
            pythonCourseRating3,
            pythonCourseRating4,
            pythonCourseRating5,
          };
        }
      }
    }

    // eslint-disable-next-line no-await-in-loop
    const mentorSessionsRes = await callLocalGraphqlApi(mentorSessionsQuery(startDate, endDate));
    const mentorSessions = get(mentorSessionsRes, 'data.mentorSessions', []);
    console.log('-----------------------------mentorSessions', mentorSessions);

    // eslint-disable-next-line no-restricted-syntax
    for (const mentorSession of mentorSessions) {
      console.log('-----------------------------mentorSession', mentorSession);
      const mentorIdInMentorSession = get(mentorSession, 'user.id', '');
      if (mentorIdInMentorSession) {
        let slotsOpened = 0;
        if (get(mentorSession, 'slot0', false)) {
          slotsOpened += 1;
        }
        if (get(mentorSession, 'slot1', false)) {
          slotsOpened += 1;
        }
        if (get(mentorSession, 'slot2', false)) {
          slotsOpened += 1;
        }
        if (get(mentorSession, 'slot3', false)) {
          slotsOpened += 1;
        }
        if (get(mentorSession, 'slot4', false)) {
          slotsOpened += 1;
        }
        if (get(mentorSession, 'slot5', false)) {
          slotsOpened += 1;
        }
        if (get(mentorSession, 'slot6', false)) {
          slotsOpened += 1;
        }
        if (get(mentorSession, 'slot7', false)) {
          slotsOpened += 1;
        }
        if (get(mentorSession, 'slot8', false)) {
          slotsOpened += 1;
        }
        if (get(mentorSession, 'slot9', false)) {
          slotsOpened += 1;
        }
        if (get(mentorSession, 'slot10', false)) {
          slotsOpened += 1;
        }
        if (get(mentorSession, 'slot11', false)) {
          slotsOpened += 1;
        }
        if (get(mentorSession, 'slot12', false)) {
          slotsOpened += 1;
        }
        if (get(mentorSession, 'slot13', false)) {
          slotsOpened += 1;
        }
        if (get(mentorSession, 'slot14', false)) {
          slotsOpened += 1;
        }
        if (get(mentorSession, 'slot15', false)) {
          slotsOpened += 1;
        }
        if (get(mentorSession, 'slot16', false)) {
          slotsOpened += 1;
        }
        if (get(mentorSession, 'slot17', false)) {
          slotsOpened += 1;
        }
        if (get(mentorSession, 'slot18', false)) {
          slotsOpened += 1;
        }
        if (get(mentorSession, 'slot19', false)) {
          slotsOpened += 1;
        }
        if (get(mentorSession, 'slot20', false)) {
          slotsOpened += 1;
        }
        if (get(mentorSession, 'slot21', false)) {
          slotsOpened += 1;
        }
        if (get(mentorSession, 'slot22', false)) {
          slotsOpened += 1;
        }
        if (get(mentorSession, 'slot23', false)) {
          slotsOpened += 1;
        }

        if (mentorReportsObj[`${mentorIdInMentorSession}`]) {
          mentorReportsObj[`${mentorIdInMentorSession}`].slotsOpened = mentorReportsObj[`${mentorIdInMentorSession}`].slotsOpened + slotsOpened;
        } else {
          mentorReportsObj[`${mentorIdInMentorSession}`] = {
            slotsOpened,
            bookingsAssigned: 0,
            bookingsRescheduled: 0,
            formFilled: 0,
            sessionLinkUploaded: 0,
            trialsCompleted: 0,
            unfit: 0,
            lost: 0,
            cold: 0,
            pipeline: 0,
            hot: 0,
            won: 0,
            oneToOneConversion: 0,
            oneToTwoConversion: 0,
            oneToThreeConversion: 0,
            pythonCourseRating1: 0,
            pythonCourseRating2: 0,
            pythonCourseRating3: 0,
            pythonCourseRating4: 0,
            pythonCourseRating5: 0,
          };
        }
      }
    }

    console.log('--------------------------------mentorReportsObj', mentorReportsObj);
    // eslint-disable-next-line
    for (const mentorId in mentorReportsObj) {
      // eslint-disable-next-line no-await-in-loop
      const mentorReportRes = await callLocalGraphqlApi(mentorReportQuery(mentorId, startDate, endDate));
      const mentorReportId = get(mentorReportRes, 'data.mentorReports[0].id', '');
      console.log('-------------------------mentorReportId', mentorReportId);
      if (mentorReportId) {
        // eslint-disable-next-line no-await-in-loop
        await callLocalGraphqlApi(updateMentorReportQuery(
          mentorReportId,
          mentorReportsObj[`${mentorId}`].slotsOpened,
          mentorReportsObj[`${mentorId}`].bookingsAssigned,
          mentorReportsObj[`${mentorId}`].bookingsRescheduled,
          mentorReportsObj[`${mentorId}`].formFilled,
          mentorReportsObj[`${mentorId}`].sessionLinkUploaded,
          mentorReportsObj[`${mentorId}`].trialsCompleted,
          mentorReportsObj[`${mentorId}`].unfit,
          mentorReportsObj[`${mentorId}`].lost,
          mentorReportsObj[`${mentorId}`].cold,
          mentorReportsObj[`${mentorId}`].pipeline,
          mentorReportsObj[`${mentorId}`].hot,
          mentorReportsObj[`${mentorId}`].won,
          mentorReportsObj[`${mentorId}`].oneToOneConversion,
          mentorReportsObj[`${mentorId}`].oneToTwoConversion,
          mentorReportsObj[`${mentorId}`].oneToThreeConversion,
          mentorReportsObj[`${mentorId}`].pythonCourseRating1,
          mentorReportsObj[`${mentorId}`].pythonCourseRating2,
          mentorReportsObj[`${mentorId}`].pythonCourseRating3,
          mentorReportsObj[`${mentorId}`].pythonCourseRating4,
          mentorReportsObj[`${mentorId}`].pythonCourseRating5,
        ));
      } else {
        // eslint-disable-next-line no-await-in-loop
        await callLocalGraphqlApi(addMentorReportQuery(
          mentorId,
          endDate,
          mentorReportsObj[`${mentorId}`].slotsOpened,
          mentorReportsObj[`${mentorId}`].bookingsAssigned,
          mentorReportsObj[`${mentorId}`].bookingsRescheduled,
          mentorReportsObj[`${mentorId}`].formFilled,
          mentorReportsObj[`${mentorId}`].sessionLinkUploaded,
          mentorReportsObj[`${mentorId}`].trialsCompleted,
          mentorReportsObj[`${mentorId}`].unfit,
          mentorReportsObj[`${mentorId}`].lost,
          mentorReportsObj[`${mentorId}`].cold,
          mentorReportsObj[`${mentorId}`].pipeline,
          mentorReportsObj[`${mentorId}`].hot,
          mentorReportsObj[`${mentorId}`].won,
          mentorReportsObj[`${mentorId}`].oneToOneConversion,
          mentorReportsObj[`${mentorId}`].oneToTwoConversion,
          mentorReportsObj[`${mentorId}`].oneToThreeConversion,
          mentorReportsObj[`${mentorId}`].pythonCourseRating1,
          mentorReportsObj[`${mentorId}`].pythonCourseRating2,
          mentorReportsObj[`${mentorId}`].pythonCourseRating3,
          mentorReportsObj[`${mentorId}`].pythonCourseRating4,
          mentorReportsObj[`${mentorId}`].pythonCourseRating5,
        ));
      }
    }
    endDate = new Date(startDate);
  }
};

export default generateMentorReport;
