import { get } from 'lodash';
import jsSHA from 'jssha';
import moment from 'moment';
import {
  DatabaseRecordNotFoundError, HashOrStatusNotPresentError,
  TransactionIdNotPresentError, UnauthenticatedUserError,
} from '../../../../../../constants/errors';
import getUserIdandAppNameAfterValidation
  from '../../../preHookFunctions/validation/utils/getUserIdandAppNameAfterValidation';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { MENTEE } from '../../../../../../constants/roles';
import payUConfig from '../../../../../../config/payment/payUConfig';
import { GLOBAL_COURSE_TITLE, PUBLISHED, enrollmentTypes } from '../../../../../../constants';
import { log } from '../../../../../../utils';
import parsedHtmlFromTemplateFileAndObject
  from '../../../../../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import getEmailObject from '../../../../../../services/email/utils/getEmailObject';
import sendEmail from '../../../../../../services/email/utils/sendEmail';

// query to get user paayment info for id
const getUserPayment = (id) => `
  query{
    userPayment(id:"${id}"){
      id
      amount
      discountAmount
      user{
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
      product{
        title
      }
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
          {title: ${GLOBAL_COURSE_TITLE}}
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

const addZeroes = (num) => {
// Convert input string to a number and store as a variable.
  let value = Number(num);
  // Split the input string into two arrays containing integers/decimals
  const res = num && num.toString() && num.toString().split('.');
  // If there is no decimal point or only one decimal place found.
  if (res && (res.length === 1 || res[1].length < 3)) {
    // Set the number to two decimal places
    value = value && value.toFixed(2);
  }
  // Return updated or original number.
  return value;
};

const sendEmailInvoiceToUser = (payload) => {
  const subject = 'Payment Receipt from Tekie';
  const templateFileName = 'paymentInvoiceEmailTemplate';
  const templateString = parsedHtmlFromTemplateFileAndObject(templateFileName, payload);
  templateString.then((html) => {
    // email to should be in array. Can send the mail to mutiple people
    let emailTo;
    // send email in case a session is booked/updated/deleted
    if (process.env.NODE_ENV === 'production') {
      emailTo = [
        payload.email,
      ];
    } else {
      emailTo = [
        'kriteshpk@gmail.com',
        'naman.mukund@tekie.in',
      ];
    }

    // ccemail should be in array. Can send the mail to mutiple people
    const ccEmail = [''];
    // bccemail should be in array. Can send the mail to mutiple people
    const bccEmail = [''];

    const text = 'Payment Receipt';
    /* if html is empty then in the body text will be appear. Html is having higher
     precedence over text */

    const emailMsgObject = getEmailObject(
      emailTo,
      ccEmail,
      bccEmail,
      subject,
      text,
      html,
      'hello@tekie.in',
    );
    sendEmail(emailMsgObject);
  });
};

/*
  This is called when user gets hash in response of payU
  It will return true/false depending upon whether hash from payU matches to hash we sent in request
  This checks for man in the middle attack
*/
const getPaymentResponseMutationResolver = async (
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

  // check if user has passed transaction id and hash value
  const {
    id, hash, status, payuMoneyId,
  } = params;

  // throwing error if we do not get transaction id
  if (!id || !payuMoneyId) {
    throw new TransactionIdNotPresentError();
  }

  // throwing error if we do not get transaction id
  if (!hash || !status) {
    throw new HashOrStatusNotPresentError();
  }

  // throwing error if we do not get user info
  if (!userId) {
    throw new UnauthenticatedUserError();
  }

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

  const userPaymentRes = await callLocalGraphqlApi(
    getUserPayment(id),
    context,
    '',
  );

  const userPaymentInfo = get(userPaymentRes, 'data.userPayment');

  if (!userPaymentInfo) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: `User Payment is not present for the txnId: ${id}`,
      },
    });
  }

  const payload = {};
  // get firstName, email, phone from user object based on it's role
  payload.firstName = get(userPaymentInfo, 'user.name', '');
  if (userPaymentInfo.user && userPaymentInfo.user.role === MENTEE) {
    payload.email = get(userPaymentInfo, 'user.studentProfile.parents[0].user.email', '');
    payload.phone = get(userPaymentInfo, 'user.studentProfile.parents[0].user.phone', '');
    payload.countryCode = get(userPaymentInfo, 'user.studentProfile.parents[0].user.phone.countryCode', '');
    payload.phoneNumber = get(userPaymentInfo, 'user.studentProfile.parents[0].user.phone.number', '');
    payload.parentName = get(userPaymentInfo, 'user.studentProfile.parents[0].user.name', '');
  } else {
    payload.email = get(userPaymentInfo, 'user.email', '');
    payload.phone = get(userPaymentInfo, 'user.phone', '');
  }

  // getting productInfo
  payload.productInfo = get(userPaymentInfo, 'product.title', '');

  let amount = get(userPaymentInfo, 'amount', 0);
  amount = Math.round((amount + Number.EPSILON) * 100) / 100;
  amount = addZeroes(amount);
  payload.amount = amount;

  let discount = get(userPaymentInfo, 'discountAmount', 0);
  if (discount) {
    discount = Math.round((discount + Number.EPSILON) * 100) / 100;
    discount = addZeroes(discount);
    payload.discount = discount;
  }
  const coursePrice = Number(amount) + Number(discount);

  payload.coursePrice = addZeroes(coursePrice)

  payload.txnId = id;

  payload.payuMoneyId = payuMoneyId;

  payload.paymentDate = moment(new Date()).format('ll');

  // update status of userPayment document
  await callLocalGraphqlApi(updateUserPayment(
    id,
    status,
    payuMoneyId,
  ));

  log(`Status for txnId: ${id} is: ${status}`);
  log(`PayUMoney Id for txnId: ${id} is: ${payuMoneyId}`);

  const hashString = `${payUConfig.payUSalt}|${status}|||||||||||${payload.email}|${payload.firstName}|${payload.productInfo}|${payload.amount}|${payload.txnId}|`
      + `${payUConfig.payUKey}`; // Your salt value

  /* eslint new-cap:0 */
  const sha = new jsSHA('SHA-512', 'TEXT');
  sha.update(hashString);
  const hashToBeMatched = sha.getHash('HEX');

  let response = false;

  if (hashToBeMatched === hash && status === 'success') {
    log(`Hash matched for userId: ${userId}`);
    response = true;
    // update UserCurrentTopicComponentStatus, change user to pro
    await callLocalGraphqlApi(updateUserCurrentTopicComponentStatus(
      currentTopicComponentInfoId,
    ));

    // Send invoice to customer on mail
    sendEmailInvoiceToUser(payload);
  }

  return {
    result: response,
  };
};

export default getPaymentResponseMutationResolver;
