const transactionalMessageBody = {
  bookingConfirmation: 'oct5_trial_booked_confirmation',
  bookingConfirmationInternational: 'booking_confirmation_usa',
  bookingWithWelcomeConfirmationInternational: 'successful_booking_usa_3',
  bookingConfirmationSoonInternational: 'booking_confirmation_usa_soon_v2',
  bookingWithWelcomeSoonConfirmationInternational: 'successful_booking_usa_2_soon_v2',
  sessionReminder: 'oct19_class_reminder',
  sessionReminderInternational: 'reminder_link_usa',
  mentorSessionNotification: 'mentor_notification',
  demoAssignedMentor: 'demo_assigned_mentor',
  sessionMissed: {
    emailTemplate: 'sessionMissed',
    emailTemplateInternational: 'sessionMissed',
    subject: 'Tekie - Meeting link for free coding session',
    subjectInternational: 'You missed the session! But don\'t worry.',
    whatsAppTemplate: 'session_missed_usa',
  },
  demoNotBooked: {
    emailTemplate: 'demoNotBooked',
    emailTemplateInternational: 'demoNotBooked',
    subject: 'Just one step away from experiencing Tekie!',
    subjectInternational: 'Just one step away from experiencing Tekie!',
    whatsAppTemplate: 'welcome_usa_v2',
  },
  sendSessionLink: {
    emailTemplate: 'B2CSessionLink',
    emailTemplateInternational: 'B2CSessionLink',
    subject: (studentName) => `${studentName}'s coding journey begins soon. Are you excited?`,
    subjectInternational: (studentName) => `${studentName}'s coding journey begins soon. Are you excited?`,
    whatsAppTemplate: 'demo_reminder_1',
    whatsAppTemplateInternational: 'demo_reminder_1',
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
  newSlotRequest: {
    emailTemplate: 'newSlotRequest',
    subject: 'Tekie - New Slot Request',
    whatsAppTemplate: '',
  },
  testEmail: 'namanmukund@gmail.com',
  testWhatsAppNumber: '919654347463',
};

export default transactionalMessageBody;
