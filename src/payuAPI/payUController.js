import { get } from 'lodash';
import { dateInPast, log } from '../../utils';
import callLocalGraphqlApi from '../api/callLocalGraphqlApi';
import { commonUserValidation } from '../autoGenerate/graphql/preHookFunctions/validation/utils';
import getHashDigest from './getHashDigest';
import fetchDiscounts from './query/fetchDiscounts';
import fetchProducts from './query/fetchProducts';
import fetchSalesOperations from './query/fetchSalesOperations';
import fetchUsers from './query/fetchUsers';


const users = async (req, res) => {
  const digest = getHashDigest(req.query);
  log(`digest ${digest}`);
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
  } else {
    foundError = true;
    res.status(401).send('Unauthorized');
  }
  // reply to caller
  if (!foundError) {
    res.json({
      status: 'ok',
      userExists,
      hasPaid
    });
  }
}

const productAmount = async (req, res) => {
  const digest = getHashDigest(req.query);
  log(`digest ${digest}`);
  let foundError = false;
  let isAmountValid = false;
  if (digest === req.headers['x-tekie-signature']) {
    log('Request is Authorized');
    // process it further
    const productIdQuery = get(req, 'query.productId', '');
    const amountQuery = get(req, 'query.amount', 0);
    const discountCodeQuery = get(req, 'query.discountCode', '');

    // if inputs are present
    if (productIdQuery && amountQuery) {
      log('productId & amount sent in query.')
      const productsRes = await callLocalGraphqlApi(fetchProducts(productIdQuery));
      const productsFound = get(productsRes, 'data.products', []);
      if (productsFound.length === 1) {
        log('Product found.')
        let productPriceAmount = get(productsFound, '[0].price.amount', 0);
        log(`productPriceAmount ${productPriceAmount}`);
        
        // if discount code is passed in params
        if (discountCodeQuery) {
          const discountRes = await callLocalGraphqlApi(fetchDiscounts(discountCodeQuery, productIdQuery));
          const discountsFound = get(discountRes, 'data.discounts', []);

          // if discount document is found
          if (discountsFound.length === 1) {
            const discountExpiryDateString = get(discountsFound, '[0].expiryDate', '');
            const discountExpiryDate = new Date(discountExpiryDateString);
            const today = new Date();

            // if code has not expired
            if (!dateInPast(discountExpiryDate, today)) {
              log('discount not expired');
              const discountPercentage = get(discountsFound, '[0].percentage', '')
              log('discountPercentage', discountPercentage);
              const discount = Math.round(productPriceAmount * discountPercentage * 0.01);
              productPriceAmount = productPriceAmount - discount;
              productPriceAmount = Math.round((productPriceAmount + Number.EPSILON) * 100) / 100;
            }
          }
        }

        log(`productPriceAmount ${productPriceAmount}`);

        if (productPriceAmount.toString() === amountQuery) {
          isAmountValid = true;
        }

      }
    } else {
      // send bad request error
      foundError = true;
      res.status(400).send('Valid product id or amount not found');
    }
  } else {
    foundError = true;
    res.status(401).send('Unauthorized');
  }
  // reply to caller
  if (!foundError) {
    res.json({
      status: 'ok',
      isAmountValid
    });
  }
};

const payUController = {};
payUController.users = users;
payUController.productAmount = productAmount;

export default payUController;
