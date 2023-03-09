/* eslint-disable no-console */
/* eslint-disable no-unreachable */
import AWS from 'aws-sdk';
import { awsConfig } from '../../../utils';
import { fromEmail } from '../../../constants';

const { ses } = awsConfig;

const awsSes = new AWS.SES(ses);

const sendEmail = (emailTo, html) => {
  const params = {
    Destination: {
      ToAddresses: [emailTo],
    },
    Message: {
      Body: {
        Text: {
          Data: 'Reset Password',
        },
        Html: {
          Data: html,
        },
      },
      Subject: {
        Data: 'Reset Password',
      },
    },
    Source: fromEmail,
  };

  awsSes.sendEmail(params, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Email sent:', data);
    }
  });
};

export default sendEmail;
