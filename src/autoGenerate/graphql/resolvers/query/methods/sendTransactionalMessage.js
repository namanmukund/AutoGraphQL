import { get } from 'lodash';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import getLongDate from '../../../../../../utils/getLongDate';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const getMentorMenteeSessions = async (userId) => {
  const query = `
query{
  mentorMenteeSessions(filter:{
    and:[
      { menteeSession_some:{user_some:{id:"${userId}"}}}
      {or:[
        {topic_some:{order:1}}
        {topic_some:{order:2}}
      ]
    }  
    ]
  }, orderBy:createdAt_ASC){
    id
    topic{
      id
      title
      order
    }
    mentorSession{
      id
      user{
        id
        name
        username
        phone{
          countryCode
          number
        }
        mentorProfile{
          id
          codingLanguages
          experienceYear
          pythonCourseRating1
          pythonCourseRating2
          pythonCourseRating3
          pythonCourseRating4
          pythonCourseRating5
        }
      }
    }
    menteeSession{
      id
      bookingDate
      user{
        id
        name
        studentProfile{
          id
          parents{
            id
            user{
              id
              name
              email
              phone{
                countryCode
                number
              }
            }
          }
        }
      }
    }
  }
}
`;
  const res = await callLocalGraphqlApi(query);
  const data = get(res, 'data.mentorMenteeSessions', []);
  console.log(11111, data);
  if (!data || (data && data.length > 1)) {
    throw new Error('Invalid');
  }
  const parentInfo = get(data[0], 'menteeSession.user.studentProfile.parents[0].user');
  const mentorInfo = get(data[0], 'mentorSession.user.mentorProfile');
  const doc = {
    parentName: get(parentInfo, 'name'),
    parentEmail: get(parentInfo, 'email'),
    parentNumber: get(parentInfo, 'phone.number'),
    countryCode: get(parentInfo, 'phone.countryCode'),
    name: get(data[0], 'menteeSession.user.name'),
    // bookingDate:
    // startTime:
    codingLanguages: get(mentorInfo, 'codingLanguages'),
    experienceYear: get(mentorInfo, 'experienceYear'),
    mentorPhoneNumber: get(data[0], 'mentorSession.user.phone.number'),
    mentorCountryCode: get(data[0], 'mentorSession.user.phone.countryCode'),
  };
  console.log(1111, doc);
  return doc;
};

const getWhatsAppMessageParametersByType = async (messageType, dataObj) => {
  let parameters;
  console.log(11223);
  switch (messageType) {
    case 'sendSessionLink': {
      const data = await getMentorMenteeSessions('cka85xf0c00020vvyecpaf9mk');
      console.log(3333, data);
      const {
        parentName, name, sessionLink, bookingDate, startTime,
        experienceYear, codingLanguages, mentorRating,
      } = dataObj;
      parameters = [{
        name: 'parent_name',
        value: parentName,
      },
      {
        name: 'session_link',
        value: sessionLink,
      },
      {
        name: 'student_name',
        value: name,
      },
      {
        name: 'session_date',
        value: getLongDate(bookingDate),
      },
      {
        name: 'session_time',
        value: startTime,
      },
      {
        name: 'mentor_experience',
        value: experienceYear,
      },
      {
        name: 'coding_language',
        value: codingLanguages,
      },
      {
        name: 'mentor_rating',
        value: mentorRating,
      },
      ];
      break;
    }
    case 'didNotPickTheCall': {
      const {
        parentName,
      } = dataObj;
      parameters = [{
        name: 'parent_name',
        value: parentName,
      }];
      break;
    }
    case 'didNotTurnUpInSession': {
      const {
        parentName, name, rescheduleReason,
        countryCode, parentNumber,
      } = dataObj;
      parameters = [{
        name: 'parent_name',
        value: parentName,
      },
      {
        name: 'student_name',
        value: name,
      },
      {
        name: 'reschedule_reason',
        value: rescheduleReason,
      },
      {
        name: 'phone',
        value: `${countryCode}-${parentNumber}`,
      },
      ];
      break;
    }
    case 'sessionNotConducted': {
      const {
        parentName, name, bookingDate, startTime,
        countryCode, parentNumber,
      } = dataObj;
      parameters = [{
        name: 'parent_name',
        value: parentName,
      },
      {
        name: 'student_name',
        value: name,
      },
      {
        name: 'session_date',
        value: getLongDate(bookingDate),
      },
      {
        name: 'session_time',
        value: startTime,
      },
      {
        name: 'phone',
        value: `${countryCode}-${parentNumber}`,
      },
      ];
      break;
    }
    default:
  }
  return parameters;
};
const sendTransactionalMessage = async (root, params, context) => {
  validateAuthentication(context);

  const { userId, input } = params;
  const { messageType, medium, sessionLink } = input;
  console.log(params);

  // if (medium === 'whatsApp' || medium === 'both') {
  // send whatsapp message
  const parameters = await getWhatsAppMessageParametersByType(
    messageType,
  );
  // }

  if (medium === 'email' || medium === 'both') {
    // send email message
  }
  return {
    result: true,
  };
};

export default sendTransactionalMessage;
