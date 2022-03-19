/* eslint-disable no-unused-vars */
import { get } from 'lodash';
import convertToDate from '../convertToDate';
import config from '../../../config/iciciAPI';
import { log } from '../../../utils';
import callLocalGraphqlApi from '../../api/callLocalGraphqlApi';
import createToken from '../../auth/createToken';
import verifyToken from '../../auth/verifyToken';
import addUserMerchant from '../mutation/addUserMerchant';

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

  if (!headers.authorization || !headers.authorization.includes('Bearer ')) {
    res.status(400).send('Token not found.');
  }

  const token = headers.authorization.split('Bearer ');

  if (verifyToken(token[1], true)) {
    res.status(400).send('Invalid token');
  }

  if (!(Name && Email && MobileNo && City && State && Pincode)) {
    res.status(400).send('Mandatory fields not passed.');
  }

  const input = {
    name: Name,
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

  // TODO : validate product id, as well as existing user check

  const addUserMerchantRes = await callLocalGraphqlApi(addUserMerchant(input));
  const userMerchantCreatedId = get(addUserMerchantRes, 'data.addUserMerchant.id', '');
  log(`Added user merchant of id ${userMerchantCreatedId}`);

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
};

const iciciController = {};
iciciController.generateToken = generateToken;
iciciController.paymentStatus = paymentStatus;

export default iciciController;
