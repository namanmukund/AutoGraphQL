import { get, cloneDeep } from 'lodash';
import jsSHA from 'jssha';
import moment from 'moment';
import {
  DatabaseRecordNotFoundError,
  ProductIdNotPresentError, UnauthenticatedUserError,
} from '../../../../../../constants/errors';
import getUserIdandAppNameAfterValidation
  from '../../../preHookFunctions/validation/utils/getUserIdandAppNameAfterValidation';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { MENTEE } from '../../../../../../constants/roles';
import payUConfig from '../../../../../../config/payment/payUConfig';
import {
  enrollmentTypes, GIFT_VOUCHER_AMOUNT, GLOBAL_COURSE_TITLE, PUBLISHED,
} from '../../../../../../constants';
import referralCredits from '../../../../../../constants/referralCredits';
import updateReferrerCreditsPostSessionOrUserPayment
  from '../../../postHookFunctions/utils/updateReferrerCreditsPostSessionOrUserPayment';
import { COURSE_PURCHASED } from '../../../../../../constants/userCreditReason';
import { log } from '../../../../../../utils';
import { sendEmailInvoiceToUser } from '../utils/sendEmailInvoiceToUser';
import updateUserCreditsCount from '../user/utils/updateUserCreditsCount';
import { addZeroes } from '../utils/addZeroesToANumber';

// query to get user info of current user
const getUserInfo = (userId) => `
  query{
    user(id: "${userId}"){
      id
      role
      name
      email
      fromReferral
      giftVoucherApplied
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
const getDiscountInfo = (code, productId) => `
  query{
    discounts(filter:{
      and:[
        {code: "${code}"},
        {product_some:{
          id:"${productId}"
        }}
      ]
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
  creditsUsed,
  discountConnectIdQuery,
  isDiscountUsedQuery,
  discountAmountQuery,
) => `
  mutation{
    addUserPayment(
    userConnectId: "${userId}"
    productConnectId: "${productId}"
    ${discountConnectIdQuery}
    input:{
      amount: ${amount}
      status: "Initiated"
      creditsUsed: ${creditsUsed}
      ${isDiscountUsedQuery}
      ${discountAmountQuery}
    }){
      id
    }
  }
  `;

// query to get discount info
const getUserCredits = (userId) => `
  query{
    userCredits(filter:{
      user_some:{id: "${userId}"}
    }){
      id
      credits
    }
  }
  `;

// query to get current component status of user
const getUserCurrentTopicComponentStatus = (userId) => `
  query{
    userCurrentTopicComponentStatuses(filter:{
      and:[
        {user_some:{
        id:"${userId}"
        }},
      {currentCourse_some:{
        and:[
          {status: ${PUBLISHED}},
          {title: "${GLOBAL_COURSE_TITLE}"}
        ]
      }}
      ]
    }){
      id
      enrollmentType
    }
  }
  `;

// mutation to update UserPayment
const updateUserPayment = (
  id,
  status,
  payuMoneyId,
) => `
  mutation{
    updateUserPayment(id:"${id}",input:{
      status: "${status}"
      invoiceId: "${payuMoneyId}"
    }){
      id
    }
  }
  `;

// mutation to update UserPayment
const updateUserCurrentTopicComponentStatus = (
  id,
) => `
  mutation{
    updateUserCurrentTopicComponentStatus(
    id: "${id}",
    input:{
      enrollmentType: ${enrollmentTypes.pro}
    }
    ){
      id
    }
  }
  `;

// mutation to update user giftVoucherApplied
const updateUserGiftVoucher = (
  userId,
) => `
  mutation{
    updateUser(id:"${userId}",input:{
      giftVoucherApplied: true
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
  const { productId, discountCode, isCreditUsed } = params;

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
    payload.countryCode = get(userInfo, 'studentProfile.parents[0].user.phone.countryCode', '');
    payload.phoneNumber = get(userInfo, 'studentProfile.parents[0].user.phone.number', '');
    payload.parentName = get(userInfo, 'studentProfile.parents[0].user.name', '');
  } else {
    payload.email = get(userInfo, 'email', '');
    payload.phone = get(userInfo, 'phone', '');
  }

  // getting productInfo and phone from product
  payload.productInfo = get(productInfo, 'title', '');
  let amount = get(productInfo, 'price.amount', 0);
  amount = Math.round((amount + Number.EPSILON) * 100) / 100;
  amount = addZeroes(amount);
  payload.amount = amount;

  // calculate discounted amount if user has passed discount coupon
  let discountConnectIdQuery = '';
  let isDiscountUsedQuery = '';
  let discountAmountQuery = '';
  let discount = 0;
  if (discountCode) {
    const discountRes = await callLocalGraphqlApi(
      getDiscountInfo(discountCode, productId),
      context,
      '',
    );

    const discountInfo = get(discountRes, 'data.discounts[0]');
    if (discountInfo && discountInfo.percentage && discountInfo.expiryDate > new Date()) {
      discount = Math.round(payload.amount * discountInfo.percentage * 0.01);
      let discountedAmount = payload.amount - discount;
      discountedAmount = Math.round((discountedAmount + Number.EPSILON) * 100) / 100;
      discountedAmount = addZeroes(discountedAmount);
      discount = addZeroes(discount);
      if (discountedAmount > 0) {
        payload.amount = discountedAmount;
        discountAmountQuery = `discountAmount: ${discount}`;
        isDiscountUsedQuery = 'isDiscountUsed: true';
        discountConnectIdQuery = `discountConnectId : "${discountInfo.id}"`;
      }
    }
  }
  payload.discount = discount;

  const fromReferral = get(userInfo, 'fromReferral', '');
  const giftVoucherApplied = get(userInfo, 'giftVoucherApplied', '');
  let userCreditToAvail = 0;
  const userCreditRes = await callLocalGraphqlApi(
    getUserCredits(userId),
    context,
    '',
  );

  const userCreditAmount = get(userCreditRes, 'data.userCredits[0].credits');

  if (fromReferral && !giftVoucherApplied) {
    payload.amount -= GIFT_VOUCHER_AMOUNT;
    payload.discount = Number(payload.discount) + Number(GIFT_VOUCHER_AMOUNT);
  }

  if (isCreditUsed && userCreditAmount > 0 && payload.amount > 0) {
    if (payload.amount >= userCreditAmount) {
      userCreditToAvail = userCreditAmount;
      payload.amount -= userCreditToAvail;
    } else {
      /* eslint radix:0 */
      userCreditToAvail = parseInt(payload.amount);
      payload.amount -= userCreditToAvail;
    }
  }
  payload.discount = Number(payload.discount) + Number(userCreditToAvail);
  payload.discount = addZeroes(payload.discount);

  if (payload.amount < 0) payload.amount = 0;
  payload.amount = addZeroes(payload.amount);

  //  generate userPayment document and gets it's id, we will use it as txnId
  const addUserPaymentRes = await callLocalGraphqlApi(addUserPayment(
    userId,
    productId,
    payload.amount,
    userCreditToAvail,
    discountConnectIdQuery,
    isDiscountUsedQuery,
    discountAmountQuery,
  ));

  const txnId = get(addUserPaymentRes, 'data.addUserPayment.id');
  payload.txnId = txnId;

  const hashString = `${payUConfig.payUKey}|${payload.txnId}|${payload.amount}|${payload.productInfo}|${payload.firstName}|${payload.email}|`
      + `||||||||||${payUConfig.payUSalt}`;

  /* eslint new-cap:0 */
  const sha = new jsSHA('SHA-512', 'TEXT');
  sha.update(hashString);
  const hash = sha.getHash('HEX');
  payload.hash = hash;

  // if the amount is less than 1 we will not send the user to payU
  // we will update the data on successful response here only
  if (payload.amount < 1) {
    const res = await callLocalGraphqlApi(
      getUserCurrentTopicComponentStatus(userId),
      context,
      '',
    );

    const currentTopicComponentInfoId = get(res, 'data.userCurrentTopicComponentStatuses[0].id');

    if (!currentTopicComponentInfoId) {
      throw new DatabaseRecordNotFoundError({
        data: {
          error: `UserCurrentTopicComponentStatus: is not present for userId: ${userId}`,
        },
      });
    }

    // update UserCurrentTopicComponentStatus, change user to pro
    await callLocalGraphqlApi(updateUserCurrentTopicComponentStatus(
      currentTopicComponentInfoId,
    ));
    const payuMoneyId = '00000';
    // update status of userPayment document
    await callLocalGraphqlApi(updateUserPayment(
      txnId,
      'success',
      payuMoneyId,
    ));

    // update referrer credits as per referral program
    try {
      const variables = {
        input: {
          coursePurchased: true,
          coursePurchasedDate: new Date().toISOString(),
        },
      };
      const { coursePurchased } = referralCredits[1];

      await updateReferrerCreditsPostSessionOrUserPayment(userId, coursePurchased, context, variables, COURSE_PURCHASED);
      if (userCreditToAvail > 0) {
        await updateUserCreditsCount(userCreditToAvail, userId, 'dec', COURSE_PURCHASED);
      }
      // update user document for isGiftVoucherUsed, change user to pro
      await callLocalGraphqlApi(updateUserGiftVoucher(
        userId,
      ));
    } catch (e) {
      log('Error in updateReferrerCreditsPostUserPayment in getPaymentRequest', e);
    }

    const emailPayload = cloneDeep(payload);
    emailPayload.coursePrice = get(productInfo, 'price.amount', 0);
    emailPayload.payuMoneyId = payuMoneyId;
    emailPayload.paymentDate = moment(new Date()).format('ll');

    // Send invoice to customer on mail
    sendEmailInvoiceToUser(emailPayload);
  }

  return payload;
};

export default getPaymentRequestMutationResolver;
