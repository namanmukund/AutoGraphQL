import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import parsedHtmlFromTemplateFileAndObject
  from '../../../../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import getEmailObject from '../../../../../services/email/utils/getEmailObject';
import sendEmail from '../../../../../services/email/utils/sendEmail';

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
      title
    }
  }
`;

const getSlotLabel = (slotNumber) => {
  let startTime = '';
  let endTime = '';
  if (slotNumber < 12) {
    if (slotNumber === 0) {
      startTime = '12 am';
    } else {
      startTime = `${slotNumber} am`;
    }
    if (slotNumber === 11) {
      endTime = '12 pm';
    } else {
      endTime = `${slotNumber + 1} am`;
    }
  } else if (slotNumber === 12) {
    startTime = '12 pm';
    endTime = '1 pm';
  } else if (slotNumber > 12) {
    startTime = `${slotNumber - 12} pm`;
    if (slotNumber === 23) {
      endTime = '12 am';
    } else {
      endTime = `${slotNumber - 11} pm`;
    }
  }
  return {
    startTime,
    endTime,
  };
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
  const { startTime } = getSlotLabel(slotNumber);

  const { user: { typeId: userId }, topic: { typeId: topicId } } = input;
  const userInfo = await callLocalGraphqlApi(menteeInfoQuery(userId));
  const menteeInfo = get(userInfo, 'data.user');
  const parentInfo = get(menteeInfo, 'studentProfile.parents[0].user');

  const menteeObj = {
    date: bookingDate,
    time: startTime,
    name: get(menteeInfo, 'name') || '',
    grade: get(menteeInfo, 'studentProfile.grade') || '',
    parentName: get(parentInfo, 'name') || '',
    parentEmail: get(parentInfo, 'email') || '',
    parentNumber: get(parentInfo, 'phone.number') || '',
    countryCode: get(parentInfo, 'phone.countryCode') || '',
  };
  const topicInfo = await callLocalGraphqlApi(topicInfoQuery(topicId));
  menteeObj.topicTitle = get(topicInfo, 'data.topic.title');

  let subject = '';
  menteeObj.prevBookingDate = '';
  menteeObj.previousStartTime = '';

  switch (action) {
    case 'add': {
      subject = `Session Booked by ${menteeObj.name}`;
      break;
    }
    case 'update': {
      menteeObj.prevBookingDate = prevBookingDate;
      const previousSlotNumber = prevSlotTimeStringArray[0].split('slot')[1];
      const { startTime: previousStartTime } = getSlotLabel(previousSlotNumber);
      menteeObj.previousStartTime = previousStartTime;
      subject = `Session Updated by ${menteeObj.name}`;
      break;
    }
    case 'delete': {
      subject = `Session Deleted by ${menteeObj.name}`;
      break;
    }
    default:
  }

  const templateFileName = 'menteeSessionBookingEmailTemplate';
  const templateString = parsedHtmlFromTemplateFileAndObject(templateFileName, menteeObj);
  templateString.then((html) => {
    // emailto should be in array. Can send the mail to mutiple people
    let emailTo;
    // send email in case a session is booked/updated/deleted
    // eslint-disable-next-line no-console
    console.log('Capturing NODE_ENV in  prod', process.env.NODE_ENV);
    if (process.env.NODE_ENV === 'production') {
      emailTo = [
        'shantanu.najhawan@tekie.in',
        'anand.verma@tekie.in',
        'naman.mukund@tekie.in',
      ];
    } else {
      emailTo = ['namanmukund@gmail.com'];
    }

    // ccemail should be in array. Can send the mail to mutiple people
    const ccEmail = [''];
    // bccemail should be in array. Can send the mail to mutiple people
    const bccEmail = [''];

    const text = 'Test Text';
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

export default extractMenteeSessionInfoAndSendEmail;
