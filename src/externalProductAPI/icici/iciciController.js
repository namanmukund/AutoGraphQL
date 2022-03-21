/* eslint-disable radix */
/* eslint-disable no-unused-vars */
import { get } from 'lodash';
import convertToDate from '../convertToDate';
import config from '../../../config/iciciAPI';
import { log, dateInPast } from '../../../utils';
import callLocalGraphqlApi from '../../api/callLocalGraphqlApi';
import createToken from '../../auth/createToken';
import verifyToken from '../../auth/verifyToken';
import addUserMerchant from '../mutation/addUserMerchant';
import updateUserMerchant from '../mutation/updateUserMerchant';
import fetchUserMerchantsQuery from '../query/fetchUserMerchants';
import fetchDiscounts from '../query/fetchDiscounts';
import fetchProductsQuery from '../query/fetchProducts';

const generateToken = async (req, res) => {
  const { body } = req;
  const username = get(body, 'username');
  const password = get(body, 'password');

  if (!username || !password || username !== config.username || password !== config.password) {
    res.status(400).send('Incorrect password/username');
  }

  const token = createToken(
    {
      id: password,
      username,
    },
    {
      app: 'TBA',
    },
    null,
    true,
  );

  res.json({
    token,
  });
};

const paymentStatus = async (req, res) => {
  const {
    headers,
    body: {
      Name,
      Email,
      MobileNo,
      City,
      State,
      Pincode,
      DateofJoin,
      IsLead,
      ProductServiceID,
      ESPProductID,
      ProductName,
      Price,
      DateofPurchase,
    },
  } = req;

  if (!headers.authorization || !headers.authorization.startsWith('Bearer ')) {
    res.status(400).send('Token not found.');
  }

  const token = headers.authorization.split('Bearer ');

  if (!verifyToken(token[1], true)) {
    res.status(400).send('Invalid token');
  }

  if (!(Name && Email && MobileNo && City && State && Pincode)) {
    res.status(400).send('Mandatory fields not passed.');
  }

  const input = {
    parentName: Name,
    email: Email,
    phone: MobileNo,
    productId: ESPProductID,
    status: IsLead === 'No',
    city: City,
    state: State,
    pincode: Pincode,
    joiningDate: convertToDate(DateofJoin),
    externalProductId: ProductServiceID,
    productName: ProductName,
    merchantSellingPrice: Price,
    purchaseDate: convertToDate(DateofPurchase),
  };

  // check if userMerchant document is present and paymentStatus is not paid
  const userMerchantsRes = await callLocalGraphqlApi(fetchUserMerchantsQuery(MobileNo, Email));
  const userMerchantsFound = get(userMerchantsRes, 'data.userMerchants', []);
  let isAmountValid = false;
  let pmtStatus = true;
  let message = '';
  // let discount = 0;
  // let merchantPrice = 0;
  // let productPriceAmountGlobal = 0;

  // check if payment status is paid, then we send false
  let isPaymentStatusPaid = false;
  const userMerchantDocFound = userMerchantsFound.length > 0;
  if (userMerchantDocFound && get(userMerchantsFound, '[0].paymentStatus', false)) {
    isPaymentStatusPaid = true;
  }
  const userMerchantId = get(userMerchantsFound, '[0].id');
  // if not paid already, we check if amount is valid,
  // if amount is valid, then we can update the leadStatus according to the given input
  if ((!isPaymentStatusPaid && (IsLead === 'No')) || (IsLead === 'Yes')) {
    // if inputs are present
    if (ESPProductID && Price) {
      log('productId & amount sent in query.');
      const productsRes = await callLocalGraphqlApi(fetchProductsQuery(ESPProductID));
      const productsFound = get(productsRes, 'data.products', []);
      if (productsFound.length === 1) {
        log('Product found.');
        const productPriceAmount = get(productsFound, '[0].price.amount', 0);
        // merchantPrice = productPriceAmount;

        // log(`productPriceAmount ${productPriceAmount}`);
        // if discount code is passed in params
        // if (discountCodeQuery) {
        //   const additionalFilter = `{code: "${discountCodeQuery}"}`;
        //   const discountRes = await callLocalGraphqlApi(fetchDiscounts(ESPProductID, additionalFilter));
        //   const discountsFound = get(discountRes, 'data.discounts', []);

        //   // if discount document is found
        //   if (discountsFound.length === 1) {
        //     const discountExpiryDateString = get(discountsFound, '[0].expiryDate', '');
        //     const discountExpiryDate = new Date(discountExpiryDateString);
        //     const today = new Date();

        //     // if code has not expired
        //     if (!dateInPast(discountExpiryDate, today)) {
        //       log('discount not expired');
        //       const discountPercentage = get(discountsFound, '[0].percentage', '');
        //       log('discountPercentage', discountPercentage);
        //       discount = Math.round(productPriceAmount * discountPercentage * 0.01);
        //       productPriceAmount -= discount;
        //       productPriceAmount = Math.round((productPriceAmount + Number.EPSILON) * 100) / 100;
        //     }
        //   }
        // }

        // productPriceAmountGlobal = productPriceAmount;

        log(`productPriceAmount ${productPriceAmount}`);
        log(`Absolute difference in price ${Math.abs(productPriceAmount - Number.parseInt(Price))}`);
        if (Math.abs(productPriceAmount - Number.parseInt(Price)) <= 2) {
          isAmountValid = true;
        }
      } else {
        res.status(400).send('Valid product id not found');
      }
    } else {
      // send bad request error
      res.status(400).send('Valid product id or amount not found');
    }
    if (isAmountValid && userMerchantDocFound) {
      // update user merchant doc with the status and transaction id
      try {
        await callLocalGraphqlApi(updateUserMerchant(userMerchantId, input));
        log(`Updated user merchant doc ${userMerchantId}`);
      } catch (err) {
        log('Error on updating user merchant.');
      }
    } else if (isAmountValid && !userMerchantDocFound) {
      // if user merchant doc is not found, add it
      if (!userMerchantDocFound) {
        const addUserMerchantRes = await callLocalGraphqlApi(addUserMerchant(input));
        const userMerchantCreatedId = get(addUserMerchantRes, 'data.addUserMerchant.id', '');
        log(`Added user merchant of id ${userMerchantCreatedId}`);
      }
    } else {
      message = 'Amount is invalid.';
      pmtStatus = false;
    }
  } else {
    message = 'User has already purchased this course.';
    pmtStatus = false;
  }

  if (!pmtStatus) {
    res.status(400).send(message);
  } else {
    res.json({
      status: 'success',
      statuscode: 200,
      data: {
        name: Name,
        email: Email,
        mobile_number: MobileNo,
        city: City,
        state: State,
        pincode: Pincode,
        date_of_join: DateofJoin,
        is_lead: IsLead,
        product_service_id: ProductServiceID,
        esp_product_id: ESPProductID,
        product_name: ProductName,
        price: Price,
        date_of_purchase: DateofPurchase,
      },
    });
  }
};

const iciciController = {};
iciciController.generateToken = generateToken;
iciciController.paymentStatus = paymentStatus;

export default iciciController;
