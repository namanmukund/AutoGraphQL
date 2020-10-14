import { get } from 'lodash';
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
import getFullFilePath from '../../../../../../utils/getFullFilePath';
import {
  InvalidRequestError,
  MandatorySessionLinkError,
  MessageAlreadySendError,
} from '../../../../../../constants/errors/input';
import sendWhatsAppTemplateMessage from '../../../../utils/sendWhatsAppTemplateMessage';
import transactionalMessageBody from '../../../../../../constants/transactionalMessageBody';

const sendTransactionalEmail = async (templateObject, emailBody) => {
  const templateFileName = get(emailBody, 'emailTemplate');
  const footer = await parsedHtmlFromTemplateFileAndObject('footer', templateObject);
  const html = await parsedHtmlFromTemplateFileAndObject(templateFileName, { ...templateObject, footer });

  const emailTo = [transactionalMessageBody.testEmail];
  // const emailTo = [templateObject.dataObj];
  const ccEmail = [''];

  const bccEmail = [''];
  const subject = get(emailBody, 'subject');
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
    return Number((ratingNum / ratingDen).toFixed(2));
  }
  return '';
};
const getCorrectCodingLanguageTitle = (codingLanguage) => {
  switch (codingLanguage) {
    case 'Cplusplus':
      return 'C++';
    case 'Csharp':
      return 'C#';
    default:
      return codingLanguage || '';
  }
};

const getMentorCodingLanguages = (codingLanguages) => {
  let codingLanguageStr = '';
  if (codingLanguages && codingLanguages.length) {
    codingLanguages.forEach((language, index) => {
      if (index < codingLanguages.length - 1) {
        codingLanguageStr += `${getCorrectCodingLanguageTitle(language.value)}, `;
      } else {
        codingLanguageStr += `${getCorrectCodingLanguageTitle(language.value)}`;
      }
    });
  }
  return codingLanguageStr;
};

const getSessionRescheduledReasons = (reasons) => {
  if (!reasons) return '';
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
          return 'Your child could not attend the session';
        case 'turnedUpButLeftAbruptly':
          return 'Your child attended the session but could not complete it';
        default:
          return 'NA';
      }
    }
  }
  return '';
};

const getMentorMenteeSessions = async (userId, messageType, sessionLink) => {
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
          codingLanguages{value}
          experienceYear
          sessionLink
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
  const mentorProfileFile = get(data[0], 'mentorSession.user.profilePic.uri', '');
  const topicTitle = get(data[0], 'topic.title', '');
  const mentorProfilePic = mentorProfileFile ? getFullFilePath(mentorProfileFile) : getFullFilePath('python/email/mentor1.png');

  // validate before sending the message
  if (!data || (data && data.length > 1)) {
    throw new InvalidRequestError();
  }
  // if message is already  send then avoid sending that again
  const {
    sendSessionLink,
    didNotPickTheCall,
    sessionNotConducted,
    didNotTurnUpInSession,
  } = data[0];

  switch (messageType) {
    case 'sendSessionLink': {
      if (sendSessionLink) {
        throw new MessageAlreadySendError();
      }
      break;
    }
    case 'didNotPickTheCall': {
      if (didNotPickTheCall) {
        throw new MessageAlreadySendError();
      }
      // temporary
      throw new InvalidRequestError();
    }
    case 'sessionNotConducted': {
      if (sessionNotConducted) {
        throw new MessageAlreadySendError();
      }
      break;
    }
    case 'didNotTurnUpInSession': {
      if (didNotTurnUpInSession) {
        throw new MessageAlreadySendError();
      }
      // temporary
      throw new InvalidRequestError();
    }

    default:
  }

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
      bookingDate,
      startTime,
      endTime,
      topicTitle,
      codingLanguages: getMentorCodingLanguages(get(mentorInfo, 'codingLanguages')) || 'Python',
      experienceYear: get(mentorInfo, 'experienceYear') || 3,
      sessionLink: get(mentorInfo, 'sessionLink') || sessionLink,
      mentorPhoneNumber: `${get(data[0], 'mentorSession.user.phone.countryCode')}-${get(data[0], 'mentorSession.user.phone.number')}`,
      mentorName: get(data[0], 'mentorSession.user.name'),
      mentorCountryCode: get(data[0], 'mentorSession.user.phone.countryCode'),
      mentorProfilePic,
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
  const dataObj = await getMentorMenteeSessions(userId, messageType, sessionLink);

  let parameters;
  switch (messageType) {
    case 'sendSessionLink': {
      if (!dataObj.sessionLink || !sessionLink) {
        throw new MandatorySessionLinkError();
      }
      const {
        parentName, name, bookingDate, startTime, mentorPhoneNumber,
        experienceYear, codingLanguages, mentorRating, mentorName,
      } = dataObj;
      parameters = [{
        name: 'parent_name',
        value: parentName,
      },
      {
        name: 'session_link',
        value: dataObj.sessionLink || sessionLink,
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
        name: 'mentor_name',
        value: mentorName,
      },
      {
        name: 'mentor_rating',
        value: mentorRating,
      },
      {
        name: 'mentor_number',
        value: mentorPhoneNumber,
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

  dataObj.bookingDateLong = getLongDate(dataObj.bookingDate);
  dataObj.bookingDate = moment(dataObj.bookingDate).format('DD-MM-YYYY');
  if (!dataObj.sessionLink) {
    dataObj.sessionLink = sessionLink;
  }
  // const whatsAppPhoneNumber = dataObj.countryCode.split('+')[1] + dataObj.parentNumber;
  const whatsAppPhoneNumber = transactionalMessageBody.testWhatsAppNumber;

  const { whatsAppTemplate } = transactionalMessageBody[messageType];

  switch (medium) {
    case 'all': {
      // send email
      await sendTransactionalEmail(
        dataObj,
        transactionalMessageBody[messageType],
      );
      // send whatsApp
      await sendWhatsAppTemplateMessage(
        whatsAppPhoneNumber,
        whatsAppTemplate,
        dataObj.parentName,
        parameters,
      );
      break;
    }
    case 'whatsApp': {
      // send whatsApp
      await sendWhatsAppTemplateMessage(
        whatsAppPhoneNumber,
        whatsAppTemplate,
        dataObj.parentName,
        parameters,
      );
      break;
    }
    case 'email': {
      // send email
      await sendTransactionalEmail(dataObj, transactionalMessageBody[messageType]);
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
