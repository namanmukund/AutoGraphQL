import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

// query to get mentorMenteeSession and session status
const mentorMenteeSessionQuery = (userId, topicId) => `
  query{
    mentorMenteeSessions(filter:{
      and:[
        {
          menteeSession_some: {
            user_some:{
              id: "${userId}"
            }
          }
        },
        {
          topic_some:{
            id:"${topicId}"
          }
        }
      ]
    }){
      id
      sessionStatus
    }
  }
  `;

// quey to get mentorMenteeSession for related topic and user
const getMentorMenteeSessionForValidation = (userId, topicId) => callLocalGraphqlApi(mentorMenteeSessionQuery(userId, topicId));

export default getMentorMenteeSessionForValidation;
