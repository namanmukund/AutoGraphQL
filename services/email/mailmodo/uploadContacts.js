/* eslint-disable no-console */
/* eslint-disable quote-props */
import { log } from '../../../utils';

const https = require('https');

const uploadToMailModo = (contact) => new Promise((resolve, reject) => {
  const data = JSON.stringify(contact);
  const options = {
    protocol: 'https:',
    hostname: 'api.mailmodo.com',
    path: '/api/v1/addToList',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'mmApiKey': process.env.MAILMODO_KEY,
    },
  };

  const req = https.request(options, (res) => {
    res.setEncoding('utf8');
    let responseBody = '';
    res.on('data', (d) => {
      responseBody += d;
    });
    res.on('end', () => {
      console.log(JSON.parse(responseBody));
      resolve(JSON.parse(responseBody));
    });
  });

  req.on('error', (error) => {
    console.log(error);
    reject(error);
  });

  req.write(data);
  req.end();
});

/**
 * Contacts array takes in objects of the form -
 * where data can be any key value pairs
 * {
    email: 'john@example1.com',
    data: {
      firsName: 'Mary',
      lastName: 'Smith',
      contact: '9887766558',
    },
    listName: 'test list',
  }
 */
const uploadContacts = async (contactsArray) => {
  log('******* Uploading contacts to Mailmodo');
  // eslint-disable-next-line no-restricted-syntax
  for (const contact of contactsArray) {
    // eslint-disable-next-line no-await-in-loop
    await uploadToMailModo(contact);
  }
  log('******* Finished uploading contacts to Mailmodo');
};

export default uploadContacts;
