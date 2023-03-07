/* eslint-disable no-unreachable */
// import sgMail from '@sendgrid/mail';
// import sendGridApi from '../../../config/sendGrid';
// import { log } from '../../../utils/log';
import AWS from 'aws-sdk';

const SES_REGION = 'ap-south-1';
const SES_ACCESS_KEY_ID = 'AKIAW5K4IEIGHLN3OSWC';
const SES_SECRET_ACCESS_KEY = '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';

const ses = new AWS.SES({
  region: SES_REGION,
  accessKeyId: SES_ACCESS_KEY_ID,
  secretAccessKey: SES_SECRET_ACCESS_KEY,
});

const sendEmail = (emailMsgObject) => {
  const { html, to } = emailMsgObject;

  const params = {
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Body: {
        Text: {
          Data: 'test mail',
        },
        Html: {
          Data: html,
        },
      },
      Subject: {
        Data: 'This is the subject line.',
      },
    },
    Source: 'support@uolo.com',
  };

  ses.sendEmail(params, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Email sent:', data);
    }
  });
};

export default sendEmail;
