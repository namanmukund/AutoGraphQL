/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
import { get } from 'lodash';
import { SESSION_REPORT_DAYS, COUNTRIES } from '../../constants';
import callLocalGraphqlApi from '../../src/api/callLocalGraphqlApi';
import { log } from '../log';

const masterQuery = (todayStartDate,
  todayEndDate,
  otherDayStartDate,
  otherDayEndDate,
  country) => `
    query{
  registeredUsers: usersMeta(filter:{
    and:[
      {role: parent}
      {createdAt_gte:"${otherDayStartDate}"}
      {createdAt_lt:"${otherDayEndDate}"}
      {source_not:school}
      {country:${country}}
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
      {source_not:school}
      {country:${country}}
    ]
  }){
    count
  }
  bookedSessions: menteeSessionsMeta(filter:{
    and:[
      {bookingDate_gte:"${todayStartDate}"}
      {bookingDate_lte:"${todayEndDate}"}
      {source_not:school}
      {country:${country}}
      {topic_some:{order:1}}
      {
        user_some:{
          and:[
            {createdAt_gte:"${otherDayStartDate}"}
            {createdAt_lt:"${otherDayEndDate}"}
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
      {source_not:school}
      {country:${country}}
      {topic_some:{order:1}}
      {
        menteeSession_some:{
          user_some:{
            and:[
              {createdAt_gte:"${otherDayStartDate}"}
              {createdAt_lt:"${otherDayEndDate}"}
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
      {source_not:school}
      {country:${country}}
      {createdAt_gt:"${todayStartDate}"}
      {createdAt_lt: "${todayEndDate}"}
      {
        client_some:{
          and:[
            {createdAt_gte:"${otherDayStartDate}"}
            {createdAt_lt:"${otherDayEndDate}"}
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
      {source_not:school}
      {country:${country}}
      {topic_some:{order:1}}
      {bookedBy: tekieTeam}
      {
        user_some:{
          and:[
            {createdAt_gte:"${otherDayStartDate}"}
            {createdAt_lt:"${otherDayEndDate}"}
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
      {source_not:school}
      {country:${country}}
      {topic_some:{order:1}}
    ]
  }){
    count
  }
  totalCompletedSessionsToday: mentorMenteeSessionsMeta(filter:{
    and:[
      {sessionStatus:completed}
      {sessionStartDate_gte:"${todayStartDate}"}
      {sessionStartDate_lt:"${todayEndDate}"}
      {source_not:school}
      {country:${country}}
      {topic_some:{order:1}}
    ]
  }){
    count
  }
  totalConvertedUsers: salesOperationsMeta(filter:{
    and:[
      {leadStatus:won}
      {source_not:school}
      {country:${country}}
      {createdAt_gt:"${todayStartDate}"}
      {createdAt_lt: "${todayEndDate}"}
    ]
  }){
    count
  }
  mentorMenteeSessions: mentorMenteeSessions(filter:{
    and:[
      {source_not:school}
      {topic_some:{order:1}}
      {sessionStartDate_gte:"${todayStartDate}"}
      {sessionStartDate_lte:"${todayEndDate}"}
      {country: ${country}}
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
      {source_not:school}
      {topic_some:{order:1}}
      {sessionStartDate_gte:"${todayStartDate}"}
      {sessionStartDate_lte:"${todayEndDate}"}
      {country: ${country}}
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

const sessionReportQuery = (date, country) => `
  {
    sessionReports(filter: {
      and: [
        {date: "${date}"},
        {country:${country}}
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
  let dayCount = 0;
  const currentStartDate = new Date();
  const currentEndDate = new Date();
  currentStartDate.setHours(0, 0, 0, 0);
  currentEndDate.setHours(23, 59, 59, 999);

  while (numDaysToRunQuery > 0) {
    // according to parameter 'numDaysToRunQuery', we add session report for that many days
    // SESSION_REPORT_DAYS gives till how many days back we have to include in our report (currently 4)
    let totalLoopDays = SESSION_REPORT_DAYS;
    const todayStartDate = new Date();
    const todayEndDate = new Date();
    todayStartDate.setDate(currentStartDate.getDate() - dayCount);
    todayEndDate.setDate(currentEndDate.getDate() - dayCount);
    todayStartDate.setHours(0, 0, 0, 0);
    todayEndDate.setHours(23, 59, 59, 999);

    // for every country in array
    /* eslint-disable no-restricted-syntax */
    for (const country of COUNTRIES) {
      let forwardCount = 0;
      const sessionReportsObj = {};
      /*
        Here we loop to populate single report for single day
      */
      while (totalLoopDays > 0) {
        const otherDayStartDate = new Date();
        const otherDayEndDate = new Date();
        otherDayStartDate.setDate(todayStartDate.getDate() - forwardCount);
        otherDayEndDate.setDate(todayEndDate.getDate() - forwardCount);
        otherDayStartDate.setHours(0, 0, 0, 0);
        otherDayEndDate.setHours(23, 59, 59, 999);
        // console.log(otherDayStartDate);
        // console.log(otherDayEndDate);
        const queryRes = await callLocalGraphqlApi(masterQuery(todayStartDate, todayEndDate, otherDayStartDate, otherDayEndDate, country));
        const data = get(queryRes, 'data', {});
        // console.log(data);
        if (forwardCount === 0) {
          // we are in today bucket
          sessionReportsObj.registeredSameDay = {};
          sessionReportsObj.registeredSameDay.registered = data.registeredUsers.count;
          sessionReportsObj.registeredSameDay.booked = data.bookedSessions.count;
          sessionReportsObj.registeredSameDay.demoCompleted = data.completedSessions.count;
          sessionReportsObj.registeredSameDay.converted = data.convertedUsersToday.count;
          sessionReportsObj.registeredSameDay.phoneVerified = data.verifiedUsers.count;
          sessionReportsObj.registeredSameDay.bookedBySelf = data.bookedSessions.count - data.bookedSessionsByAgent.count;
          sessionReportsObj.registeredSameDay.bookedByAgent = data.bookedSessionsByAgent.count;
        } else if (forwardCount === 1) {
          sessionReportsObj.registeredOneDayBefore = {};
          sessionReportsObj.registeredOneDayBefore.registered = data.registeredUsers.count;
          sessionReportsObj.registeredOneDayBefore.booked = data.bookedSessions.count;
          sessionReportsObj.registeredOneDayBefore.demoCompleted = data.completedSessions.count;
          sessionReportsObj.registeredOneDayBefore.converted = data.convertedUsersToday.count;
          sessionReportsObj.registeredOneDayBefore.phoneVerified = data.verifiedUsers.count;
          sessionReportsObj.registeredOneDayBefore.bookedBySelf = data.bookedSessions.count - data.bookedSessionsByAgent.count;
          sessionReportsObj.registeredOneDayBefore.bookedByAgent = data.bookedSessionsByAgent.count;
        } else if (forwardCount === 2) {
          sessionReportsObj.registeredTwoDaysBefore = {};
          sessionReportsObj.registeredTwoDaysBefore.registered = data.registeredUsers.count;
          sessionReportsObj.registeredTwoDaysBefore.booked = data.bookedSessions.count;
          sessionReportsObj.registeredTwoDaysBefore.demoCompleted = data.completedSessions.count;
          sessionReportsObj.registeredTwoDaysBefore.converted = data.convertedUsersToday.count;
          sessionReportsObj.registeredTwoDaysBefore.phoneVerified = data.verifiedUsers.count;
          sessionReportsObj.registeredTwoDaysBefore.bookedBySelf = data.bookedSessions.count - data.bookedSessionsByAgent.count;
          sessionReportsObj.registeredTwoDaysBefore.bookedByAgent = data.bookedSessionsByAgent.count;
        } else if (forwardCount === 3) {
          sessionReportsObj.registeredThreeDaysBefore = {};
          sessionReportsObj.registeredThreeDaysBefore.registered = data.registeredUsers.count;
          sessionReportsObj.registeredThreeDaysBefore.booked = data.bookedSessions.count;
          sessionReportsObj.registeredThreeDaysBefore.demoCompleted = data.completedSessions.count;
          sessionReportsObj.registeredThreeDaysBefore.converted = data.convertedUsersToday.count;
          sessionReportsObj.registeredThreeDaysBefore.phoneVerified = data.verifiedUsers.count;
          sessionReportsObj.registeredThreeDaysBefore.bookedBySelf = data.bookedSessions.count - data.bookedSessionsByAgent.count;
          sessionReportsObj.registeredThreeDaysBefore.bookedByAgent = data.bookedSessionsByAgent.count;
        }

        sessionReportsObj.totalBooked = data.totalBookedSessionsToday.count;
        sessionReportsObj.totalDemoCompleted = data.totalCompletedSessionsToday.count;
        sessionReportsObj.totalConvertedUsers = data.totalConvertedUsers.count;
        sessionReportsObj.country = country;
        sessionReportsObj.date = todayStartDate;

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

      // console.log(sessionReportsObj);
      const sessionReportQueryRes = await callLocalGraphqlApi(sessionReportQuery(todayStartDate, country));
      const sessionReportId = get(sessionReportQueryRes, 'data.sessionReports[0].id', '');
      if (sessionReportId) {
        // update exisiting session report
        const updateSessionReportRes = await callLocalGraphqlApi(updateSessionReport(sessionReportsObj, sessionReportId));
        const sessionReportUpdatedId = get(updateSessionReportRes, 'data.updateSessionReport.id', '');
        if (sessionReportUpdatedId) {
          log(`******* SessionReport updated for date : ${todayStartDate} and country : ${country}`);
        }
      } else {
        const addSessionReportRes = await callLocalGraphqlApi(addSessionReport(sessionReportsObj));
        const sessionReportAddedId = get(addSessionReportRes, 'data.addSessionReport.id', '');
        if (sessionReportAddedId) {
          log(`******* SessionReport added for date : ${todayStartDate} and country : ${country}`);
        }
      }
      // resetting looping variable for next country report
      totalLoopDays = SESSION_REPORT_DAYS;
    }
    dayCount += 1;
    /* eslint-disable no-param-reassign */
    numDaysToRunQuery -= 1;
  }
};

export default generateSessionReport;
