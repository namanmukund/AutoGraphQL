import { get } from 'lodash';
import moment from 'moment';
import {
  COUNTRIES, VERTICALS,
} from '../../constants';
import callLocalGraphqlApi from '../../src/api/callLocalGraphqlApi';
import { log } from '../log';

const coursesQuery = async () => {
  const query = `
  {
    courses(filter:{
      and:[
        {
          status: published
        }
      ]
    }) {
      id
      title
    }
  }
`;
  const res = await callLocalGraphqlApi(query, '', '');
  return get(res, 'data.courses', []);
};

const masterQuery = (todayStartDate,
  todayEndDate,
  country,
  filterQuery) => `
    query{
      registeredUsers: usersMeta(filter:{
        and:[
          {role: parent}
          {createdAt_gte:"${todayStartDate}"}
          {createdAt_lt:"${todayEndDate}"}
          ${filterQuery.source}
          ${filterQuery.user}
          {country:${country}}
          {studentProfile_some: {
            batch_some: {
              course_some:${filterQuery.courseId}
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
          {createdAt_gte:"${todayStartDate}"}
          {createdAt_lt:"${todayEndDate}"}
          ${filterQuery.source}
          ${filterQuery.user}
          {country:${country}}
          {studentProfile_some: {
            batch_some: {
              course_some:${filterQuery.courseId}
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
          {course_some:${filterQuery.courseId}}
          {
            user_some:{
              and:[
                ${filterQuery.user}
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
          {course_some:${filterQuery.courseId}}
          {
            menteeSession_some:{
              user_some:{
                and:[
                  ${filterQuery.user}
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
          {course_some:${filterQuery.courseId}}
          {
            client_some:{
              and:[
                ${filterQuery.user}
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
          {course_some:${filterQuery.courseId}}
          {
            user_some:{
              and:[
                ${filterQuery.user}
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
          {course_some:${filterQuery.courseId}}
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
          {course_some:${filterQuery.courseId}}
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
          {course_some:${filterQuery.courseId}}
        ]
      }){
        count
      }
    }
  `;
const sessionCourseReportQuery = (date, country, vertical, courseId) => `
  {
    sessionCourseReports(filter: {
      and: [
        {date: "${date}"},
        {country:${country}},
        {vertical:${vertical}}
        {course_some:{
          id:"${courseId}"}
        } 
      ]
    }){
      id
    }
  }
`;

const updateSessionCourseReport = async (input, id) => {
  const query = `
mutation($input: SessionCourseReportUpdate!){
  updateSessionCourseReport(
  input:$input
  id: "${id}"
  ){
    id
  }
}
`;
  const variables = {
    input,
  };
  const res = await callLocalGraphqlApi(query, '', variables);
  return get(res, 'data.updateSessionCourseReport.id');
};
const addSessionCourseReport = (input, courseId) => `
  mutation{
  addSessionCourseReport(
    courseConnectId: "${courseId}"
    input: {
    date: "${input.date}",
    country: ${input.country},
    vertical: ${input.vertical},
    registered: ${input.registered},
    booked: ${input.booked},
    demoCompleted: ${input.demoCompleted},
      converted: ${input.converted},
      phoneVerified: ${input.phoneVerified},
      bookedBySelf: ${input.bookedBySelf},
      bookedByAgent: ${input.bookedByAgent}
  }){
    id
  }
}
`;

const generateSessionCourseReport = async (numDaysToRunQuery) => {
  let dayCount = 0;
  const currentStartDate = new Date();
  const currentEndDate = new Date();
  currentStartDate.setHours(0, 0, 0, 0);
  currentEndDate.setHours(23, 59, 59, 999);
  const courses = await coursesQuery();
  while (numDaysToRunQuery > 0 && courses.length > 0) {
    const todayStartDate = new Date(moment(currentStartDate).subtract(dayCount, 'days').toISOString());
    const todayEndDate = new Date(moment(currentEndDate).subtract(dayCount, 'days').toISOString());
    todayStartDate.setHours(0, 0, 0, 0);
    todayEndDate.setHours(23, 59, 59, 999);

    // eslint-disable-next-line no-restricted-syntax
    for (const country of COUNTRIES) {
      // eslint-disable-next-line no-restricted-syntax
      for (const vertical of VERTICALS) {
        const sessionCourseReportObj = {};
        const filterQuery = {};

        if ((vertical === 'b2b' || vertical === 'b2b2c') && country !== 'uae' && country !== 'india') {
          // eslint-disable-next-line no-continue
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

        sessionCourseReportObj.country = country;
        sessionCourseReportObj.date = new Date(todayStartDate);
        sessionCourseReportObj.vertical = vertical;

        // eslint-disable-next-line no-restricted-syntax
        for (const course of courses) {
          filterQuery.courseId = `{id : "${course.id}"}`;
          // eslint-disable-next-line no-await-in-loop
          const queryRes = await callLocalGraphqlApi(masterQuery(todayStartDate, todayEndDate, country, filterQuery));
          const data = get(queryRes, 'data', {});
          log(`getData for date ${todayStartDate} country ${country} course ${course.title}`);
          sessionCourseReportObj.registered = data.registeredUsers.count;
          sessionCourseReportObj.booked = data.bookedSessions.count;
          sessionCourseReportObj.demoCompleted = data.completedSessions.count;
          sessionCourseReportObj.converted = data.totalConvertedUsers.count;
          sessionCourseReportObj.phoneVerified = data.verifiedUsers.count;
          sessionCourseReportObj.bookedBySelf = data.bookedSessions.count - data.bookedSessionsByAgent.count;
          sessionCourseReportObj.bookedByAgent = data.bookedSessionsByAgent.count;
          // eslint-disable-next-line no-await-in-loop
          const sessionCourseReportQueryRes = await callLocalGraphqlApi(sessionCourseReportQuery(todayStartDate, country, vertical, course.id));
          const sessionCourseReportId = get(sessionCourseReportQueryRes, 'data.sessionCourseReports[0].id', '');
          if (sessionCourseReportId) {
            // update exisiting session report
            const sessionCourseReportUpdatedId = updateSessionCourseReport(sessionCourseReportObj, sessionCourseReportId);
            if (sessionCourseReportUpdatedId) {
              log(`*** SessionCourseReport updated for date : ${todayStartDate}, vertical: ${vertical} and country : ${country}`);
            }
          } else {
            // eslint-disable-next-line no-await-in-loop
            const addSessionCourseReportRes = await callLocalGraphqlApi(addSessionCourseReport(sessionCourseReportObj, course.id));
            const sessionCourseReportAddedId = get(addSessionCourseReportRes, 'data.addSessionCourseReport.id', '');
            if (sessionCourseReportAddedId) {
              log(`*** SessionCourseReport added for date : ${todayStartDate}, vertical: ${vertical} and country : ${country}`);
            }
          }
        }
      }
    }
    dayCount += 1;
    /* eslint-disable no-param-reassign */
    numDaysToRunQuery -= 1;
  }
};

export default generateSessionCourseReport;
