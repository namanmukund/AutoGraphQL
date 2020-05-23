import { get } from 'lodash';
import jsSHA from 'jssha';
import {
  DatabaseRecordNotFoundError,
  ProductIdNotPresentError, UnauthenticatedUserError,
} from '../../../../../../constants/errors';
import getUserIdandAppNameAfterValidation
  from '../../../preHookFunctions/validation/utils/getUserIdandAppNameAfterValidation';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { MENTEE } from '../../../../../../constants/roles';
import payUConfig from '../../../../../../config/payment/payUConfig';

// query to get user info of current user
const getUserInfo = (userId) => `
  query{
    user(id: "${userId}"){
      id
      role
      name
      email
      phone{
        countryCode
        number
      }
      studentProfile{
        id
        parents{
          id
          user{
            id
            name
            phone{
              number
              countryCode
            }
            email
          }
        }
      }
    }
  }
  `;

// query to get product info
const getProductInfo = (productId) => `
  query{
    product(id:"${productId}"){
      id
      title
      price{
        amount
        currency
      }
    }
  }
  `;

// query to get discount info
const getDiscountInfo = (code) => `
  query{
    discounts(filter:{
      code: "${code}"
    }){
      id
      percentage
      expiryDate
    }
  }
  `;

// mutation to add UserPayment
const addUserPayment = (
  userId,
  productId,
  amount,
  discountConnectIdQuery,
  isDiscountUsedQuery,
) => `
  mutation{
    addUserPayment(
    userConnectId: "${userId}"
    productConnectId: "${productId}"
    ${discountConnectIdQuery}
    input:{
      amount: ${amount}
      status: "Pending"
      ${isDiscountUsedQuery}
    }){
      id
    }
  }
  `;

/*
  This is called when user tries to buys a product
  It will return the hash for payU along with the other information which is
  needed in the request payload for payU. Here we are also calculating the amount after
  discount depending on discount coupon code
*/
const getPaymentRequestMutationResolver = async (
  root,
  params,
  typeName,
  info,
  mutationName,
  ast,
  context,
) => {
  /*
  Calling method to validate token and return userId.
  we will compare this userId against userId passed in input
  both should be equal to perform further action
  */
  const userAndAppInfo = getUserIdandAppNameAfterValidation(context, true);
  const {
    userIdFromContext: userId,
  } = userAndAppInfo;

  // check if user has passed product id
  const { productId, discountCode } = params;

  // throwing error if we do not get product id
  if (!productId) {
    throw new ProductIdNotPresentError();
  }

  // throwing error if we do not get user info
  if (!userId) {
    throw new UnauthenticatedUserError();
  }

  // we will return payload in response
  const payload = {};

  const userRes = await callLocalGraphqlApi(
    getUserInfo(userId),
    context,
    '',
  );

  const userInfo = get(userRes, 'data.user');

  if (!userInfo) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'User is not present',
      },
    });
  }

  const productRes = await callLocalGraphqlApi(
    getProductInfo(productId),
    context,
    '',
  );

  const productInfo = get(productRes, 'data.product');

  if (!productInfo) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'Product is not present',
      },
    });
  }

  // get firstName, email, phone from user object based on it's role
  payload.firstName = get(userInfo, 'name', '');
  if (userInfo.role === MENTEE) {
    payload.email = get(userInfo, 'studentProfile.parents[0].user.email', '');
    payload.phone = get(userInfo, 'studentProfile.parents[0].user.phone', '');
  } else {
    payload.email = get(userInfo, 'email', '');
    payload.phone = get(userInfo, 'phone', '');
  }

  // getting productInfo and phone from product
  payload.productInfo = get(productInfo, 'title', '');
  payload.amount = get(productInfo, 'price.amount', 0);

  // calculate discounted amount if user has passed discount coupon
  let discountConnectIdQuery = '';
  let isDiscountUsedQuery = '';

  if (discountCode) {
    const discountRes = await callLocalGraphqlApi(
      getDiscountInfo(discountCode),
      context,
      '',
    );

    const discountInfo = get(discountRes, 'data.discounts[0]');
    if (discountInfo && discountInfo.percentage && discountInfo.expiryDate > new Date()) {
      const discountedAmount = (payload.amount - (payload.amount * discountInfo.percentage * 0.01));
      if (discountedAmount > 0) {
        payload.amount = Math.round((discountedAmount + Number.EPSILON) * 100) / 100;
        isDiscountUsedQuery = 'isDiscountUsed: true';
        discountConnectIdQuery = `discountConnectId : "${discountInfo.id}"`;
      }
    }
  }

  //  generate userPayment document and gets it's id, we will use it as txnId
  const addUserPaymentRes = await callLocalGraphqlApi(addUserPayment(
    userId,
    productId,
    payload.amount,
    discountConnectIdQuery,
    isDiscountUsedQuery,
  ));
  const txnId = get(addUserPaymentRes, 'data.addUserPayment.id');
  payload.txnId = txnId;

  const hashString = `${payUConfig.payUKey}|${payload.txnId}|${payload.amount}|Bag123|${payload.firstName}|${payload.email}|`
      + `||||||||||${payUConfig.payUSalt}`;

  /* eslint new-cap:0 */
  const sha = new jsSHA('SHA-512', 'TEXT');
  sha.update(hashString);
  const hash = sha.getHash('HEX');
  payload.hash = hash;

  return payload;
};

export default getPaymentRequestMutationResolver;
