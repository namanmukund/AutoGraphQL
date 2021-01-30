const transactionalMessageBody = {
  bookingConfirmation: 'oct5_trial_booked_confirmation',
  bookingConfirmationInternational: 'booking_confirmation_usa',
  sessionReminder: 'oct19_class_reminder',
  sessionReminderInternational: 'reminder_link_usa',
  mentorSessionNotification: 'mentor_notification',
  sendSessionLink: {
    emailTemplate: 'sendSessionLink',
    emailTemplateInternational: 'sendSessionLinkInternational',
    subject: 'Tekie - Meeting link for free coding session',
    whatsAppTemplate: 'oct14_know_your_mentor',
    whatsAppTemplateInternational: 'reminder_link_usa',
  },
  didNotPickTheCall: {
    emailTemplate: 'didNotPickTheCall',
    subject: 'Tekie - We tried calling you',
    whatsAppTemplate: 'Oct5_did_not_pick',
  },
  didNotTurnUpInSession: {
    emailTemplate: 'Oct7_no_session_turnup',
    subject: 'Tekie - Missed the free coding session',
    whatsAppTemplate: '',
  },
  sessionNotConducted: {
    emailTemplate: 'sessionNotConducted',
    subject: 'Tekie - Session was not conducted',
    whatsAppTemplate: 'oct14_session_not_conducted',
  },
  testEmail: 'namanmukund@gmail.com',
  testWhatsAppNumber: '919654347463',
};

export default transactionalMessageBody;
