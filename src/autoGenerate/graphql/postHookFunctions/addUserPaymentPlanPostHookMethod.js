import { get } from 'lodash';
import moment from 'moment';
import { log } from '../../../../utils';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';

const getDueDates = (dateOfEnrollment, sessionsPerMonth, installmentNumber = 1) => {
  const enrollmentDate = new Date(dateOfEnrollment);
  const dueDate = [];
  if (enrollmentDate) {
    const perMonth = sessionsPerMonth === 8 ? 8 : 6;
    let numberOfDays = 0;
    if (perMonth === 8) {
      const start = moment(enrollmentDate);
      const end = moment(enrollmentDate).add(5, 'M'); // add 5 months; calculated it;
      numberOfDays = moment.duration(end.diff(start)).asDays();
    } else {
      const start = moment(enrollmentDate);
      const end = moment(enrollmentDate).add(6, 'M'); // add 6 months; calculated it;
      numberOfDays = moment.duration(end.diff(start)).asDays();
    }
    const gap = Math.floor(numberOfDays / installmentNumber);

    for (let i = 0; i < installmentNumber; i += 1) {
      dueDate.push(moment(enrollmentDate).add(gap * i, 'd'));
    }
  }
  return dueDate;
};

/* query to get userPaymentLinks */
const userPaymentLinksQuery = () => `
query{
    userPaymentLinks(filter:{
      or:[
        {type: variable}
      ]
    }){
      id
      type
      amount
      link
    }
  }
`;

/* query to get userPaymentPlans */
const userPaymentPlanQuery = (userPaymentPlanId) => `
query {
  userPaymentPlan(id:"${userPaymentPlanId}") {
    id
    userPaymentInstallments {
      id
      userPaymentPlan {
        id
      }
      userPaymentLink {
        id
      }
      amount
      dueDate
      paidDate
      lastPaymentRequestedDate
      paymentRequestedCount
      status
      isPaymentRequested
      comment
      createdAt
      updatedAt
    }
  }
}
`;

// query to add UserPaymentInstallment
const addUserPaymentInstallment = (
  userId,
  userPaymentPlanId,
  linkConnectId,
  amountPerInstallment,
  dueDate,
) => `
  mutation {
    addUserPaymentInstallment(
    userConnectId: "${userId}", 
    userPaymentPlanConnectId: "${userPaymentPlanId}", 
    userPaymentLinkConnectId: "${linkConnectId}", 
    input: {
      amount: ${amountPerInstallment},
      dueDate: "${dueDate}",
      isPaymentRequested: false,
      paymentRequestedCount: 0,
      status: pending
    }) {
      id
    }
  }
    `;

/*
  This method adds user payment installments on the basis of installment number, final selling price
  , sessions per month.
*/
const addUserPaymentPlanPostHookMethod = async (input, params) => {
  const userId = get(params, 'userConnectId');

  if (!userId) {
    log('UserId is missing in input of addUserPaymentPlanPostHookMethod');
  }

  const {
    id: userPaymentPlanId,
    dateOfEnrollment,
    finalSellingPrice,
    installmentNumber,
    sessionsPerMonth,
  } = input;

  const userPaymentLinksQueryRes = await callLocalGraphqlApi(userPaymentLinksQuery());
  const paymentLinks = get(userPaymentLinksQueryRes, 'data.userPaymentLinks');
  let linkConnectId = '';
  if (paymentLinks && paymentLinks.length === 1) {
    linkConnectId = paymentLinks[0].id;
  } else {
    linkConnectId = filter(paymentLinks, (item) => item.amount).id;
  }

  const installmentsDueDate = getDueDates(dateOfEnrollment, sessionsPerMonth, installmentNumber);
  const amountPerInstallment = Math.ceil(finalSellingPrice / installmentNumber);

  // eslint-disable-next-line no-restricted-syntax
  for (const dueDate of installmentsDueDate) {
    // eslint-disable-next-line no-await-in-loop
    await callLocalGraphqlApi(addUserPaymentInstallment(
      userId,
      userPaymentPlanId,
      linkConnectId,
      amountPerInstallment,
      new Date(dueDate),
    ));
  }

  // returning updated userPaymentInstallments
  if (input && userPaymentPlanId) {
    // getting updated Payment installments
    const userPaymentPlansQueryRes = await callLocalGraphqlApi(userPaymentPlanQuery(userPaymentPlanId));
    const userPaymentInstallments = get(userPaymentPlansQueryRes, 'data.userPaymentPlan.userPaymentInstallments', []);
    // parsing userPaymentInstallments data to be returned in userPaymentPlan
    /* eslint-disable no-param-reassign */
    input.userPaymentInstallments = userPaymentInstallments;
  }
  return input;
};

export default addUserPaymentPlanPostHookMethod;
