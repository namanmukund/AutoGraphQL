import { get } from 'lodash';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import getSlotTimesInString from '../../../../../../utils/getSlotTimesInString';
import getSelectedSlotsStringArray from '../../../postHookFunctions/utils/getSelectedSlotsStringArray';
import getFullFilePath from '../../../../../../utils/getFullFilePath';
import {
  InvalidRequestError,
  MandatorySessionLinkError,
  MessageAlreadySendError,
} from '../../../../../../constants/errors/input';
import sendWhatsAppTemplateMessage from '../../../../utils/sendWhatsAppTemplateMessage';
import transactionalMessageBody from '../../../../../../constants/transactionalMessageBody';
import sendTransactionalEmail from '../../utils/sendTransactionalEmail';
import calculateMentorRating from '../../utils/calculateMentorRating';
import getMentorCodingLanguages from '../../utils/getMentorCodingLanguages';
import getIntlDateTime from '../../../../../../utils/timeZoneDiff';

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
            email
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
              meetingId
              meetingPassword
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
            timezone
            country
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
  const mentorProfilePic = mentorProfileFile ? getFullFilePath(mentorProfileFile) : 'https://tekie-backend.s3.amazonaws.com/python/email/mentorDrop.png';
  // validate before sending the message

  if (!mentorInfo) {
    throw new MessageAlreadySendError();
  }
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
    const { startTime, endTime, date } = getIntlDateTime(bookingDate, slotNumber, get(menteeSession, 'user.timezone') || 'Asia/Kolkata');
    return {
      mentorMenteeSessionId: get(data[0], 'id'),
      parentName: get(parentInfo, 'name'),
      parentEmail: get(parentInfo, 'email'),
      parentNumber: get(parentInfo, 'phone.number'),
      countryCode: get(parentInfo, 'phone.countryCode'),
      name: get(menteeSession, 'user.name'),
      timezone: get(menteeSession, 'user.timezone') || 'Asia/Kolkata',
      country: get(menteeSession, 'user.country') || 'india',
      bookingDate: date,
      startTime,
      endTime,
      topicTitle,
      codingLanguages: getMentorCodingLanguages(get(mentorInfo, 'codingLanguages')) || 'Python',
      experienceYear: get(mentorInfo, 'experienceYear') || 3,
      sessionLink: get(mentorInfo, 'sessionLink') || sessionLink,
      mentorPhoneNumber: `${get(data[0], 'mentorSession.user.phone.countryCode')}-${get(data[0], 'mentorSession.user.phone.number')}`,
      mentorName: get(data[0], 'mentorSession.user.name'),
      mentorEmail: get(data[0], 'mentorSession.user.email'),
      mentorCountryCode: get(data[0], 'mentorSession.user.phone.countryCode'),
      mentorProfilePic,
      mentorRating: calculateMentorRating(mentorInfo) || 5,
      rescheduleReason: getSessionRescheduledReasons(get(data[0], 'salesOperation')) || 'NA',
      meetingId: get(mentorInfo, 'meetingId'),
      meetingPassword: get(mentorInfo, 'meetingPassword'),
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
  // if staging just don't send the message and behave similarly

  if (process.env.NODE_ENV !== 'production') {
    await updateMentorMenteeSessionWithMessageType(dataObj.mentorMenteeSessionId, messageType);
    return {
      result: true,
    };
  }

  let parameters;
  switch (messageType) {
    case 'sendSessionLink': {
      if (!dataObj.sessionLink || !sessionLink) {
        throw new MandatorySessionLinkError();
      }
      const {
        parentName, name, bookingDate, startTime, mentorPhoneNumber,
        experienceYear, codingLanguages, mentorRating, mentorName,
        meetingId, meetingPassword,
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
        name: 'meeting_id',
        value: meetingId || '-',
      },
      {
        name: 'meeting_password',
        value: meetingPassword || '-',
      },
      {
        name: 'session_date',
        value: bookingDate,
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
        value: bookingDate,
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

  dataObj.bookingDateLong = dataObj.bookingDate;
  if (!dataObj.sessionLink) {
    dataObj.sessionLink = sessionLink;
  }
  const whatsAppPhoneNumber = dataObj.countryCode.split('+')[1] + dataObj.parentNumber;
  // const whatsAppPhoneNumber = transactionalMessageBody.testWhatsAppNumber;
  let whatsAppTemplate = '';
  if (dataObj.country) {
    if (dataObj.country === 'india') {
      whatsAppTemplate = transactionalMessageBody[messageType].whatsAppTemplate;
    } else if (transactionalMessageBody[messageType].whatsAppTemplateInternational) {
      whatsAppTemplate = transactionalMessageBody[messageType].whatsAppTemplateInternational;
    } else {
      whatsAppTemplate = transactionalMessageBody[messageType].whatsAppTemplate;
    }
  } else {
    whatsAppTemplate = transactionalMessageBody[messageType].whatsAppTemplate;
  }

  switch (medium) {
    case 'all': {
      // send email
      await sendTransactionalEmail(
        dataObj,
        transactionalMessageBody[messageType],
        dataObj.country,
      );
      if ((!country || country === 'india') && messageType === 'sendSessionLink') {
        // send whatsApp
        await sendWhatsAppTemplateMessage(
          whatsAppPhoneNumber,
          whatsAppTemplate,
          dataObj.parentName,
          parameters,
        );
      }
      break;
    }
    case 'whatsApp': {
      // send whatsApp
      if ((!country || country === 'india') && messageType === 'sendSessionLink') {
        await sendWhatsAppTemplateMessage(
          whatsAppPhoneNumber,
          whatsAppTemplate,
          dataObj.parentName,
          parameters,
        );
      }
      break;
    }
    case 'email': {
      // send email
      await sendTransactionalEmail(
        dataObj,
        transactionalMessageBody[messageType],
        dataObj.country,
      );
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
