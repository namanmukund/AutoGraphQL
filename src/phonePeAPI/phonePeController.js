/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable radix */
import { get } from 'lodash';
import { dateInPast, log } from '../../utils';
import callLocalGraphqlApi from '../api/callLocalGraphqlApi';
import { commonUserValidation } from '../autoGenerate/graphql/preHookFunctions/validation/utils';
import getHashDigest from './getHashDigest';
import fetchDiscounts from './query/fetchDiscounts';
import fetchProductsQuery from './query/fetchProducts';
import fetchSalesOperations from './query/fetchSalesOperations';
import fetchUsersQuery from './query/fetchUsers';
import fetchUserMerchantsQuery from './query/fetchUserMerchants';
import addUserMerchant from './mutation/addUserMerchant';
import updateUserMerchant from './mutation/updateUserMerchant';
import fetchCourseIdFromProduct from './query/fetchCourseIdFromProduct';

/*
  fetchProducts endpoint
  query parameters - nil
  response - title, merchantDesc, totalSessionsCount, price, all thumbnails, merchantDiscountCode, merchantDiscountPrice, finalDiscountedPrice, features
*/

const fetchProducts = async (req, res) => {
  const digest = getHashDigest(req.query);
  log(`digest ${digest}`);
  let foundError = false;
  const productsFetched = [];
  try {
    if (digest === req.headers['x-tekie-signature']) {
      log('Request is Authorized');
      // process it further
      // fetch products in which showOnMerchantSite field is marked true
      const productsRes = await callLocalGraphqlApi(fetchProductsQuery());
      const productsFound = get(productsRes, 'data.products', []);
      if (productsFound.length > 0) {
        log(`${productsFound.length} Products found.`);
        for (const product of productsFound) {
          const newProduct = {};
          // constructing product object
          newProduct.price = get(product, 'price.amount', 0);
          newProduct.id = get(product, 'id', '');
          log(`priceAmount ${newProduct.price}`);
          newProduct.title = get(product, 'title', '');
          newProduct.merchantDescription = get(product, 'merchantDescription', '');
          newProduct.smallThumbnailUrl = get(product, 'smallThumnail.uri', '') ? `${process.env.CLOUDFRONT_BASE_URL}/${get(product, 'smallThumnail.uri', '')}` : null;
          newProduct.mediumThumbnailUrl = get(product, 'mediumThumbnail.uri', '') ? `${process.env.CLOUDFRONT_BASE_URL}/${get(product, 'mediumThumbnail.uri', '')}` : null;
          newProduct.largeThumbnailUrl = get(product, 'largeThumbnail.uri', '') ? `${process.env.CLOUDFRONT_BASE_URL}/${get(product, 'largeThumbnail.uri', '')}` : null;
          newProduct.features = [];
          for (const feature of get(product, 'features', [])) {
            newProduct.features.push(get(feature, 'statement', ''));
          }

          const additionalFilter = '{isDefaultMerchant: true}';
          const discountRes = await callLocalGraphqlApi(fetchDiscounts(get(product, 'id', ''), additionalFilter));
          const discountsFound = get(discountRes, 'data.discounts', []);

          const productPriceAmount = get(product, 'price.amount', 0);
          let discountedAmount = productPriceAmount;
          let discountCode = '';
          let discount = 0;

          // if discount document is found
          if (discountsFound.length === 1) {
            const discountExpiryDateString = get(discountsFound, '[0].expiryDate', '');
            discountCode = get(discountsFound, '[0].code', '');
            const discountExpiryDate = new Date(discountExpiryDateString);
            const today = new Date();

            // if code has not expired
            if (!dateInPast(discountExpiryDate, today)) {
              log('discount not expired');
              const discountPercentage = get(discountsFound, '[0].percentage', '');
              log('discountPercentage', discountPercentage);
              discount = Math.round(productPriceAmount * discountPercentage * 0.01);
              discountedAmount = productPriceAmount - discount;
              discountedAmount = Math.round((discountedAmount + Number.EPSILON) * 100) / 100;
            }
          }

          newProduct.merchantDiscountAmount = discount;
          newProduct.finalDiscountedPrice = discountedAmount;
          newProduct.merchantDiscountCode = discountCode;

          log(`discountedAmount ${discountedAmount}`);
          log(`productPriceAmount ${productPriceAmount}`);

          // console.log('new Product obj', newProduct);
          productsFetched.push(newProduct);
        }
      }
    } else {
      foundError = true;
      res.status(401).send('Unauthorized');
    }
  } catch (err) {
    log('Error thrown.');
  }
  // reply to caller
  if (!foundError) {
    res.json({
      products: productsFetched,
    });
  }
};

/*
  fetchUsers endpoint
  query parameters - phone, email, productId,  amount, grade, parentName, studentName
  response - true/false, message, userMerchantId
*/

const fetchUsers = async (req, res) => {
  const digest = getHashDigest(req.query);
  log(`digest ${digest}`);
  let foundError = false;
  let userExists = false;
  let hasPaid = false;
  let message = '';
  let userMerchantCreatedId = '';
  let proceedWithPayment = true;
  let campaignType = '';
  try {
    if (digest === req.headers['x-tekie-signature']) {
      log('Request is Authorized');
      // process it further
      const phoneQuery = get(req, 'query.phone', '');
      const emailQuery = get(req, 'query.email', '');
      const amount = get(req, 'query.amount', 0);
      const productId = get(req, 'query.productId', '');
      // campaign type will be set based on amount sent
      campaignType = (amount > 0 && amount <= 3) ? 'booking' : 'purchase';

      const countryCodeQuery = '+91';

      const phoneDoc = {
        countryCode: countryCodeQuery,
        number: phoneQuery,
      };

      let isValidParams = false;
      // validating phone and email input
      try {
        isValidParams = commonUserValidation({ email: emailQuery, phone: phoneDoc, name: '' });
      } catch (err) {
        foundError = true;
        log('Phone/Email Invalid');
      }

      if (phoneQuery && emailQuery && isValidParams) {
        log('Phone and Email validated.');
        const usersRes = await callLocalGraphqlApi(fetchUsersQuery(phoneQuery, emailQuery));
        const usersFound = get(usersRes, 'data.users', []);

        // if user is found in database, check if user is present in userMerchant collection, if not, then add it
        // if user is not found in database, add to userMerchant collection
        let userPresentInUserMerchantCollection = false;
        if (usersFound.length === 1) {
          log('User found in User collection.');
          userExists = true;
          const clientId = get(usersFound, '[0].parentProfile.children[0].user.id', '');

          // if campaignType = 'purchase', check if sales operation lead status = won
          // TODO : from prodId, get courseId and pass in salesOperation

          const fetchedProductRes = await callLocalGraphqlApi(fetchCourseIdFromProduct(productId));
          const fetchedProduct = get(fetchedProductRes, 'data.products[0]', {});
          const courseIdFromProduct = get(fetchedProduct, 'course.id', '');

          if (campaignType === 'purchase') {
            const salesOperationsRes = await callLocalGraphqlApi(fetchSalesOperations(clientId, courseIdFromProduct));
            const salesOperations = get(salesOperationsRes, 'data.salesOperations', []);
            hasPaid = salesOperations.length > 0;
          }

          const userMerchantsRes = await callLocalGraphqlApi(fetchUserMerchantsQuery(phoneQuery, emailQuery));
          // console.log('userMerchantsRes', userMerchantsRes)
          const userMerchantsFound = get(userMerchantsRes, 'data.userMerchants', []);
          // console.log('userMerchantsFound',userMerchantsFound)
          if (userMerchantsFound.length > 0) {
            log(`User found in User Merchant collection with id ${get(userMerchantsFound, '[0].id', '')}.`);
            userPresentInUserMerchantCollection = true;
            userMerchantCreatedId = get(userMerchantsFound, '[0].id', '');
          }
        }
        if (!userPresentInUserMerchantCollection) {
          // add to userMerchant collection
          const addUserMerchantRes = await callLocalGraphqlApi(addUserMerchant(get(req, 'query', {})));
          userMerchantCreatedId = get(addUserMerchantRes, 'data.addUserMerchant.id', '');
          log(`Added user merchant of id ${userMerchantCreatedId}`);
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
  } catch (err) {
    log('Error thrown.');
  }
  // update userMerchant doc with status for logging in below conditions.
  // status accepted/declined
  if (campaignType === 'purchase' && hasPaid) {
    proceedWithPayment = false;
    message = 'User has already purchased this course.';
  } else if (campaignType === 'booking' && userExists) {
    proceedWithPayment = false;
    message = 'User has already booked this session from before.';
  }

  if (!proceedWithPayment) {
    try {
      const input = `{
        statusLog: "declined"
      }`;
      await callLocalGraphqlApi(updateUserMerchant(userMerchantCreatedId, input));
      log(`Updated userMerchant of id ${userMerchantCreatedId}`);
    } catch (err) {
      // console.log(err);
      log(`Err while updating userMerchant of id ${userMerchantCreatedId}`);
    }
  } else {
    try {
      const input = `{
        statusLog: "accepted"
      }`;
      await callLocalGraphqlApi(updateUserMerchant(userMerchantCreatedId, input));
      log(`Updated userMerchant of id ${userMerchantCreatedId}`);
    } catch (err) {
      // console.log(err);
      log(`Err while updating userMerchant of id ${userMerchantCreatedId}`);
    }
  }

  const objectToReturn = {};
  if (proceedWithPayment) {
    objectToReturn.userId = userMerchantCreatedId;
  }
  objectToReturn.proceedWithPayment = proceedWithPayment;
  objectToReturn.message = message;

  // reply to caller
  if (!foundError) {
    res.json(objectToReturn);
  }
};

/*
  paymentStatus endpoint
  query parameters - amount, couponCode, productId, userId
  response - isAmountValid: true/false
*/

const paymentStatus = async (req, res) => {
  const digest = getHashDigest(req.query);
  log(`digest ${digest}`);
  let foundError = false;
  let isAmountValid = false;
  let pmtStatus = true;
  let message = '';
  let discount = 0;
  let merchantPrice = 0;
  let productPriceAmountGlobal = 0;
  try {
    if (digest === req.headers['x-tekie-signature']) {
      log('Request is Authorized');
      // process it further
      const productIdQuery = get(req, 'query.productId', '');
      const amountQuery = get(req, 'query.amount', 0);
      const discountCodeQuery = get(req, 'query.discountCode', '');
      const transactionId = get(req, 'query.transactionId', '');
      const userMerchantIdQuery = get(req, 'query.userId', '');

      // check if userMerchant document is present and paymentStatus is not paid
      const userMerchantsRes = await callLocalGraphqlApi(fetchUserMerchantsQuery('', '', userMerchantIdQuery));
      const userMerchantsFound = get(userMerchantsRes, 'data.userMerchants', []);

      // check if payment status is paid, then we send false
      let isPaymentStatusPaid = false;
      const userMerchantDocFound = userMerchantsFound.length > 0;
      if (userMerchantDocFound && get(userMerchantsFound, '[0].paymentStatus', false)) {
        isPaymentStatusPaid = true;
      }
      // if not paid already, we check if amount is valid,
      // if amount is valid, then we can change payment status to paid on our end
      if (!isPaymentStatusPaid) {
        // if inputs are present
        if (productIdQuery && amountQuery) {
          log('productId & amount sent in query.');
          const productsRes = await callLocalGraphqlApi(fetchProductsQuery(productIdQuery));
          const productsFound = get(productsRes, 'data.products', []);
          if (productsFound.length === 1) {
            log('Product found.');
            let productPriceAmount = get(productsFound, '[0].price.amount', 0);
            merchantPrice = productPriceAmount;
            log(`productPriceAmount ${productPriceAmount}`);
            // if discount code is passed in params
            if (discountCodeQuery) {
              const additionalFilter = `{code: "${discountCodeQuery}"}`;
              const discountRes = await callLocalGraphqlApi(fetchDiscounts(productIdQuery, additionalFilter));
              const discountsFound = get(discountRes, 'data.discounts', []);

              // if discount document is found
              if (discountsFound.length === 1) {
                const discountExpiryDateString = get(discountsFound, '[0].expiryDate', '');
                const discountExpiryDate = new Date(discountExpiryDateString);
                const today = new Date();

                // if code has not expired
                if (!dateInPast(discountExpiryDate, today)) {
                  log('discount not expired');
                  const discountPercentage = get(discountsFound, '[0].percentage', '');
                  log('discountPercentage', discountPercentage);
                  discount = Math.round(productPriceAmount * discountPercentage * 0.01);
                  productPriceAmount -= discount;
                  productPriceAmount = Math.round((productPriceAmount + Number.EPSILON) * 100) / 100;
                }
              }
            }

            productPriceAmountGlobal = productPriceAmount;

            log(`productPriceAmount ${productPriceAmount}`);
            log(`Absolute difference in price ${Math.abs(productPriceAmount - Number.parseInt(amountQuery))}`);
            if (Math.abs(productPriceAmount - Number.parseInt(amountQuery)) <= 2) {
              isAmountValid = true;
            }
          }
        } else {
          // send bad request error
          foundError = true;
          res.status(400).send('Valid product id or amount not found');
        }
        if (isAmountValid) {
          // we save payment Status to true and update user merchant doc with the status and transaction id
          try {
            const input = `{
              merchantTransactionId: "${transactionId}"
              paymentStatus: true
              merchantPrice: ${merchantPrice}
              merchantDiscountPrice: ${discount}
              merchantSellingPrice: ${productPriceAmountGlobal}
            }`;
            await callLocalGraphqlApi(updateUserMerchant(userMerchantIdQuery, input));
            log(`Updated user merchant doc ${userMerchantIdQuery} with transaction id ${transactionId}`);
          } catch (err) {
            // console.log(err)
            log('Error on updating user merchant.');
          }
        } else {
          message = 'Amount is invalid.';
          pmtStatus = false;
        }
      } else {
        message = 'User has already purchased this course.';
        pmtStatus = false;
      }
    } else {
      foundError = true;
      res.status(401).send('Unauthorized');
    }
  } catch (err) {
    // console.log(err);
    log('Error thrown.');
  }
  // reply to caller
  if (!foundError) {
    res.json({
      allowPayment: isAmountValid && pmtStatus,
      message,
    });
  }
};

/*
  verifyPaymentStatus endpoint
  query parameters - amount, couponCode, productId, userId, status
  response - isAmountValid: true/false ??
*/

const verifyPaymentStatus = async (req, res) => {
  const digest = getHashDigest(req.query);
  log(`digest ${digest}`);
  let foundError = false;
  let isAmountValid = true;
  let pmtStatus = true;
  let message = '';
  let discount = 0;
  let merchantPrice = 0;
  let productPriceAmountGlobal = 0;
  try {
    if (digest === req.headers['x-tekie-signature']) {
      log('Request is Authorized');
      // process it further
      const productIdQuery = get(req, 'query.productId', '');
      const amountQuery = get(req, 'query.amount', 0);
      const discountCodeQuery = get(req, 'query.discountCode', '');
      const transactionId = get(req, 'query.transactionId', '');
      const userMerchantIdQuery = get(req, 'query.userId', '');

      // check if userMerchant document is present and paymentStatus is not paid
      const userMerchantsRes = await callLocalGraphqlApi(fetchUserMerchantsQuery('', '', userMerchantIdQuery));

      let isPaymentStatusPaid = false;
      const userMerchantsFound = get(userMerchantsRes, 'data.userMerchants', []);
      const userMerchantDocFound = userMerchantsFound.length === 1;
      if (userMerchantDocFound && get(userMerchantsFound, '[0].paymentStatus', false)) {
        isPaymentStatusPaid = true;
      }

      if (!isPaymentStatusPaid) {
        // if inputs are present
        if (productIdQuery && amountQuery) {
          log('productId & amount sent in query.');
          const productsRes = await callLocalGraphqlApi(fetchProductsQuery(productIdQuery));
          const productsFound = get(productsRes, 'data.products', []);
          if (productsFound.length === 1) {
            log('Product found.');
            let productPriceAmount = get(productsFound, '[0].price.amount', 0);
            merchantPrice = productPriceAmount;
            log(`productPriceAmount ${productPriceAmount}`);
            // if discount code is passed in params
            if (discountCodeQuery) {
              const additionalFilter = `{code: "${discountCodeQuery}"}`;
              const discountRes = await callLocalGraphqlApi(fetchDiscounts(productIdQuery, additionalFilter));
              const discountsFound = get(discountRes, 'data.discounts', []);

              // if discount document is found
              if (discountsFound.length === 1) {
                const discountExpiryDateString = get(discountsFound, '[0].expiryDate', '');
                const discountExpiryDate = new Date(discountExpiryDateString);
                const today = new Date();

                // if code has not expired
                if (!dateInPast(discountExpiryDate, today)) {
                  log('discount not expired');
                  const discountPercentage = get(discountsFound, '[0].percentage', '');
                  log('discountPercentage', discountPercentage);
                  discount = Math.round(productPriceAmount * discountPercentage * 0.01);
                  productPriceAmount -= discount;
                  productPriceAmount = Math.round((productPriceAmount + Number.EPSILON) * 100) / 100;
                }
              }
            }

            productPriceAmountGlobal = productPriceAmount;

            log(`productPriceAmount ${productPriceAmount}`);

            if (Math.abs(productPriceAmount - Number.parseInt(amountQuery)) > 2) {
              isAmountValid = false;
            }
          }
        } else {
          // send bad request error
          foundError = true;
          res.status(400).send('Valid product id or amount not found');
        }
        // if amount passed is valid
        if (isAmountValid) {
          // we save payment Status to true and update user merchant doc with the status and transaction id
          try {
            const input = `{
              merchantTransactionId: "${transactionId}"
              paymentStatus: true
              merchantPrice: ${merchantPrice}
              merchantDiscountPrice: ${discount}
              merchantSellingPrice: ${productPriceAmountGlobal}
            }`;
            await callLocalGraphqlApi(updateUserMerchant(userMerchantIdQuery, input));
            log(`Updated user merchant doc ${userMerchantIdQuery} with transaction id ${transactionId}`);
          } catch (err) {
            log('Error on updating user merchant.');
          }
        } else {
          message = 'Amount is invalid.';
          pmtStatus = false;
        }
      } else {
        message = 'Payment is validated.';
      }
    } else {
      foundError = true;
      res.status(401).send('Unauthorized');
    }
  } catch (err) {
    log('Error thrown.');
  }

  // console.log('isAmountValid', isAmountValid);
  // console.log('pmtStatus', pmtStatus);

  // reply to caller
  if (!foundError) {
    res.json({
      isPaid: isAmountValid && pmtStatus,
      message,
    });
  }
};

const phonePeController = {};
phonePeController.fetchProducts = fetchProducts;
phonePeController.fetchUsers = fetchUsers;
phonePeController.paymentStatus = paymentStatus;
phonePeController.verifyPaymentStatus = verifyPaymentStatus;

export default phonePeController;
