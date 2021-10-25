/* eslint-disable no-unused-vars */
import { get } from 'lodash';
import transactionalMessageBody from '../../../constants/transactionalMessageBody';
import getLongDate from '../../../utils/getLongDate';
import getSlotLabel from '../../../utils/getSlotLabel';
import callLocalGraphqlApi from '../../api/callLocalGraphqlApi';
import sendTransactionalEmail from '../graphql/resolvers/utils/sendTransactionalEmail';
import sendWhatsAppTemplateMessage from './sendWhatsAppTemplateMessage';

const getUserDetails = async (id) => {
  const query = `{
  mentorProfile(id: "${id}") {
    id
    user {
      id
      name
      email
      phone {
        number
        countryCode
      }
    }
  }
}
`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.mentorProfile');
};

const sendMailAndWhatsappMessageForSupplyRequest = async (mentorProfileId, slotDateTimeObj, fromMenteeSession = false) => {
  const environment = process.env.NODE_ENV;
  if (environment === 'production') {
    const mentorProfile = await getUserDetails(mentorProfileId);
    const mentorName = get(mentorProfile, 'user.name');
    const mentorEmail = get(mentorProfile, 'user.email');
    const mentorCountryCode = get(mentorProfile, 'user.phone.countryCode');
    const mentorPhoneNumber = get(mentorProfile, 'user.phone.number');
    if (mentorEmail || mentorPhoneNumber) {
      // eslint-disable-next-line no-console
      console.log('sending email and whatsapp notification to ', mentorName);
      // eslint-disable-next-line prefer-const
      let { date, time, slotId } = slotDateTimeObj;
      time = time.split('slot')[1];
      date = getLongDate(date);
      const startTime = getSlotLabel(time).startTime;
      let link = '';
      if (process.env.DATA_MASKING) {
        link = 'https://tekie-tms-pre-prod.herokuapp.com/mentorDashboard';
      } else {
        link = 'https://tekie-managment-system.herokuapp.com/mentorDashboard';
      }
      if (!fromMenteeSession) {
        link += `?slot=${slotId}`;
      } else {
        link += `?session=${slotId}&type=mentee`;
      }
      if (mentorEmail) {
        sendTransactionalEmail({
          name: mentorName,
          parentEmail: mentorEmail,
          date,
          time: startTime,
          link: `${link}`,
        },
        transactionalMessageBody.newSlotRequest, 'india', true);
      }
      const phone = mentorCountryCode.split('+')[1] + mentorPhoneNumber;
      const parameters = [
        {
          name: 'parent_name',
          value: 'Pawan',
        },
        {
          name: 'student_name',
          value: 'Pawan',
        },
        {
          name: 'session_date',
          value: date,
        },
        {
          name: 'session_time',
          value: startTime,
        },
        {
          name: 'number',
          value: '9766236884',
        },
        {
          name: 'grade',
          value: 'gradeA',
        },
        {
          name: 'email',
          value: link,
        },
      ];
      if (mentorPhoneNumber) {
        await sendWhatsAppTemplateMessage(
          phone,
          transactionalMessageBody.mentorSessionNotification,
          mentorName,
          parameters,
        );
      }
    }
  }
};

export default sendMailAndWhatsappMessageForSupplyRequest;
