import { get, startCase } from 'lodash';
import moment from 'moment';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import getLongDate from '../../../../../../utils/getLongDate';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import getSlotTimesInString from '../../../../../../utils/getSlotTimesInString';
import getSelectedSlotsStringArray from '../../../postHookFunctions/utils/getSelectedSlotsStringArray';
import getSlotLabel from '../../../../../../utils/getSlotLabel';
import parsedHtmlFromTemplateFileAndObject from '../../../../../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import getEmailObject from '../../../../../../services/email/utils/getEmailObject';
import sendEmail from '../../../../../../services/email/utils/sendEmail';

const sendTransactionalEmail = async (templateObject, emailBody) => {
  const templateFileName = get(emailBody, 'template');
  // console.log(templateObject)
  const html = await parsedHtmlFromTemplateFileAndObject(templateFileName, templateObject);
  // console.log(html)
  // emailto should be in array. Can send the mail to mutiple people
  const emailTo = ['sanatankc@gmail.com', 'namanmukund@gmail.com'];
  // ccemail should be in array. Can send the mail to mutiple people
  const ccEmail = [''];
  // bccemail should be in array. Can send the mail to mutiple people
  const bccEmail = [''];
  const subject = get(emailBody, 'subject')
  /* if html is empty then in the body text will be appear. Html is having higher
    precedence over text */
  const emailMsgObject = getEmailObject(emailTo, ccEmail, bccEmail, subject, '', html, 'hello@tekie.in');
  sendEmail(emailMsgObject);
};



const calculateMentorRating = (mentorInfo) => {
  let ratingNum = 0;
  let ratingDen = 0;
  Object.keys(mentorInfo).forEach((key) => {
    if (key.includes('pythonCourseRating') && mentorInfo[key] > 0) {
      const ratingValue = key.split('pythonCourseRating')[1];
      ratingNum += ratingValue * mentorInfo[key];
      ratingDen += mentorInfo[key];
    }
  });
  if (ratingNum > 0 && ratingDen > 0) {
    return (ratingNum / ratingDen).toFixed(2);
  }
  return '';
};

const getMentorCodingLanguages = (codingLanguages) => {
  let codingLanguageStr = '';
  if (codingLanguages && codingLanguages.length) {
    codingLanguages.forEach((language, index) => {
      if (index < codingLanguages.length - 1) {
        codingLanguageStr += `${startCase(language)}, `;
      } else {
        codingLanguageStr += `${startCase(language)}`;
      }
    });
  }
  return codingLanguageStr;
};

const getSessionRescheduledReasons = (reasons) => {
  const reasonsArray = Object.keys(reasons);
  // eslint-disable-next-line no-restricted-syntax
  for (const reason of reasonsArray) {
    if (reasons[reason]) {
      switch (reason) {
        case 'internetIssue':
          return 'Internet connectivity issue';
        case 'zoomIssue':
          return 'Zoom related issue';
        case 'laptopIssue':
          return 'Laptop related issue';
        case 'chromeIssue':
          return 'Chrome related issue';
        case 'powerCut':
          return 'Power cut';
        case 'notResponseAndDidNotTurnUp':
          return 'Kid did not turn up in session';
        case 'turnedUpButLeftAbruptly':
          return 'Turned up but abruptly left the session';
        default:
          return 'NA';
      }
    }
  }
  return '';
};

const getMentorMenteeSessions = async (userId, messageType) => {
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
    sendSessionLink
    didNotPickTheCall
    sessionNotConducted
    didNotTurnUpInSession
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
        profilePic{
          id
          uri
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
      ${getSlotTimesInString()}
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
    salesOperation{
      internetIssue
      zoomIssue
      laptopIssue
      chromeIssue
      powerCut
      notResponseAndDidNotTurnUp
      turnedUpButLeftAbruptly
    }
  }
}
`;
  const res = await callLocalGraphqlApi(query);
  const data = get(res, 'data.mentorMenteeSessions', []);
  const parentInfo = get(data[0], 'menteeSession.user.studentProfile.parents[0].user');
  const mentorInfo = get(data[0], 'mentorSession.user.mentorProfile');
  const menteeSession = get(data[0], 'menteeSession');
  const topicTitle = get(data[0], 'topic.title', '')

  // validate before sending the message
  if (!data || (data && data.length > 1)) {
    throw new Error('Invalid');
  }
  // if message is already  send then avoid sending that  again
  const {
    sendSessionLink,
    didNotPickTheCall,
    sessionNotConducted,
    didNotTurnUpInSession,
  } = data[0];

  // switch (messageType) {
  //   case 'sendSessionLink': {
  //     if (sendSessionLink) {
  //       throw new Error('Already sent');
  //     }
  //     break;
  //   }
  //   case 'didNotPickTheCall': {
  //     if (didNotPickTheCall) {
  //       throw new Error('Already sent');
  //     }
  //     break;
  //   }
  //   case 'sessionNotConducted': {
  //     if (sessionNotConducted) {
  //       throw new Error('Already sent');
  //     }
  //     break;
  //   }
  //   case 'didNotTurnUpInSession': {
  //     if (didNotTurnUpInSession) {
  //       throw new Error('Already sent');
  //     }
  //     break;
  //   }

  //   default:
  // }

  if (menteeSession && menteeSession.id && parentInfo.id) {
    const { bookingDate, ...slots } = menteeSession;
    const slotTimeStringArray = getSelectedSlotsStringArray(slots);
    const slotNumber = slotTimeStringArray[0].split('slot')[1];
    const { startTime, endTime } = getSlotLabel(slotNumber);

    
    return {
      mentorMenteeSessionId: get(data[0], 'id'),
      parentName: get(parentInfo, 'name'),
      parentEmail: get(parentInfo, 'email'),
      parentNumber: get(parentInfo, 'phone.number'),
      countryCode: get(parentInfo, 'phone.countryCode'),
      name: get(menteeSession, 'user.name'),
      bookingDate: bookingDate,
      startTime,
      endTime,
      topicTitle,
      codingLanguages: getMentorCodingLanguages(get(mentorInfo, 'codingLanguages')) || 'Python',
      experienceYear: get(mentorInfo, 'experienceYear') || 3,
      mentorPhoneNumber: get(data[0], 'mentorSession.user.phone.number'),
      mentorName: get(data[0], 'mentorSession.user.name'),
      mentorCountryCode: get(data[0], 'mentorSession.user.phone.countryCode'),
      mentorRating: calculateMentorRating(mentorInfo) || 5,
      rescheduleReason: getSessionRescheduledReasons(get(data[0], 'salesOperation')) || 'NA',
    };
  }
  return '';
};

const updateMentorMenteeSessionWithMessageType = async (id, messageType) => {
  const query = `
  mutation($input: MentorMenteeSessionUpdate){
    updateMentorMenteeSession(id:"${id}", input:$input){
      id
    }
  }
`;
  const variables = {
    input: {
      [messageType]: true,
    },
  };
  const res = await callLocalGraphqlApi(query, '', variables);
  return get(res, 'data.updateMentorMenteeSession.id');
};

const sendTransactionalMessage = async (root, params, context) => {
  validateAuthentication(context);
  const { userId, input } = params;
  const { messageType, medium, sessionLink } = input;
  const dataObj = await getMentorMenteeSessions(userId, messageType);

  let parameters;
  switch (messageType) {
    case 'sendSessionLink': {
      const {
        parentName, name, bookingDate, startTime,
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
    case 'sessionNotConducted': {
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
    case 'didNotTurnUpInSession': {
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

  
  dataObj.bookingDateLong = getLongDate(dataObj.bookingDate)
  dataObj.bookingDate = moment(dataObj.bookingDate).format('DD-MM-YYYY')
  dataObj.sessionLink = sessionLink

  const mailBody = {
    sendSessionLink: {
      template: 'sessionLink',
      subject: 'Tekie - session link for free trial class'
    },
  }

  switch (medium) {
    case 'all': {
      // send whatsApp
      // send email
      sendTransactionalEmail(dataObj, mailBody[messageType])
      break;
    }
    case 'whatsApp': {
      // send whatsApp
      break;
    }
    case 'email': {
      // send email
      break;
    }

    default:
  }
  await updateMentorMenteeSessionWithMessageType(dataObj.mentorMenteeSessionId, messageType);
  return {
    result: true,
  };
};

export default sendTransactionalMessage;
