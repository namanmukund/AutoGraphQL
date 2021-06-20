import { get } from 'lodash';
import moment from 'moment';
import { campaignTypes } from '../../../../../constants';
import getSlotLabel from '../../../../../utils/getSlotLabel';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import sendWhatsAppTemplateMessage from '../../../utils/sendWhatsAppTemplateMessage';
import getSelectedSlotsTime from '../../preHookFunctions/validation/utils/getSelectedSlotsTime';
import { addMenteeBookingLeadsquared } from '../leadsquared';
import sendBookingReminderOrConfirmationB2BC from './sendBookingReminderOrConfirmationB2B2C';

const BATCH_SESSION = (batchSessionId) => `{
  batchSession(id: "${batchSessionId}") {
    topic {
      order
    }
    batch {
      code
      school {
        name
      }
      studentsMeta {
        count
      }
      allottedMentor {
        phone {
          countryCode
          number
        }
        mentorProfile {
          sessionLink
          googleMeetLink
        }
      }
    }
    bookingDate
    ${new Array(24).fill('').map((_, i) => `slot${i}`).join('\n')}
    attendance {
      student {
        id
        parents{
          user {
            name
            campaign {
              type
            }
            id
            phone {
              number
              countryCode
            }
          }
        }
      }
    }
  }
}`;

const extractBatchSessionAndSendB2B = async (batchSessionId, studentsId) => {
  const batchSessionRes = await callLocalGraphqlApi(BATCH_SESSION(batchSessionId));
  // Don't proceed if it is not the first topic
  if (get(batchSessionRes, 'data.batchSession.topic.order') !== 1) return;
  studentsId.forEach((studentId) => {
    const studentsInBatchSession = get(batchSessionRes, 'data.batchSession.attendance', []).map((attendance) => get(attendance, 'student'));
    const student = studentsInBatchSession.find((studentInBatchSession) => get(studentInBatchSession, 'id') === studentId);
    const phone = get(student, 'parents[0].user.phone.number');
    const campaignType = get(student, 'parents[0].user.campaign.type');
    const slot = get(getSelectedSlotsTime(get(batchSessionRes, 'data.batchSession')), '[0]');
    if (student && campaignType === campaignTypes.b2b2cEvent) {
      addMenteeBookingLeadsquared({
        phone,
        bookingDate: get(batchSessionRes, 'data.batchSession.bookingDate'),
        slot,
        type: 'b2b2c',
      });
      sendBookingReminderOrConfirmationB2BC(get(student, 'parents[0].user.id'), true);
      const defaultSessionLink = get(batchSessionRes, 'data.batchSession.batch.allottedMentor.mentorProfile.sessionLink');
      const googleMeetLink = get(batchSessionRes, 'data.batchSession.batch.allottedMentor.mentorProfile.googleMeetLink');
      const sessionLink = googleMeetLink || defaultSessionLink;
      const mentorPhoneNumber = get(batchSessionRes, 'data.batchSession.batch.allottedMentor.phone.number', '');
      const mentorPhoneCountryCode = get(batchSessionRes, 'data.batchSession.batch.allottedMentor.phone.countryCode', '');
      sendWhatsAppTemplateMessage(
        mentorPhoneCountryCode.replace('+', '') + mentorPhoneNumber,
        mentorPhoneCountryCode.replace('+', ''),
        'mentor_workshop_confirmation',
        get(student, 'parents[0].user.name'),
        [
          {
            name: 'batch_code',
            value: get(batchSessionRes, 'data.batchSession.batch.code'),
          },
          {
            name: 'school_name',
            value: get(batchSessionRes, 'data.batchSession.batch.school.name'),
          },
          {
            name: 'no_of_students',
            value: get(batchSessionRes, 'data.batchSession.batch.studentsMeta.count'),
          },
          {
            name: 'w_date',
            value: moment(get(batchSessionRes, 'data.batchSession.bookingDate')).format('dddd, Do MMMM'),
          },
          {
            name: 'w_time',
            value: getSlotLabel(slot).startTime,
          },
          {
            name: 'session_link',
            value: sessionLink,
          },
        ],
      );
    }
  });
};

export default extractBatchSessionAndSendB2B;
