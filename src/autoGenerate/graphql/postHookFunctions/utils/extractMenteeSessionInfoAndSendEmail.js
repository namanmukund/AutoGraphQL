import { get, startCase, toLower } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import parsedHtmlFromTemplateFileAndObject
  from '../../../../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import getEmailObject from '../../../../../services/email/utils/getEmailObject';
import sendEmail from '../../../../../services/email/utils/sendEmail';
import getFormatedDate from '../../../../../utils/getFormatedDate';
import getSlotLabel from '../../../../../utils/getSlotLabel';
import sendWhatsAppTemplateMessage from '../../../utils/sendWhatsAppTemplateMessage';
import getLongDate from '../../../../../utils/getLongDate';

const menteeInfoQuery = (userId) => `
  query{
    user(id:"${userId}"){
      id
      name
        studentProfile{
        id
        grade
        parents{
          id
          user{
            id
            name
            email
            phone{
              number
              countryCode
            }
          }
        }
      }
    }
  }
`;
const topicInfoQuery = (topicId) => `
  query{
    topic(id:"${topicId}"){
      id
      order
      title
      thumbnailSmall {
        uri
      }
    }
  }
`;

const sendBookedSessionEmailToTekie = (subject, menteeObj) => {
  const templateFileName = 'menteeSessionBookingEmailTemplate';
  const templateString = parsedHtmlFromTemplateFileAndObject(templateFileName, menteeObj);
  templateString.then((html) => {
    const emailTo = [
      'shantanu.najhawan@tekie.in',
      'anand.verma@tekie.in',
      'shravastivaidya@gmail.com',
      '19j.agarwal99@gmail.com',
      'jayasivakami2001@gmail.com',
      'dubeyishan17@gmail.com',
      'veera.karan@gmail.com',
    ];
    const ccEmail = [''];
    const bccEmail = [''];
    const text = '';
    /* if html is empty then in the body text will be appear. Html is having higher
     precedence over text */
    const emailMsgObject = getEmailObject(
      emailTo,
      ccEmail,
      bccEmail,
      subject,
      text,
      html,
      'hello@tekie.in',
    );
    sendEmail(emailMsgObject);
  });
};

const sendBookedSessionEmailToParent = (subject, menteeObj, action) => {
  let templateFileName = 'bookedSessionEmailTemplate';
  if (action === 'delete') {
    templateFileName = 'canceledSessionEmailTemplate';
  }
  // eslint-disable-next-line no-param-reassign
  menteeObj.action = action;
  const templateString = parsedHtmlFromTemplateFileAndObject(templateFileName, menteeObj);
  templateString.then((html) => {
    const emailTo = [
      menteeObj.parentEmail,
    ];
    const ccEmail = [''];
    const bccEmail = [''];
    const text = '';
    /* if html is empty then in the body text will be appear. Html is having higher
     precedence over text */
    const emailMsgObject = getEmailObject(
      emailTo,
      ccEmail,
      bccEmail,
      subject,
      text,
      html,
      'hello@tekie.in',
    );
    sendEmail(emailMsgObject);
  });
};

const extractMenteeSessionInfoAndSendEmail = async (
  action,
  input,
  bookingDate,
  slotTimeStringArray,
  prevBookingDate,
  prevSlotTimeStringArray,
) => {
  const slotNumber = slotTimeStringArray[0].split('slot')[1];
  const { startTime, endTime } = getSlotLabel(slotNumber);

  const { user: { typeId: userId }, topic: { typeId: topicId } } = input;
  const userInfo = await callLocalGraphqlApi(menteeInfoQuery(userId));
  const menteeInfo = get(userInfo, 'data.user');
  const parentInfo = get(menteeInfo, 'studentProfile.parents[0].user');

  const menteeObj = {
    date: getFormatedDate(bookingDate),
    startTime,
    endTime,
    name: startCase(toLower(get(menteeInfo, 'name') || '')),
    grade: get(menteeInfo, 'studentProfile.grade') || '',
    parentName: startCase(toLower(get(parentInfo, 'name') || '')),
    parentEmail: get(parentInfo, 'email') || '',
    parentNumber: get(parentInfo, 'phone.number') || '',
    countryCode: get(parentInfo, 'phone.countryCode') || '',
  };
  const topicInfo = await callLocalGraphqlApi(topicInfoQuery(topicId));
  menteeObj.topicTitle = get(topicInfo, 'data.topic.title');
  const topicThumbnail = get(topicInfo, 'data.topic.thumbnailSmall.uri');
  if (topicThumbnail) {
    menteeObj.topicThumbnail = `${process.env.FILE_BASE_URL}/${topicThumbnail}`;
  }

  let subject = '';
  menteeObj.prevBookingDate = '';
  menteeObj.previousStartTime = '';

  switch (action) {
    case 'add': {
      subject = `Session Booked by ${menteeObj.name}`;
      break;
    }
    case 'update': {
      menteeObj.prevBookingDate = getFormatedDate(prevBookingDate);
      const previousSlotNumber = prevSlotTimeStringArray[0].split('slot')[1];
      const { startTime: previousStartTime, endTime: previousEndTime } = getSlotLabel(previousSlotNumber);
      menteeObj.previousStartTime = previousStartTime;
      menteeObj.previousEndTime = previousEndTime;
      subject = `Session Updated by ${menteeObj.name}`;
      break;
    }
    case 'delete': {
      subject = `Session Deleted by ${menteeObj.name}`;
      break;
    }
    default:
  }
  // send email
  if (process.env.NODE_ENV === 'production') {
    sendBookedSessionEmailToTekie(subject, menteeObj, action);
    sendBookedSessionEmailToParent(subject, menteeObj, action);
    if (action === 'add' && get(topicInfo, 'data.topic.order') === 1) {
      // send whatsapp template message
      const {
        parentName, parentNumber, countryCode, name,
      } = menteeObj;
      const parameters = [{
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
      const phone = countryCode.split('+')[1] + parentNumber;
      // const phone = 919654347463;
      sendWhatsAppTemplateMessage(
        phone,
        'oct5_trial_booked_confirmation',
        parentName,
        parameters,
      );
    }
  }
};

export default extractMenteeSessionInfoAndSendEmail;
