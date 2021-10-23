import { get } from 'lodash';
import transactionalMessageBody from '../../../constants/transactionalMessageBody';
import getSlotLabel from '../../../utils/getSlotLabel';
import callLocalGraphqlApi from '../../api/callLocalGraphqlApi';
import sendTransactionalEmail from '../graphql/resolvers/utils/sendTransactionalEmail';

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

const sendMailAndWhatsappMessageForSupplyRequest = async (mentorProfileId, slotDateTimeObj) => {
  const mentorProfile = await getUserDetails(mentorProfileId);
  const mentorName = get(mentorProfile, 'user.name');
  const mentorEmail = get(mentorProfile, 'user.email');
  if (mentorEmail) {
    // eslint-disable-next-line no-console
    console.log('sending email notification to', mentorEmail);
    // eslint-disable-next-line prefer-const
    let { date, time, slotId } = slotDateTimeObj;
    time = time.split('slot')[1];
    const environment = process.env.NODE_ENV;
    let link = '';
    if (environment === 'production') {
      link = `https://tekie-managment-system.herokuapp.com/mentorDashboard?slot=${slotId}`;
    } else {
      link = `https://tekie-tms-staging.herokuapp.com/mentorDashboard?slot=${slotId}`;
    }
    sendTransactionalEmail({
      name: mentorName,
      parentEmail: mentorEmail,
      date: new Date(date).toDateString(),
      time: getSlotLabel(time, false).startTime,
      link: `${link}`,
    },
    transactionalMessageBody.newSlotRequest, 'india', true);
  }
};

export default sendMailAndWhatsappMessageForSupplyRequest;
