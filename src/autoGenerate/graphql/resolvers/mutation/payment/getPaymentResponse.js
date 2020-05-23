import { get } from 'lodash';
import jsSHA from 'jssha';
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

// query to get user paayment info for id
const getUserPayment = (id) => `
  query{
    userPayment(id:"${id}"){
      id
      amount
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
) => `
  mutation{
    updateUserPayment(id:"${id}",input:{
      status: "${status}"
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
    updateUserCurrentTopicComponentStatus(id:"${id}",input:{
      enrollmentType: "${enrollmentTypes.pro}"
    }){
      id
    }
  }
  `;

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
    id, hash, status, txnId,
  } = params;

  // throwing error if we do not get transaction id
  if (!id || !txnId) {
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
        error: 'UserCurrentTopicComponentStatus: is not present',
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
        error: 'User Payment is not present for the txnId',
      },
    });
  }

  const payload = {};
  // get firstName, email, phone from user object based on it's role
  payload.firstName = get(userPaymentInfo, 'user.name', '');
  if (userPaymentInfo.user && userPaymentInfo.user.role === MENTEE) {
    payload.email = get(userPaymentInfo, 'user.studentProfile.parents[0].user.email', '');
    payload.phone = get(userPaymentInfo, 'user.studentProfile.parents[0].user.phone', '');
  } else {
    payload.email = get(userPaymentInfo, 'user.email', '');
    payload.phone = get(userPaymentInfo, 'user.phone', '');
  }

  // getting productInfo
  payload.productInfo = get(userPaymentInfo, 'product.title', '');
  payload.amount = get(userPaymentInfo, 'amount', 0);
  payload.txnId = txnId;


  // update status of userPayment document
  await callLocalGraphqlApi(updateUserPayment(
    id,
    status,
  ));

  const hashString = `${payUConfig.payUSalt}|${status}|||||||||||${payload.email}|${payload.firstName}|Bag123|${payload.amount}|${payload.txnId}|`
      + `${payUConfig.payUKey}`; // Your salt value

  /* eslint new-cap:0 */
  const sha = new jsSHA('SHA-512', 'TEXT');
  sha.update(hashString);
  const hashToBeMatched = sha.getHash('HEX');

  let response = false;
  if (hashToBeMatched === hash) {
    response = true;
    // update UserCurrentTopicComponentStatus, change user to pro
    await callLocalGraphqlApi(updateUserCurrentTopicComponentStatus(
      currentTopicComponentInfoId,
    ));
  }

  return {
    result: response,
  };
};

export default getPaymentResponseMutationResolver;
