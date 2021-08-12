import { get } from 'lodash';
import moment from 'moment';
import { batchType } from '../../../../../constants';
import getSlotLabel from '../../../../../utils/getSlotLabel';
import addToSchedule from '../../../../../utils/scheduleJobs/addToSchedule';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import sendWhatsAppTemplateMessage from '../../../utils/sendWhatsAppTemplateMessage';
import getSelectedSlotsTime from '../../preHookFunctions/validation/utils/getSelectedSlotsTime';
import { addMenteeBookingLeadsquared } from '../leadsquared';
import sendBookingReminderOrConfirmationB2BC from './sendBookingReminderOrConfirmationB2B2C';

const BATCH_SESSION = (batchSessionId) => `{
  batchSession(id: "${batchSessionId}") {
    course {
      title
    }
    topic {
      order
    }
    batch {
      code
      type
      campaign {
        id
        type
      }
      school {
        name
      }
      studentsMeta {
        count
      }
      allottedMentor {
        id
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

const extractBatchSessionAndSendB2BC = async (batchSessionId, studentsId, isBackendApp, shouldSendMentorComms = true) => {
  const batchSessionRes = await callLocalGraphqlApi(BATCH_SESSION(batchSessionId));
  // Don't proceed if it is not the first topic
  if (get(batchSessionRes, 'data.batchSession.topic.order') !== 1) return;
  const mentorUserId = get(batchSessionRes, 'data.batchSession.batch.allottedMentor.id', '');
  const mentorPhoneNumber = get(batchSessionRes, 'data.batchSession.batch.allottedMentor.phone.number', '');
  const mentorPhoneCountryCode = get(batchSessionRes, 'data.batchSession.batch.allottedMentor.phone.countryCode', '');
  const studentBatchType = get(batchSessionRes, 'data.batchSession.batch.type');
  if (studentBatchType !== batchType.b2b2c) return;
  const defaultSessionLink = get(batchSessionRes, 'data.batchSession.batch.allottedMentor.mentorProfile.sessionLink', '-');
  const googleMeetLink = get(batchSessionRes, 'data.batchSession.batch.allottedMentor.mentorProfile.googleMeetLink', '-');
  const sessionLink = googleMeetLink || defaultSessionLink || '-';
  const slot = get(getSelectedSlotsTime(get(batchSessionRes, 'data.batchSession')), '[0]');
  if (studentsId && studentsId.length && studentsId.length > 0) {
    studentsId.forEach((studentId) => {
      const studentsInBatchSession = get(batchSessionRes, 'data.batchSession.attendance', []).map((attendance) => get(attendance, 'student'));
      const student = studentsInBatchSession.find((studentInBatchSession) => get(studentInBatchSession, 'id') === studentId);
      const phone = get(student, 'parents[0].user.phone.number');
      addMenteeBookingLeadsquared({
        phone,
        bookingDate: get(batchSessionRes, 'data.batchSession.bookingDate'),
        slot,
        sessionLink,
        type: 'b2b2c',
      });
      sendBookingReminderOrConfirmationB2BC(get(student, 'parents[0].user.id'), true);
    });
  }
  if (shouldSendMentorComms && studentsId && studentsId.length && studentsId.length > 0) {
    sendWhatsAppTemplateMessage(
      mentorPhoneCountryCode.replace('+', '') + mentorPhoneNumber,
      'mentor_confirmation_b2b2c',
      mentorPhoneNumber,
      [
        {
          name: 'course',
          value: get(batchSessionRes, 'data.batchSession.course.title'),
        },
        {
          name: 'batch_code',
          value: get(batchSessionRes, 'data.batchSession.batch.code'),
        },
        {
          name: 'school_name',
          value: get(batchSessionRes, 'data.batchSession.batch.school.name'),
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

    // schedule new mentor reminder
    const bookingDate = get(batchSessionRes, 'data.batchSession.bookingDate');
    const bookingDateTime = new Date(moment(bookingDate).toDate().setHours(slot, 0, 0, 0)).toISOString();
    const hoursLeftForSession = Math.abs(moment(bookingDateTime).diff(moment(), 'hours'));
    if (hoursLeftForSession < 3) return;

    let mentorSessionReminderDateTime = moment(bookingDateTime).subtract(30, 'minutes').toDate();
    if (hoursLeftForSession >= 18) {
      mentorSessionReminderDateTime = moment(bookingDateTime).subtract(2, 'hours').toDate();
    }
    addToSchedule('mentorSessionNotificationB2B2C', mentorSessionReminderDateTime, {
      batchSessionId,
      courseName: get(batchSessionRes, 'data.batchSession.course.title'),
      batchCode: get(batchSessionRes, 'data.batchSession.batch.code'),
      schoolName: get(batchSessionRes, 'data.batchSession.batch.school.name'),
      sessionDate: moment(get(batchSessionRes, 'data.batchSession.bookingDate')).format('dddd, Do MMMM'),
      sessionTime: getSlotLabel(slot).startTime,
      sessionLink,
      mentorUserId,
      mentorPhoneNumber,
    });
  }
};

export default extractBatchSessionAndSendB2BC;
