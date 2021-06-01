import { get } from 'lodash';
import moment from 'moment';
import { log } from '../../../../utils';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import updateUserPaymentPlanMutation from './utils/updateUserPaymentPlanMutation';
import { updateProductTypeLeadSquared } from './leadsquared';

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
    user {
      id
      studentProfile {
        parents {
          user {
            id
            phone {
              number
              countryCode
            }
          }
        }
      }
    }
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

const fetchProduct = (id) => `{
  product(id: "${id}") {
    id
    type
  }
}`;

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
  const { productConnectId } = params;

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

  /** Initialize UserPaymentPlan with default values and nextPaymentDate  */
  await updateUserPaymentPlanMutation(
    userPaymentPlanId,
    {
      isPaid: false,
      collectedAmount: 0,
      nextPaymentDate: new Date(installmentsDueDate[0]).toISOString(),
    },
  );

  let phoneNumber = '';
  console.log(userPaymentPlanId);
  // returning updated userPaymentInstallments
  if (input && userPaymentPlanId) {
    // getting updated Payment installments
    const userPaymentPlansQueryRes = await callLocalGraphqlApi(userPaymentPlanQuery(userPaymentPlanId));
    const userPaymentInstallments = get(userPaymentPlansQueryRes, 'data.userPaymentPlan.userPaymentInstallments', []);
    phoneNumber = get(userPaymentPlansQueryRes, 'data.userPaymentPlan.user.studentProfile.parents[0].user.phone.number', '');
    // parsing userPaymentInstallments data to be returned in userPaymentPlan
    /* eslint-disable no-param-reassign */
    input.userPaymentInstallments = userPaymentInstallments;
  }

  // update Leadsquared
  console.log('productConnectId', productConnectId);
  if (productConnectId) {
    const product = await callLocalGraphqlApi(fetchProduct(productConnectId));
    const productType = get(product, 'data.product.type');
    updateProductTypeLeadSquared(phoneNumber, productType);
  }
  return input;
};

export default addUserPaymentPlanPostHookMethod;
