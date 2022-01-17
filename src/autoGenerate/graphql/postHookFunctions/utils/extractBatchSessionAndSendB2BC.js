import { get } from 'lodash';
import moment from 'moment';
import { batchType } from '../../../../../constants';
import getFullFilePath from '../../../../../utils/getFullFilePath';
import getSlotLabel from '../../../../../utils/getSlotLabel';
import addToSchedule from '../../../../../utils/scheduleJobs/addToSchedule';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import sendWhatsAppTemplateMessage from '../../../utils/sendWhatsAppTemplateMessage';
import getSelectedSlotsTime from '../../preHookFunctions/validation/utils/getSelectedSlotsTime';
import getMentorCodingLanguages from '../../resolvers/utils/getMentorCodingLanguages';
import { addMenteeBookingLeadsquared } from '../leadsquared';
import isMentorChild from './isMentorChild';
// import sendBookingReminderOrConfirmationB2BC from './sendBookingReminderOrConfirmationB2B2C';

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
        code
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
        name
        phone {
          countryCode
          number
        }
        profilePic{
          id
          uri
        }
        mentorProfile {
          sessionLink
          meetingId
          meetingPassword
          googleMeetLink
          experienceYear
          codingLanguages {
            value
          }
          pythonCourseRating5
          pythonCourseRating4
          pythonCourseRating3
          pythonCourseRating2
          pythonCourseRating1
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

const minCap = (num, cap) => (num > cap ? num : cap);

const getRating = (pythonCourseRating1, pythonCourseRating2, pythonCourseRating3, pythonCourseRating4, pythonCourseRating5) => {
  let totalRatingUsers = 0;
  let cumulativeRating = 0;
  if (pythonCourseRating5) {
    totalRatingUsers += pythonCourseRating5;
    cumulativeRating += pythonCourseRating5 * 5;
  }
  if (pythonCourseRating4) {
    totalRatingUsers += pythonCourseRating4;
    cumulativeRating += pythonCourseRating4 * 4;
  }
  if (pythonCourseRating3) {
    totalRatingUsers += pythonCourseRating3;
    cumulativeRating += pythonCourseRating3 * 3;
  }
  if (pythonCourseRating2) {
    totalRatingUsers += pythonCourseRating2;
    cumulativeRating += pythonCourseRating2 * 2;
  }
  if (pythonCourseRating1) {
    totalRatingUsers += pythonCourseRating1;
    cumulativeRating += pythonCourseRating1;
  }
  return minCap(
    totalRatingUsers === 0
      ? 5
      : Math.round(((cumulativeRating) / totalRatingUsers) * 100) / 100,
    4.7,
  );
};

const extractBatchSessionAndSendB2BC = async (batchSessionId, studentsId, isBookedByMentee, shouldSendMentorComms = true) => {
  const batchSessionRes = await callLocalGraphqlApi(BATCH_SESSION(batchSessionId));
  // Don't proceed if it is not the first topic
  if (get(batchSessionRes, 'data.batchSession.topic.order') !== 1) return;
  const mentorUser = get(batchSessionRes, 'data.batchSession.batch.allottedMentor', {});
  const mentorUserId = get(batchSessionRes, 'data.batchSession.batch.allottedMentor.id', '');
  const mentorName = get(batchSessionRes, 'data.batchSession.batch.allottedMentor.name', '');
  const mentorProfile = get(batchSessionRes, 'data.batchSession.batch.allottedMentor.mentorProfile', {});
  const mentorExp = get(mentorProfile, 'experienceYear') || 3;
  const {
    pythonCourseRating1, pythonCourseRating2, pythonCourseRating3, pythonCourseRating4, pythonCourseRating5,
  } = mentorProfile;
  const mentorPhoneNumber = get(batchSessionRes, 'data.batchSession.batch.allottedMentor.phone.number', '');
  const mentorPhoneCountryCode = get(batchSessionRes, 'data.batchSession.batch.allottedMentor.phone.countryCode', '');
  const studentBatchType = get(batchSessionRes, 'data.batchSession.batch.type');
  if (studentBatchType !== batchType.b2b2c) return;
  const defaultSessionLink = get(batchSessionRes, 'data.batchSession.batch.allottedMentor.mentorProfile.sessionLink', '-');
  const googleMeetLink = get(batchSessionRes, 'data.batchSession.batch.allottedMentor.mentorProfile.googleMeetLink', '-');
  const sessionLink = googleMeetLink || defaultSessionLink || '-';
  const meetingId = googleMeetLink ? null : get(batchSessionRes, 'data.batchSession.batch.allottedMentor.mentorProfile.googleMeetLink', '-');
  const meetingPassword = googleMeetLink ? null : get(batchSessionRes, 'data.batchSession.batch.allottedMentor.mentorProfile.googleMeetLink', '-');

  const slot = get(getSelectedSlotsTime(get(batchSessionRes, 'data.batchSession')), '[0]');
  if (!isMentorChild(studentsId[0]) && studentsId && studentsId.length && studentsId.length > 0) {
    studentsId.forEach((studentId) => {
      const studentsInBatchSession = get(batchSessionRes, 'data.batchSession.attendance', []).map((attendance) => get(attendance, 'student'));
      const student = studentsInBatchSession.find((studentInBatchSession) => get(studentInBatchSession, 'id') === studentId);
      const phone = get(student, 'parents[0].user.phone.number');
      const mentorPhoto = get(
        mentorUser,
        'profilePic.uri',
        'python/email/mentor1.png',
      ) || 'python/email/mentor1.png';
      const lsInput = {
        phone,
        bookingDate: get(batchSessionRes, 'data.batchSession.bookingDate'),
        slot,
        sessionLink,
        type: 'b2b2c',
      };
      if (lsInput) {
        lsInput.mx_Meeting_ID = meetingId;
      }
      if (lsInput) {
        lsInput.mx_Meeting_Password = meetingPassword;
      }
      addMenteeBookingLeadsquared(lsInput, {}, [], {}, {}, isBookedByMentee, null, {
        mx_Mentor_Name: mentorName,
        mx_Mentor_Exp_in_years: mentorExp,
        mx_Mentor_Photo: getFullFilePath(mentorPhoto),
        mx_Mentor_Languages_Known: getMentorCodingLanguages(get(mentorProfile, 'codingLanguages')) || 'Python',
        mx_Mentor_Star_Rating: getRating(pythonCourseRating1, pythonCourseRating2, pythonCourseRating3, pythonCourseRating4, pythonCourseRating5),
      });
      // sendBookingReminderOrConfirmationB2BC(get(student, 'parents[0].user.id'), true);
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
