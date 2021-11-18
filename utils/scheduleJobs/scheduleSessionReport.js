/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
import { get } from 'lodash';
import moment from 'moment';
import {
  SESSION_REPORT_DAYS, COUNTRIES, VERTICALS, GRADE,
} from '../../constants';
import callLocalGraphqlApi from '../../src/api/callLocalGraphqlApi';
import { log } from '../log';

const masterQuery = (todayStartDate,
  todayEndDate,
  otherDayStartDate,
  otherDayEndDate,
  country,
  filterQuery) => `
    query{
  registeredUsers: usersMeta(filter:{
    and:[
      {role: parent}
      {createdAt_gte:"${otherDayStartDate}"}
      {createdAt_lt:"${otherDayEndDate}"}
      ${filterQuery.source}
      ${filterQuery.user}
      {country:${country}}
      {parentProfile_some:{
        children_some:{
          user_some:{
            studentProfile_some:${filterQuery.grade}
          }
        }
      }}
    ]
  }){
    count
  }
  verifiedUsers: usersMeta(filter:{
    and:[
      {role: parent}
      {phoneVerified:true}
      {createdAt_gte:"${otherDayStartDate}"}
      {createdAt_lt:"${otherDayEndDate}"}
      ${filterQuery.source}
      ${filterQuery.user}
      {country:${country}}
      {parentProfile_some:{
        children_some:{
          user_some:{
            studentProfile_some:${filterQuery.grade}
          }
        }
      }}
    ]
  }){
    count
  }
  bookedSessions: menteeSessionsMeta(filter:{
    and:[
      {bookingDate_gte:"${todayStartDate}"}
      {bookingDate_lte:"${todayEndDate}"}
      ${filterQuery.source}
      {country:${country}}
      {topic_some:{order:1}}
      {
        user_some:{
          and:[
            {createdAt_gte:"${otherDayStartDate}"}
            {createdAt_lt:"${otherDayEndDate}"}
            ${filterQuery.user}
            {
              studentProfile_some:${filterQuery.grade}
            }
          ]
        }
      }
    ]
  }){
    count
  }
  completedSessions: mentorMenteeSessionsMeta(filter:{
    and:[
      {sessionStatus:completed}
      {sessionStartDate_gte:"${todayStartDate}"}
      {sessionStartDate_lt:"${todayEndDate}"}
      ${filterQuery.source}
      {country:${country}}
      {topic_some:{order:1}}
      {
        menteeSession_some:{
          user_some:{
            and:[
              {createdAt_gte:"${otherDayStartDate}"}
              {createdAt_lt:"${otherDayEndDate}"}
              ${filterQuery.user}
              {
                studentProfile_some:${filterQuery.grade}
              }
            ]
          }
        }
      }
    ]
  }){
    count
  }
  convertedUsersToday: salesOperationsMeta(filter:{
    and:[
      {leadStatus:won}
      ${filterQuery.source}
      {country:${country}}
      {createdAt_gt:"${todayStartDate}"}
      {createdAt_lt: "${todayEndDate}"}
      {
        client_some:{
          and:[
            {createdAt_gte:"${otherDayStartDate}"}
            {createdAt_lt:"${otherDayEndDate}"}
            ${filterQuery.user}
            {
              studentProfile_some:${filterQuery.grade}
            }
          ]
        }
      }
    ]
  }){
    count
  }
  bookedSessionsByAgent: menteeSessionsMeta(filter:{
    and:[
      {bookingDate_gte:"${todayStartDate}"}
      {bookingDate_lte:"${todayEndDate}"}
      ${filterQuery.source}
      {country:${country}}
      {topic_some:{order:1}}
      {bookedBy: tekieTeam}
      {
        user_some:{
          and:[
            {createdAt_gte:"${otherDayStartDate}"}
            {createdAt_lt:"${otherDayEndDate}"}
            ${filterQuery.user}
            {
              studentProfile_some:${filterQuery.grade}
            }
          ]
        }
      }
    ]
  }){
    count
  }
  totalBookedSessionsToday: menteeSessionsMeta(filter:{
    and:[
      {bookingDate_gte:"${todayStartDate}"}
      {bookingDate_lte:"${todayEndDate}"}
      ${filterQuery.source}
      ${filterQuery.menteeSessionsMetaVertical}
      {country:${country}}
      {topic_some:{order:1}}
      {
      user_some:{
        studentProfile_some:${filterQuery.grade}
      }
    }
    ]
  }){
    count
  }
  totalCompletedSessionsToday: mentorMenteeSessionsMeta(filter:{
    and:[
      {sessionStatus:completed}
      {sessionStartDate_gte:"${todayStartDate}"}
      {sessionStartDate_lt:"${todayEndDate}"}
      ${filterQuery.source}
      ${filterQuery.mentorMenteeSessionsMetaVertical}
      {country:${country}}
      {topic_some:{order:1}}
      {menteeSession_some: {
        user_some :{
          studentProfile_some:${filterQuery.grade}
        }
      }}
    ]
  }){
    count
  }
  totalConvertedUsers: salesOperationsMeta(filter:{
    and:[
      {leadStatus:won}
      ${filterQuery.source}
      ${filterQuery.salesOperationsMetaVertical}
      {country:${country}}
      {createdAt_gt:"${todayStartDate}"}
      {createdAt_lt: "${todayEndDate}"}
      {
        client_some :{
          studentProfile_some:${filterQuery.grade}
        }
      }
    ]
  }){
    count
  }
  mentorMenteeSessions: mentorMenteeSessions(filter:{
    and:[
      ${filterQuery.source}
      ${filterQuery.mentorMenteeSessionsVertical}
      {topic_some:{order:1}}
      {sessionStartDate_gte:"${todayStartDate}"}
      {sessionStartDate_lte:"${todayEndDate}"}
      {country: ${country}}
      {menteeSession_some: {
        user_some :{
          studentProfile_some:${filterQuery.grade}
        }
      }
    }
    ]
  }orderBy:sessionStartDate_DESC){
    id
    sessionStartDate
    hasRescheduled
    rescheduledDate
    rescheduledDateProvided
    zoomIssue
    internetIssue
    laptopIssue
    chromeIssue
    powerCut
    notResponseAndDidNotTurnUp
    classDurationExceeded
    turnedUpButLeftAbruptly
    leadNotVerifiedProperly
    otherReasonForReschedule
    otherReasonForChallenges
    webSiteLoadingIssue
    videoNotLoading
    codePlaygroundIssue
    logInOTPError
    otherTechnicalReason
    languageBarrier
    otherLanguageBarrier
  }
  sessionLogs: sessionLogs(filter:{
    and:[
      {action:deleteMentorMenteeSession}
      ${filterQuery.source}
      ${filterQuery.sessionLogsVertical}
      {topic_some:{order:1}}
      {sessionStartDate_gte:"${todayStartDate}"}
      {sessionStartDate_lte:"${todayEndDate}"}
      {country: ${country}}
      {
        client_some :{
          studentProfile_some:${filterQuery.grade}
        }
      }
    ]
  }orderBy:sessionStartDate_DESC){
    id
    sessionStartDate
    hasRescheduled
    rescheduledDate
    rescheduledDateProvided
    zoomIssue
    internetIssue
    laptopIssue
    chromeIssue
    powerCut
    notResponseAndDidNotTurnUp
    classDurationExceeded
    turnedUpButLeftAbruptly
    leadNotVerifiedProperly
    otherReasonForReschedule
    otherReasonForChallenges
    webSiteLoadingIssue
    videoNotLoading
    codePlaygroundIssue
    logInOTPError
    otherTechnicalReason
    languageBarrier
    otherLanguageBarrier
  }
}
  `;

const sessionReportQuery = (date, country, vertical) => `
  {
    sessionReports(filter: {
      and: [
        {date: "${date}"},
        {country:${country}}
        {vertical:${vertical}}
      ]
    }){
      id
    }
  }
`;

const sessionGradeReportQuery = (date, country, vertical) => `
  {
    sessionGradeReports(filter: {
      and: [
        {date: "${date}"},
        {country:${country}}
        {vertical:${vertical}}
      ]
    }){
      id
    }
  }
`;

const addSessionReport = (input) => `
  mutation{
  addSessionReport(input: {
    date: "${input.date}",
    country: ${input.country},
    vertical: ${input.vertical},
    registeredSameDay: {
      registered: ${input.registeredSameDay.registered},
      booked: ${input.registeredSameDay.booked},
      demoCompleted: ${input.registeredSameDay.demoCompleted},
      converted: ${input.registeredSameDay.converted},
      phoneVerified: ${input.registeredSameDay.phoneVerified},
      bookedBySelf: ${input.registeredSameDay.bookedBySelf},
      bookedByAgent: ${input.registeredSameDay.bookedByAgent}
    }
    registeredOneDayBefore: {
      registered: ${input.registeredOneDayBefore.registered},
      booked: ${input.registeredOneDayBefore.booked},
      demoCompleted: ${input.registeredOneDayBefore.demoCompleted},
      converted: ${input.registeredOneDayBefore.converted},
      phoneVerified: ${input.registeredOneDayBefore.phoneVerified},
      bookedBySelf: ${input.registeredOneDayBefore.bookedBySelf},
      bookedByAgent: ${input.registeredOneDayBefore.bookedByAgent}
    }
    registeredTwoDaysBefore: {
      registered: ${input.registeredTwoDaysBefore.registered},
      booked: ${input.registeredTwoDaysBefore.booked},
      demoCompleted: ${input.registeredTwoDaysBefore.demoCompleted},
      converted: ${input.registeredTwoDaysBefore.converted},
      phoneVerified: ${input.registeredTwoDaysBefore.phoneVerified},
      bookedBySelf: ${input.registeredTwoDaysBefore.bookedBySelf},
      bookedByAgent: ${input.registeredTwoDaysBefore.bookedByAgent}
    }
    registeredThreeDaysBefore: {
      registered: ${input.registeredThreeDaysBefore.registered},
      booked: ${input.registeredThreeDaysBefore.booked},
      demoCompleted: ${input.registeredThreeDaysBefore.demoCompleted},
      converted: ${input.registeredThreeDaysBefore.converted},
      phoneVerified: ${input.registeredThreeDaysBefore.phoneVerified},
      bookedBySelf: ${input.registeredThreeDaysBefore.bookedBySelf},
      bookedByAgent: ${input.registeredThreeDaysBefore.bookedByAgent}
    }
    totalBooked: ${input.totalBooked},
    totalDemoCompleted: ${input.totalDemoCompleted},
    totalConvertedUsers: ${input.totalConvertedUsers}
  }){
    id
  }
}
`;

const updateSessionReport = (input, id) => `
mutation{
  updateSessionReport(id: "${id}", input: {
    registeredSameDay: {
      registered: ${input.registeredSameDay.registered},
      booked: ${input.registeredSameDay.booked},
      demoCompleted: ${input.registeredSameDay.demoCompleted},
      converted: ${input.registeredSameDay.converted},
      phoneVerified: ${input.registeredSameDay.phoneVerified},
      bookedBySelf: ${input.registeredSameDay.bookedBySelf},
      bookedByAgent: ${input.registeredSameDay.bookedByAgent}
    }
    registeredOneDayBefore: {
      registered: ${input.registeredOneDayBefore.registered},
      booked: ${input.registeredOneDayBefore.booked},
      demoCompleted: ${input.registeredOneDayBefore.demoCompleted},
      converted: ${input.registeredOneDayBefore.converted},
      phoneVerified: ${input.registeredOneDayBefore.phoneVerified},
      bookedBySelf: ${input.registeredOneDayBefore.bookedBySelf},
      bookedByAgent: ${input.registeredOneDayBefore.bookedByAgent}
    }
    registeredTwoDaysBefore: {
      registered: ${input.registeredTwoDaysBefore.registered},
      booked: ${input.registeredTwoDaysBefore.booked},
      demoCompleted: ${input.registeredTwoDaysBefore.demoCompleted},
      converted: ${input.registeredTwoDaysBefore.converted},
      phoneVerified: ${input.registeredTwoDaysBefore.phoneVerified},
      bookedBySelf: ${input.registeredTwoDaysBefore.bookedBySelf},
      bookedByAgent: ${input.registeredTwoDaysBefore.bookedByAgent}
    }
    registeredThreeDaysBefore: {
      registered: ${input.registeredThreeDaysBefore.registered},
      booked: ${input.registeredThreeDaysBefore.booked},
      demoCompleted: ${input.registeredThreeDaysBefore.demoCompleted},
      converted: ${input.registeredThreeDaysBefore.converted},
      phoneVerified: ${input.registeredThreeDaysBefore.phoneVerified},
      bookedBySelf: ${input.registeredThreeDaysBefore.bookedBySelf},
      bookedByAgent: ${input.registeredThreeDaysBefore.bookedByAgent}
    }
    totalBooked: ${input.totalBooked},
    totalDemoCompleted: ${input.totalDemoCompleted},
    totalConvertedUsers: ${input.totalConvertedUsers},
    hasRescheduled: ${input.hasRescheduled},
    internetIssue: ${input.internetIssue},
    zoomIssue: ${input.zoomIssue},
    laptopIssue: ${input.laptopIssue},
    chromeIssue: ${input.chromeIssue},
    powerCut: ${input.powerCut},
    notResponseAndDidNotTurnUp: ${input.notResponseAndDidNotTurnUp},
    classDurationExceeded: ${input.classDurationExceeded},
    turnedUpButLeftAbruptly: ${input.turnedUpButLeftAbruptly},
    leadNotVerifiedProperly: ${input.leadNotVerifiedProperly},
    otherReasonForReschedule: ${input.otherReasonForReschedule},
    webSiteLoadingIssue: ${input.webSiteLoadingIssue},
    videoNotLoading: ${input.videoNotLoading},
    codePlaygroundIssue: ${input.codePlaygroundIssue},
    logInOTPError: ${input.logInOTPError},
  }){
    id
  }
}
`;

const generateSessionReport = async (numDaysToRunQuery) => {
  // setting current date (start and end times)
  // console.log('start');
  let dayCount = 0;
  const currentStartDate = new Date();
  const currentEndDate = new Date();
  currentStartDate.setHours(0, 0, 0, 0);
  currentEndDate.setHours(23, 59, 59, 999);

  while (numDaysToRunQuery > 0) {
    // according to parameter 'numDaysToRunQuery', we add session report for that many days
    // SESSION_REPORT_DAYS gives till how many days back we have to include in our report (currently 4)
    let totalLoopDays = SESSION_REPORT_DAYS;
    const todayStartDate = new Date(moment(currentStartDate).subtract(dayCount, 'days').toISOString());
    const todayEndDate = new Date(moment(currentEndDate).subtract(dayCount, 'days').toISOString());
    // todayStartDate.setDate(currentStartDate.getDate() - dayCount);
    // todayEndDate.setDate(currentEndDate.getDate() - dayCount);
    todayStartDate.setHours(0, 0, 0, 0);
    todayEndDate.setHours(23, 59, 59, 999);

    // for every country in array
    /* eslint-disable no-restricted-syntax */
    for (const country of COUNTRIES) {
      /*
        Here we loop to populate single report, per vertical, per day
      */
      for (const vertical of VERTICALS) {
        let forwardCount = 0;
        const sessionReportsObj = {};
        const filterQuery = {};
        // skip over all other countries if b2b or b2b2c (can change in future)
        /* eslint-disable no-continue */
        if ((vertical === 'b2b' || vertical === 'b2b2c') && country !== 'uae' && country !== 'india') {
          continue;
        }
        if (vertical === 'b2c') {
          filterQuery.source = '{source_not:school}';
          filterQuery.user = '';
          filterQuery.menteeSessionsMetaVertical = '';
          filterQuery.mentorMenteeSessionsMetaVertical = '';
          filterQuery.salesOperationsMetaVertical = '';
          filterQuery.mentorMenteeSessionsVertical = '';
          filterQuery.sessionLogsVertical = '';
        } else if (vertical === 'b2b') {
          filterQuery.source = '{source:school}';
          filterQuery.user = '{vertical: b2b}';
          filterQuery.menteeSessionsMetaVertical = '{user_some: {vertical: b2b}}';
          filterQuery.mentorMenteeSessionsMetaVertical = '{menteeSession_some: {user_some: {vertical: b2b}}}';
          filterQuery.salesOperationsMetaVertical = '{client_some: {vertical: b2b}}';
          filterQuery.mentorMenteeSessionsVertical = '{menteeSession_some: {user_some: {vertical: b2b}}}';
          filterQuery.sessionLogsVertical = '{client_some: {vertical: b2b}}';
        } else if (vertical === 'b2b2c') {
          filterQuery.source = '{source:school}';
          filterQuery.user = '{vertical: b2b2c}';
          filterQuery.menteeSessionsMetaVertical = '{user_some: {vertical: b2b2c}}';
          filterQuery.mentorMenteeSessionsMetaVertical = '{menteeSession_some: {user_some: {vertical: b2b2c}}}';
          filterQuery.salesOperationsMetaVertical = '{client_some: {vertical: b2b2c}}';
          filterQuery.mentorMenteeSessionsVertical = '{menteeSession_some: {user_some: {vertical: b2b2c}}}';
          filterQuery.sessionLogsVertical = '{client_some: {vertical: b2b2c}}';
        }
        // gathering data for past 4 days
        while (totalLoopDays > 0) {
          let registered = 0;
          let booked = 0;
          let demoCompleted = 0;
          let converted = 0;
          let phoneVerified = 0;
          let bookedBySelf = 0;
          let bookedByAgent = 0;

          const sessionGradeReportObj = {};

          for (const grade of GRADE) {
            const otherDayStartDate = new Date(moment(todayStartDate).subtract(forwardCount, 'days').toISOString());
            const otherDayEndDate = new Date(moment(todayEndDate).subtract(forwardCount, 'days').toISOString());
            otherDayStartDate.setHours(0, 0, 0, 0);
            otherDayEndDate.setHours(23, 59, 59, 999);
            filterQuery.grade = `{grade: ${grade}}`;
            const queryRes = await callLocalGraphqlApi(masterQuery(todayStartDate, todayEndDate, otherDayStartDate, otherDayEndDate, country, filterQuery));
            const data = get(queryRes, 'data', {});

            sessionGradeReportObj[`${grade}`] = {};
            sessionGradeReportObj[`${grade}`].registered = data.registeredUsers.count;
            sessionGradeReportObj[`${grade}`].booked = data.bookedSessions.count;
            sessionGradeReportObj[`${grade}`].demoCompleted = data.completedSessions.count;
            sessionGradeReportObj[`${grade}`].converted = data.totalConvertedUsers.count;
            sessionGradeReportObj[`${grade}`].phoneVerified = data.verifiedUsers.count;
            sessionGradeReportObj[`${grade}`].bookedBySelf = data.bookedSessions.count - data.bookedSessionsByAgent.count;
            sessionGradeReportObj[`${grade}`].bookedByAgent = data.bookedSessionsByAgent.count;

            registered += data.registeredUsers.count;
            booked += data.bookedSessions.count;
            demoCompleted += data.completedSessions.count;
            converted += data.convertedUsersToday.count;
            phoneVerified += data.verifiedUsers.count;
            bookedBySelf += data.bookedSessions.count - data.bookedSessionsByAgent.count;
            bookedByAgent += data.bookedSessionsByAgent.count;
          }

          // console.log(data);
          if (forwardCount === 0) {
            // we are in today bucket
            sessionReportsObj.registeredSameDay = {};
            sessionReportsObj.registeredSameDay.registered = registered;
            sessionReportsObj.registeredSameDay.booked = booked;
            sessionReportsObj.registeredSameDay.demoCompleted = demoCompleted;
            sessionReportsObj.registeredSameDay.converted = converted;
            sessionReportsObj.registeredSameDay.phoneVerified = phoneVerified;
            sessionReportsObj.registeredSameDay.bookedBySelf = bookedBySelf;
            sessionReportsObj.registeredSameDay.bookedByAgent = bookedByAgent;
          } else if (forwardCount === 1) {
            sessionReportsObj.registeredOneDayBefore = {};
            sessionReportsObj.registeredOneDayBefore.registered = registered;
            sessionReportsObj.registeredOneDayBefore.booked = booked;
            sessionReportsObj.registeredOneDayBefore.demoCompleted = demoCompleted;
            sessionReportsObj.registeredOneDayBefore.converted = converted;
            sessionReportsObj.registeredOneDayBefore.phoneVerified = phoneVerified;
            sessionReportsObj.registeredOneDayBefore.bookedBySelf = bookedBySelf;
            sessionReportsObj.registeredOneDayBefore.bookedByAgent = bookedByAgent;
          } else if (forwardCount === 2) {
            sessionReportsObj.registeredTwoDaysBefore = {};
            sessionReportsObj.registeredTwoDaysBefore.registered = registered;
            sessionReportsObj.registeredTwoDaysBefore.booked = booked;
            sessionReportsObj.registeredTwoDaysBefore.demoCompleted = demoCompleted;
            sessionReportsObj.registeredTwoDaysBefore.converted = converted;
            sessionReportsObj.registeredTwoDaysBefore.phoneVerified = phoneVerified;
            sessionReportsObj.registeredTwoDaysBefore.bookedBySelf = bookedBySelf;
            sessionReportsObj.registeredTwoDaysBefore.bookedByAgent = bookedByAgent;
          } else if (forwardCount === 3) {
            sessionReportsObj.registeredThreeDaysBefore = {};
            sessionReportsObj.registeredThreeDaysBefore.registered = registered;
            sessionReportsObj.registeredThreeDaysBefore.booked = booked;
            sessionReportsObj.registeredThreeDaysBefore.demoCompleted = demoCompleted;
            sessionReportsObj.registeredThreeDaysBefore.converted = converted;
            sessionReportsObj.registeredThreeDaysBefore.phoneVerified = phoneVerified;
            sessionReportsObj.registeredThreeDaysBefore.bookedBySelf = bookedBySelf;
            sessionReportsObj.registeredThreeDaysBefore.bookedByAgent = bookedByAgent;
          }

          sessionReportsObj.totalBooked = booked;
          sessionReportsObj.totalDemoCompleted = demoCompleted;
          sessionReportsObj.totalConvertedUsers = converted;
          sessionReportsObj.country = country;
          sessionReportsObj.date = todayStartDate;
          sessionReportsObj.vertical = vertical;

          // populate session reschedule reason count
          sessionReportsObj.hasRescheduled = 0;
          sessionReportsObj.internetIssue = 0;
          sessionReportsObj.zoomIssue = 0;
          sessionReportsObj.laptopIssue = 0;
          sessionReportsObj.chromeIssue = 0;
          sessionReportsObj.powerCut = 0;
          sessionReportsObj.notResponseAndDidNotTurnUp = 0;
          sessionReportsObj.classDurationExceeded = 0;
          sessionReportsObj.turnedUpButLeftAbruptly = 0;
          sessionReportsObj.leadNotVerifiedProperly = 0;
          sessionReportsObj.otherReasonForReschedule = 0;
          sessionReportsObj.webSiteLoadingIssue = 0;
          sessionReportsObj.videoNotLoading = 0;
          sessionReportsObj.codePlaygroundIssue = 0;
          sessionReportsObj.logInOTPError = 0;

          for (const sessionLog of get(data, 'sessionLogs')) {
            sessionReportsObj.hasRescheduled = sessionLog.hasRescheduled ? sessionReportsObj.hasRescheduled += 1 : sessionReportsObj.hasRescheduled;
            sessionReportsObj.internetIssue = sessionLog.internetIssue ? sessionReportsObj.internetIssue += 1 : sessionReportsObj.internetIssue;
            sessionReportsObj.zoomIssue = sessionLog.zoomIssue ? sessionReportsObj.zoomIssue += 1 : sessionReportsObj.zoomIssue;
            sessionReportsObj.laptopIssue = sessionLog.laptopIssue ? sessionReportsObj.laptopIssue += 1 : sessionReportsObj.laptopIssue;
            sessionReportsObj.chromeIssue = sessionLog.chromeIssue ? sessionReportsObj.chromeIssue += 1 : sessionReportsObj.chromeIssue;
            sessionReportsObj.powerCut = sessionLog.powerCut ? sessionReportsObj.powerCut += 1 : sessionReportsObj.powerCut;
            sessionReportsObj.notResponseAndDidNotTurnUp = sessionLog.notResponseAndDidNotTurnUp ? sessionReportsObj.notResponseAndDidNotTurnUp += 1 : sessionReportsObj.notResponseAndDidNotTurnUp;
            sessionReportsObj.classDurationExceeded = sessionLog.classDurationExceeded ? sessionReportsObj.classDurationExceeded += 1 : sessionReportsObj.classDurationExceeded;
            sessionReportsObj.turnedUpButLeftAbruptly = sessionLog.turnedUpButLeftAbruptly ? sessionReportsObj.turnedUpButLeftAbruptly += 1 : sessionReportsObj.turnedUpButLeftAbruptly;
            sessionReportsObj.leadNotVerifiedProperly = sessionLog.leadNotVerifiedProperly ? sessionReportsObj.leadNotVerifiedProperly += 1 : sessionReportsObj.leadNotVerifiedProperly;
            sessionReportsObj.otherReasonForReschedule = sessionLog.otherReasonForReschedule ? sessionReportsObj.otherReasonForReschedule += 1 : sessionReportsObj.otherReasonForReschedule;
            sessionReportsObj.webSiteLoadingIssue = sessionLog.webSiteLoadingIssue ? sessionReportsObj.webSiteLoadingIssue += 1 : sessionReportsObj.webSiteLoadingIssue;
            sessionReportsObj.videoNotLoading = sessionLog.videoNotLoading ? sessionReportsObj.videoNotLoading += 1 : sessionReportsObj.videoNotLoading;
            sessionReportsObj.codePlaygroundIssue = sessionLog.codePlaygroundIssue ? sessionReportsObj.codePlaygroundIssue += 1 : sessionReportsObj.codePlaygroundIssue;
            sessionReportsObj.logInOTPError = sessionLog.logInOTPError ? sessionReportsObj.logInOTPError += 1 : sessionReportsObj.logInOTPError;
          }

          for (const mmSession of get(data, 'mentorMenteeSessions')) {
            sessionReportsObj.hasRescheduled = mmSession.hasRescheduled ? sessionReportsObj.hasRescheduled += 1 : sessionReportsObj.hasRescheduled;
            sessionReportsObj.internetIssue = mmSession.internetIssue ? sessionReportsObj.internetIssue += 1 : sessionReportsObj.internetIssue;
            sessionReportsObj.zoomIssue = mmSession.zoomIssue ? sessionReportsObj.zoomIssue += 1 : sessionReportsObj.zoomIssue;
            sessionReportsObj.laptopIssue = mmSession.laptopIssue ? sessionReportsObj.laptopIssue += 1 : sessionReportsObj.laptopIssue;
            sessionReportsObj.chromeIssue = mmSession.chromeIssue ? sessionReportsObj.chromeIssue += 1 : sessionReportsObj.chromeIssue;
            sessionReportsObj.powerCut = mmSession.powerCut ? sessionReportsObj.powerCut += 1 : sessionReportsObj.powerCut;
            sessionReportsObj.notResponseAndDidNotTurnUp = mmSession.notResponseAndDidNotTurnUp ? sessionReportsObj.notResponseAndDidNotTurnUp += 1 : sessionReportsObj.notResponseAndDidNotTurnUp;
            sessionReportsObj.classDurationExceeded = mmSession.classDurationExceeded ? sessionReportsObj.classDurationExceeded += 1 : sessionReportsObj.classDurationExceeded;
            sessionReportsObj.turnedUpButLeftAbruptly = mmSession.turnedUpButLeftAbruptly ? sessionReportsObj.turnedUpButLeftAbruptly += 1 : sessionReportsObj.turnedUpButLeftAbruptly;
            sessionReportsObj.leadNotVerifiedProperly = mmSession.leadNotVerifiedProperly ? sessionReportsObj.leadNotVerifiedProperly += 1 : sessionReportsObj.leadNotVerifiedProperly;
            sessionReportsObj.otherReasonForReschedule = mmSession.otherReasonForReschedule ? sessionReportsObj.otherReasonForReschedule += 1 : sessionReportsObj.otherReasonForReschedule;
            sessionReportsObj.webSiteLoadingIssue = mmSession.webSiteLoadingIssue ? sessionReportsObj.webSiteLoadingIssue += 1 : sessionReportsObj.webSiteLoadingIssue;
            sessionReportsObj.videoNotLoading = mmSession.videoNotLoading ? sessionReportsObj.videoNotLoading += 1 : sessionReportsObj.videoNotLoading;
            sessionReportsObj.codePlaygroundIssue = mmSession.codePlaygroundIssue ? sessionReportsObj.codePlaygroundIssue += 1 : sessionReportsObj.codePlaygroundIssue;
            sessionReportsObj.logInOTPError = mmSession.logInOTPError ? sessionReportsObj.logInOTPError += 1 : sessionReportsObj.logInOTPError;
          }

          forwardCount += 1;
          totalLoopDays -= 1;
        }

        const sessionGradeReportQueryRes = await callLocalGraphqlApi(sessionGradeReportQuery(todayStartDate, country, vertical));
        const sessionGradeReportId = get(sessionGradeReportQueryRes, 'data.sessionGradeReports[0].id', '');
        if (sessionGradeReportId) {
          // update exisiting session report
          const updateSessionGradeReportRes = await callLocalGraphqlApi(updateSessionGradeReport(sessionGradeReportsObj, sessionGradeReportId));
          const sessionGradeReportUpdatedId = get(updateSessionGradeReportRes, 'data.updateSessionGradeReport.id', '');
          if (sessionGradeReportUpdatedId) {
            log(`*** SessionGradeReport updated for date : ${todayStartDate}, vertical: ${vertical} and country : ${country}`);
          }
        } else {
          const addSessionGradeReportRes = await callLocalGraphqlApi(addSessionGradeReport(sessionGradeReportsObj));
          const sessionGradeReportAddedId = get(addSessionGradeReportRes, 'data.addSessionGradeReport.id', '');
          if (sessionGradeReportAddedId) {
            log(`*** SessionGradeReport added for date : ${todayStartDate}, vertical: ${vertical} and country : ${country}`);
          }
        }

        // console.log('sessionReportsObj', sessionReportsObj);
        const sessionReportQueryRes = await callLocalGraphqlApi(sessionReportQuery(todayStartDate, country, vertical));
        // console.log('sessionReportQueryRes', sessionReportQueryRes);
        const sessionReportId = get(sessionReportQueryRes, 'data.sessionReports[0].id', '');
        if (sessionReportId) {
          // update exisiting session report
          const updateSessionReportRes = await callLocalGraphqlApi(updateSessionReport(sessionReportsObj, sessionReportId));
          const sessionReportUpdatedId = get(updateSessionReportRes, 'data.updateSessionReport.id', '');
          if (sessionReportUpdatedId) {
            log(`*** SessionReport updated for date : ${todayStartDate}, vertical: ${vertical} and country : ${country}`);
          }
        } else {
          const addSessionReportRes = await callLocalGraphqlApi(addSessionReport(sessionReportsObj));
          const sessionReportAddedId = get(addSessionReportRes, 'data.addSessionReport.id', '');
          if (sessionReportAddedId) {
            // console.log(sessionReportAddedId);
            log(`*** SessionReport added for date : ${todayStartDate}, vertical: ${vertical} and country : ${country}`);
          }
        }
        // resetting looping variable for next country report
        totalLoopDays = SESSION_REPORT_DAYS;
      }
    }
    dayCount += 1;
    /* eslint-disable no-param-reassign */
    numDaysToRunQuery -= 1;
  }
};

export default generateSessionReport;
