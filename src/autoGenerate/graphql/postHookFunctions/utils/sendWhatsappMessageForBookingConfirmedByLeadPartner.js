import { get } from 'lodash';
import moment from 'moment';
import transactionalMessageBody from '../../../../../constants/transactionalMessageBody';
import getIntlDateTime from '../../../../../utils/timeZoneDiff';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import sendWhatsAppTemplateMessage from '../../../utils/sendWhatsAppTemplateMessage';

const getMagicLinkForUser = async (userId) => {
  const query = `{
  getMagicLink(input: { userId: "${userId}", isLeadLogin: true, linkVisitLimit: 1 }) {
    linkUri
    expiresIn
    linkToken
  }
}
`;
  const magicLinkResp = await callLocalGraphqlApi(query);
  const magicLink = get(magicLinkResp, 'data.getMagicLink', []);
  return magicLink;
};

const sendWhatsappMessageForBookingConfirmedByLeadParnter = async (userInfo, slotTimeStringArray, bookingDate) => {
  const getMagicLink = await getMagicLinkForUser(get(userInfo, 'data.user.id', ''));
  if (getMagicLink.length > 0) {
    const magicLink = get(getMagicLink, '[0].linkUri');
    const { name, phone: { number, countryCode } } = get(userInfo, 'data.user.studentProfile.parents[0].user');
    if (number) {
      const slotNumber = slotTimeStringArray[0].split('slot')[1];
      const { dateObject, startTime } = getIntlDateTime(bookingDate, slotNumber, 'Asia/Kolkata');
      const date = moment(dateObject).format('dddd, Do MMMM, YYYY');
      const phone = countryCode.split('+')[1] + number;
      await sendWhatsAppTemplateMessage(
        phone,
        transactionalMessageBody.leadPartnerBookingConfirmation,
        phone,
        [
          {
            name: 'parent_name',
            value: name,
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
            name: 'booking_confirmation_magic_link',
            value: magicLink,
          },
        ],
      );
    }
  }
};

export default sendWhatsappMessageForBookingConfirmedByLeadParnter;
