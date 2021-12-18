/* eslint-disable no-console */
/* eslint-disable quote-props */
const https = require('https');

const uploadToMailModo = async (contact) => {
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
    res.on('data', (d) => {
      process.stdout.write(d);
    });
  });

  req.on('error', (error) => {
    console.error(error);
  });

  req.write(data);
  req.end();
};

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
  // eslint-disable-next-line no-restricted-syntax
  for (const contact of contactsArray) {
    // eslint-disable-next-line no-await-in-loop
    await uploadToMailModo(contact);
  }
};

export default uploadContacts;
