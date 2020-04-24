const twilioConfig = {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  senderId: process.env.TWILIO_SENDER_ID,
};

export default twilioConfig;
