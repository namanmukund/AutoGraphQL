import { get } from 'lodash';
import moment from 'moment';
import { LEAD_PARTNER } from '../../../../../constants/roles';
import updateLeadsquared from '../../../../../services/leadsquared/updateLeadSquared';
import getIntlDateTime from '../../../../../utils/timeZoneDiff';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { fetchAgentName } from '../utils/updateUserBookingAgent';

const getUser = async (phoneNumber) => {
  const user = await callLocalGraphqlApi(`{
    users(filter: { phone_number_subDoc: "${phoneNumber}" }) {
      timezone
    }
  }`);
  return get(user, 'data.users[0]', {});
};

const getLeadPartnerType = async (leadPartnerId, term, medium, source, campaign, content) => {
  const query = `{
  leadPartners(
    filter: {
      and: [
        {
          or: [
            { admins_some: { id: "${leadPartnerId}" } }
            { agents_some: { agent_some: { id: "${leadPartnerId}" } } }
          ]
        }
        {
          agents_some: {
            utmDetails_some: {
              and: [
                ${term ? `{ term: "${term}" }` : ''}
                ${medium ? `{ medium: "${medium}" }` : ''}
                ${source ? `{ source: "${source}" }` : ''}
                ${campaign ? `{ campaign: "${campaign}" }` : ''}
                ${content ? `{ content: "${content}" }` : ''}
              ]
            }
          }
        }
      ]
    }
  ) {
    title
  }
}`;
  const leadPartnerType = await callLocalGraphqlApi(query);
  return get(leadPartnerType, 'data.leadPartners[0]');
};

const addMenteeBookingLeadsquared = async (input, params, slotTimeStringArray, userInfo, topicInfo, isBookedByMentee, agentId, fields = {}, bookedByUserRole) => {
  const { bookingDate } = input;
  let phoneNumber = input.phone;
  let bookingDateTime = '';
  let bookingDateTimeISO = '';
  let date = '';
  let time = '';
  let timezone = 'Asia/Kolkata';
  if (get(input, 'type') === 'b2b2c') {
    const { slot, phone } = input;
    phoneNumber = phone;
    const user = await getUser(phoneNumber);
    timezone = get(user, 'timezone');
    const { dateObject, startTime } = getIntlDateTime(bookingDate, slot, timezone);
    date = moment(dateObject).format('dddd, Do MMMM, YYYY');
    time = startTime;
    bookingDateTime = moment(bookingDate).minutes(0).hours(slot).subtract(5, 'hours')
      .subtract(30, 'minutes')
      .format('YYYY-MM-DD HH:mm:ss');
    bookingDateTimeISO = moment(bookingDate).toISOString();
  } else {
    phoneNumber = get(userInfo, 'data.user.studentProfile.parents[0].user.phone.number');
    const user = await getUser(phoneNumber);
    timezone = get(user, 'timezone');
    const topicOrder = get(topicInfo, 'data.topic.order');
    if (topicOrder === 1) {
      const slotNumber = slotTimeStringArray[0].split('slot')[1];
      const { dateObject, startTime } = getIntlDateTime(bookingDate, slotNumber, timezone);
      date = moment(dateObject).format('dddd, Do MMMM, YYYY');
      time = startTime;
      bookingDateTime = moment(bookingDate).minutes(0).hours(slotNumber).subtract(5, 'hours')
        .subtract(30, 'minutes')
        .format('YYYY-MM-DD HH:mm:ss');
      bookingDateTimeISO = moment(bookingDate).toISOString();
    }
  }

  const agentName = await fetchAgentName(agentId);
  let activityNote = '';
  let bookingStatus = '';
  let bookedBy = '';
  if (bookedByUserRole && bookedByUserRole === LEAD_PARTNER) {
    const term = get(userInfo, 'data.user.utmTerm');
    const source = get(userInfo, 'data.user.utmSource');
    const medium = get(userInfo, 'data.user.utmMedium');
    const content = get(userInfo, 'data.user.utmContent');
    const campaign = get(userInfo, 'data.user.utmCampaign');
    const leadPartnertype = await getLeadPartnerType(agentId, term, medium, source, campaign, content);
    activityNote = 'LeadPartner booked a session';
    if (get(leadPartnertype, 'title')) {
      activityNote = `LeadPartner from ${get(leadPartnertype, 'title')} booked a session`;
    }
    bookingStatus = 'Booked (Non Verified)';
    bookedBy = 'Lead Partner';
    // bookedBy = 'Tekie Team';
  } else if (!isBookedByMentee) {
    activityNote = 'Agent booked a session';
    bookingStatus = 'Booked (Verified)';
    bookedBy = 'Tekie Team';
  } else {
    activityNote = 'User booked a session';
    bookingStatus = 'Booked (Non Verified)';
    bookedBy = 'Customer';
  }
  const now = moment()
    .subtract(5, 'hours')
    .subtract(30, 'minutes')
    .format('YYYY-MM-DD HH:mm:ss');
  const leadSquaredInput = {
    Phone: phoneNumber,
    mx_Booking_Date_Time: bookingDateTime,
    mx_Booking_Date: date,
    mx_Booking_Time: time,
    mx_Last_updated_booking: now,
    mx_ISO_Booking_Date_Time: bookingDateTimeISO,
    ...fields,
  };
  if (!isBookedByMentee && agentName) {
    leadSquaredInput.mx_Booking_Agent = agentName;
  }
  if (input.sessionLink) {
    leadSquaredInput.mx_Demo_Session_Link = input.sessionLink;
  }
  if (input.mx_Meeting_ID) {
    leadSquaredInput.mx_Meeting_ID = input.mx_Meeting_ID;
  }
  if (input.mx_Meeting_Password) {
    leadSquaredInput.mx_Meeting_Password = input.mx_Meeting_Password;
  }
  const activityInput = {
    ActivityEvent: 103,
    ActivityNote: activityNote,
    Fields: [
      {
        SchemaName: 'Status',
        Value: bookingStatus,
      },
      {
        SchemaName: 'mx_Custom_3',
        Value: bookedBy,
      },
      {
        SchemaName: 'mx_Custom_8',
        Value: bookingDateTime,
      },
      {
        SchemaName: 'mx_Custom_12',
        Value: now,
      },
    ],
  };
  updateLeadsquared(leadSquaredInput, false, activityInput);
};

export default addMenteeBookingLeadsquared;
