const bookingLink = 'https://www.tekie.in/sessions/book';
const meWatiSMS = {
  trialRegistrationConfirmation: `Your registration with Tekie is confirmed. Take a free trial class by choosing your preferred date and time here - ${bookingLink}. Mail us at hello@tekie.in for any queries.\n\nTekie`,
  bookingConfirmation: (studentName, sessionDateTime) => `Congratulations! ${studentName}'s free trial with Tekie is confirmed for ${sessionDateTime}.\nWe’ll share more details soon. Mail us at hello@tekie.in for any queries.\n\nTekie`,
  nextDayBookingReminder: (studentName) => `We have saved an exclusive slot for ${studentName}. Book a session by choosing your preferred date and time here - ${bookingLink}. Hurry! Mail us at hello@tekie.in for any queries.\n\nTekie!`,
  engagementMailAcknowledgement: (studentName) => `${studentName}'s session and mentor details have been shared to your registered email id. In case of any queries, email us at hello@tekie.in.\n\nTekie`,
  sessionReminder: (studentName, sessionTime) => `${studentName}'s trial session starts at ${sessionTime}. It will be followed by a Q&A session for parents. Join the session at ${bookingLink}. Mail us at hello@tekie.in for any queries.\n\nTekie`,
};

const usWatiSMS = {
  trialRegistrationConfirmation: `Your registration with Tekie for our Intro to Coding course for kids is confirmed. Take a free trial class by choosing your preferred date and time here - ${bookingLink}. Mail us at engage@tekie.in for any queriesor schedule a call for a 1:1 discussion with our expert.\n\nTeam Tekie`,
  bookingConfirmation: (studentName, sessionDateTime) => `Congratulations! ${studentName}'s free trial for an Intro to Coding session with Tekie is confirmed for ${sessionDateTime}. We’ll share the mentor details and link atleast 3 hours before your session starts on your registered mail id. Feel free to call us at (929) 284 2878. in case you have any doubts.\n\nTeam Tekie`,
  nextDayBookingReminder: (studentName) => `We have saved an exclusive slot for ${studentName}. Book a session by choosing your preferred date and time here - ${bookingLink}. Hurry! Mail us at engage@tekie.in for any queries.\n\nTekie!`,
  sessionReminder: (studentName, sessionTime) => `${studentName}'s trial session starts at ${sessionTime}. It will be followed by a Q&A session for parents. Join the session at ${bookingLink}. Mail us at engage@tekie.in  for any queries.\n\nTekie`,
};
export {
  meWatiSMS,
  usWatiSMS,
};
