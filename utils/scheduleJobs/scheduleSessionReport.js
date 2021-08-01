/* eslint-disable no-console */
import { get } from 'lodash';
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