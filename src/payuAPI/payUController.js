import { get } from 'lodash';
import { log } from '../../utils';
import callLocalGraphqlApi from '../api/callLocalGraphqlApi';
import { commonUserValidation } from '../autoGenerate/graphql/preHookFunctions/validation/utils';
import getHashDigest from './getHashDigest';
import fetchSalesOperations from './query/fetchSalesOperations';
import fetchUsers from './query/fetchUsers';


const users = async (req, res) => {
  const digest = getHashDigest(req.body);
  let foundError = false;
  let userExists = false;
  let hasPaid = false;
  if (digest === req.headers['x-tekie-signature']) {
    log('Request is Authorized');
    // process it further
    const phoneQuery = get(req, 'query.phone', '');
    const emailQuery = get(req, 'query.email', '');
    const countryCode = get(req, 'query.countryCode', '');
    const countryCodeQuery = '+'+countryCode;

    const phoneDoc = {
      countryCode: countryCodeQuery,
      number: phoneQuery
    };

    let isValidParams = false;

    try {
      isValidParams = commonUserValidation({ email: emailQuery, phone: phoneDoc, name: '' });
    } catch (err) {
      foundError = true;
      log('Phone/Country Code/Email Invalid');
    }

    if (phoneQuery && emailQuery && isValidParams) {
      log('Phone and Email validated.')
      const usersRes = await callLocalGraphqlApi(fetchUsers(phoneQuery, emailQuery));
      const usersFound = get(usersRes, 'data.users', []);
      if (usersFound.length === 1) {
        log('User found.')
        userExists = true;
        const clientId = get(usersFound, '[0].parentProfile.children[0].user.id', '');
        const salesOperationsRes = await callLocalGraphqlApi(fetchSalesOperations(clientId));
        const salesOperations = get(salesOperationsRes, 'data.salesOperations', []);
        hasPaid = salesOperations.length > 0;
      } 
    } else {
      // send bad request error
      foundError = true;
      res.status(400).send('Valid phone number or country code or email address not found');
    }
  }
  // reply to razorpay server
  if (!foundError) {
    res.json({
      status: 'ok',
      userExists,
      hasPaid
    });
  }
}

const payUController = {};
payUController.users = users;

export default payUController;
