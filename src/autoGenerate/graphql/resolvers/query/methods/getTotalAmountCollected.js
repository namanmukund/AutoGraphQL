import { get } from 'lodash';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

// query to get sales operation to calculate payment amount
const getSalesOperationWonUsers = (filter) => `
  query{
      salesOperations(filter: ${filter}) {
        id
        userPaymentPlan {
          id
          finalSellingPrice
          userPaymentInstallments(orderBy: dueDate_ASC) {
            id
            amount
            status
          }
        }
      }
    }
  `;

/*
  This API will return total amount and total amount collected on the basis of filters in the query
*/
const getTotalAmountCollected = (async (root, params, context) => {
  validateAuthentication(context);
  // initializing mandatory filter to get the sales operation data
  let filter = '{and: [{leadStatus: won}, {firstMentorMenteeSession_some: {and: [{topic_some: {order: 1}}, {sessionStatus: completed}, ';
  let totalAmountCollected = 0;
  let totalAmount = 0;
  let salesOperationInfo = [];

  // reading input passed by user
  const { input } = params;

  // check if user has passed input
  if (input) {
    // constructing filter according to the input
    if (input.fromDate) {
      filter += `{sessionStartDate_gte: "${input.fromDate}"}, `;
    }
    if (input.toDate) {
      filter += `{sessionStartDate_lte: "${input.toDate}"}, `;
    }

    // closing parenthesis for firstMentorMenteeSession_some
    filter += ']}}';

    if (input.isSchool) {
      filter += '{source: school}, ';
    } else {
      filter += '{source_not: school}, ';
    }

    if (input.mentorName) {
      filter += `{allottedMentor_some: {name_contains: "${input.mentorName}"}}, `;
    }
    if (input.studentName) {
      filter += `{client_some: {name_contains: "${input.studentName}"}}, `;
    }
    if (input.installmentType) {
      filter += `{userPaymentPlan_some: {installmentType: ${input.installmentType}}}, `;
    }
    if (input.installmentNumber) {
      filter += `{userPaymentPlan_some: {installmentNumber: ${input.installmentNumber}}}, `;
    }
    if (input.oneToOne) {
      filter += '{userPaymentPlan_some: {product_some: {type: oneToOne}}}, ';
    }
    if (input.oneToTwo) {
      filter += '{userPaymentPlan_some: {product_some: {type: oneToTwo}}}, ';
    }
    if (input.oneToThree) {
      filter += '{userPaymentPlan_some: {product_some: {type: oneToThree}}}, ';
    }
    filter += ']}';

    const salesOperationRes = await callLocalGraphqlApi(
      getSalesOperationWonUsers(filter),
      context,
      '',
    );

    salesOperationInfo = get(salesOperationRes, 'data.salesOperations');
  } else {
    filter += ']}}]}';
    const salesOperationRes = await callLocalGraphqlApi(
      getSalesOperationWonUsers(filter),
      context,
      '',
    );

    salesOperationInfo = get(salesOperationRes, 'data.salesOperations');
  }

  // iterating over salesOperationInfo and adding all finalSellingPrice to get totalAmount
  // eslint-disable-next-line no-restricted-syntax
  for (const salesOperationDoc of salesOperationInfo) {
    const userPaymentPlan = get(salesOperationDoc, 'userPaymentPlan', '');
    const userPaymentInstallments = get(salesOperationDoc, 'userPaymentPlan.userPaymentInstallments', []);
    // eslint-disable-next-line no-await-in-loop
    if (userPaymentPlan && userPaymentPlan.id) {
      if (userPaymentPlan.finalSellingPrice) {
        totalAmount += userPaymentPlan.finalSellingPrice;
      }

      if (userPaymentInstallments && userPaymentInstallments.length) {
        // iterating over userPaymentInstallments and adding all amount to get totalAmountCollected
        // eslint-disable-next-line no-restricted-syntax
        for (const obj of userPaymentInstallments) {
          if (obj && obj.amount && obj.status === 'paid') {
            totalAmountCollected += obj.amount;
          }
        }
      }
    }
  }

  return {
    totalAmountCollected,
    totalAmount,
  };
});

export default getTotalAmountCollected;
