/* eslint-disable no-console */
import { get, identity } from 'lodash';
import { SESSION_REPORT_DAYS } from '../../constants';
import callLocalGraphqlApi from '../../src/api/callLocalGraphqlApi';

const masterQuery = (todayStartDate,
  todayEndDate,
  otherDayStartDate,
  otherDayEndDate,
  country,
) => `
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
    verifiedUsersWithDetails: usersMeta(filter:{
    and:[
      {role: parent}
      {phoneVerified:true}
      {createdAt_gte:"${otherDayStartDate}"}
      {createdAt_lt:"${otherDayEndDate}"}
      {source_not:school}
      {country:${country}}
      {name_exists: true}
      {email_exists: true}
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
  totalConvertedUsersToday: salesOperationsMeta(filter:{
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
    registeredToday: {
      registered: ${input.registeredToday.registered},
    	bookedToday: ${input.registeredToday.bookedToday},
    	demoCompletedToday: ${input.registeredToday.demoCompletedToday},
    	converted: ${input.registeredToday.converted}
    }
    registeredOneDayBefore: {
      registered: ${input.registeredOneDayBefore.registered},
    	bookedToday: ${input.registeredOneDayBefore.bookedToday},
    	demoCompletedToday: ${input.registeredOneDayBefore.demoCompletedToday},
    	converted: ${input.registeredOneDayBefore.converted}
    }
    registeredTwoDaysBefore: {
      registered: ${input.registeredTwoDaysBefore.registered},
    	bookedToday: ${input.registeredTwoDaysBefore.bookedToday},
    	demoCompletedToday: ${input.registeredTwoDaysBefore.demoCompletedToday},
    	converted: ${input.registeredTwoDaysBefore.converted}
    }
    registeredThreeDaysBefore: {
      registered: ${input.registeredThreeDaysBefore.registered},
    	bookedToday: ${input.registeredThreeDaysBefore.bookedToday},
    	demoCompletedToday: ${input.registeredThreeDaysBefore.demoCompletedToday},
    	converted: ${input.registeredThreeDaysBefore.converted}
    }
    totalBookedToday: ${input.totalBookedToday},
    totalDemoCompleteToday: ${input.totalDemoCompleteToday},
    totalConvertedUsersToday: ${input.totalConvertedUsersToday}
  }){
    id
  }
}
`;

const updateSessionReport = (input, id) => `
  mutation{
  updateSessionReport(id: "${id}", input: {
    date: "${input.date}",
    country: ${input.country},
    registeredToday: {
      registered: ${input.registeredToday.registered},
    	bookedToday: ${input.registeredToday.bookedToday},
    	demoCompletedToday: ${input.registeredToday.demoCompletedToday},
    	converted: ${input.registeredToday.converted}
    }
    registeredOneDayBefore: {
      registered: ${input.registeredOneDayBefore.registered},
    	bookedToday: ${input.registeredOneDayBefore.bookedToday},
    	demoCompletedToday: ${input.registeredOneDayBefore.demoCompletedToday},
    	converted: ${input.registeredOneDayBefore.converted}
    }
    registeredTwoDaysBefore: {
      registered: ${input.registeredTwoDaysBefore.registered},
    	bookedToday: ${input.registeredTwoDaysBefore.bookedToday},
    	demoCompletedToday: ${input.registeredTwoDaysBefore.demoCompletedToday},
    	converted: ${input.registeredTwoDaysBefore.converted}
    }
    registeredThreeDaysBefore: {
      registered: ${input.registeredThreeDaysBefore.registered},
    	bookedToday: ${input.registeredThreeDaysBefore.bookedToday},
    	demoCompletedToday: ${input.registeredThreeDaysBefore.demoCompletedToday},
    	converted: ${input.registeredThreeDaysBefore.converted}
    }
    totalBookedToday: ${input.totalBookedToday},
    totalDemoCompleteToday: ${input.totalDemoCompleteToday},
    totalConvertedUsersToday: ${input.totalConvertedUsersToday}
  }){
    id
  }
}
`;

const generateSessionReport = async (numDaysToRunQuery) => {
  // setting current date (start and end times)
  let dayCount = 0;
  let currentStartDate = new Date();
  let currentEndDate = new Date();
  currentStartDate.setHours(0, 0, 0, 0);
  currentEndDate.setHours(23, 59, 59, 999);

  while (numDaysToRunQuery > 0) {
    // according to parameter 'numDaysToRunQuery', we add session report for that many days
    // SESSION_REPORT_DAYS gives till how many days back we have to include in our report (currently 4)
    let totalLoopDays = SESSION_REPORT_DAYS;
    let todayStartDate = new Date();
    let todayEndDate = new Date();
    todayStartDate.setDate(currentStartDate.getDate() - dayCount);
    todayEndDate.setDate(currentEndDate.getDate() - dayCount);
    const country = 'india';
    todayStartDate.setHours(0, 0, 0, 0);
    todayEndDate.setHours(23, 59, 59, 999);

    let forwardCount = 0;
    const sessionReportsObj = {};
    while (totalLoopDays > 0) {

      let otherDayStartDate = new Date();
      let otherDayEndDate = new Date();
      otherDayStartDate.setDate(todayStartDate.getDate() - forwardCount);
      otherDayEndDate.setDate(todayEndDate.getDate() - forwardCount);
      otherDayStartDate.setHours(0, 0, 0, 0);
      otherDayEndDate.setHours(23, 59, 59, 999);
      console.log(otherDayStartDate);
      console.log(otherDayEndDate);
      const queryRes = await callLocalGraphqlApi(masterQuery(todayStartDate, todayEndDate, otherDayStartDate, otherDayEndDate, country));
      const data = get(queryRes, 'data', {});
      // console.log(data);

      if (forwardCount == 0) {
        // we are in today bucket
        sessionReportsObj.registeredToday = {};
        sessionReportsObj.registeredToday.registered = data.registeredUsers.count;
        sessionReportsObj.registeredToday.bookedToday = data.bookedSessions.count;
        sessionReportsObj.registeredToday.demoCompletedToday = data.completedSessions.count;
        sessionReportsObj.registeredToday.converted = data.convertedUsersToday.count;
      } else if (forwardCount == 1) {
        sessionReportsObj.registeredOneDayBefore = {};
        sessionReportsObj.registeredOneDayBefore.registered = data.registeredUsers.count;
        sessionReportsObj.registeredOneDayBefore.bookedToday = data.bookedSessions.count;
        sessionReportsObj.registeredOneDayBefore.demoCompletedToday = data.completedSessions.count;
        sessionReportsObj.registeredOneDayBefore.converted = data.convertedUsersToday.count;
      } else if (forwardCount == 2) {
        sessionReportsObj.registeredTwoDaysBefore = {};
        sessionReportsObj.registeredTwoDaysBefore.registered = data.registeredUsers.count;
        sessionReportsObj.registeredTwoDaysBefore.bookedToday = data.bookedSessions.count;
        sessionReportsObj.registeredTwoDaysBefore.demoCompletedToday = data.completedSessions.count;
        sessionReportsObj.registeredTwoDaysBefore.converted = data.convertedUsersToday.count;
      } else if (forwardCount == 3) {
        sessionReportsObj.registeredThreeDaysBefore = {};
        sessionReportsObj.registeredThreeDaysBefore.registered = data.registeredUsers.count;
        sessionReportsObj.registeredThreeDaysBefore.bookedToday = data.bookedSessions.count;
        sessionReportsObj.registeredThreeDaysBefore.demoCompletedToday = data.completedSessions.count;
        sessionReportsObj.registeredThreeDaysBefore.converted = data.convertedUsersToday.count;
      }

      sessionReportsObj.totalBookedToday = data.totalBookedSessionsToday.count;
      sessionReportsObj.totalDemoCompleteToday = data.totalCompletedSessionsToday.count;
      sessionReportsObj.totalConvertedUsersToday = data.totalConvertedUsersToday.count;
      sessionReportsObj.country = country;
      sessionReportsObj.date = todayStartDate;

      forwardCount += 1;
      totalLoopDays -= 1;
    }

    console.log(sessionReportsObj);
    const sessionReportQueryRes = await callLocalGraphqlApi(sessionReportQuery(todayStartDate, country));
    const sessionReportId = get(sessionReportQueryRes, 'data.sessionReports[0].id', '');
    if (sessionReportId) {
      // update exisiting session report
      console.log('have to update');
      const updateSessionReportRes = await callLocalGraphqlApi(updateSessionReport(sessionReportsObj, sessionReportId));
      console.log(updateSessionReportRes);
      const sessionReportUpdated = get(updateSessionReportRes, 'data.updateSessionReport', {});
      console.log(sessionReportUpdated);
    } else {
      const addSessionReportRes = await callLocalGraphqlApi(addSessionReport(sessionReportsObj));
      console.log(addSessionReportRes);
      const sessionReportAdded = get(addSessionReportRes, 'data.addSessionReport', {});
      console.log(sessionReportAdded);
      // }

    }
    dayCount += 1;
    numDaysToRunQuery -= 1;
  }

}

export default generateSessionReport;
