import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const getSalesOperationWonUsers = async () => {
  const query = `
    query{
      salesOperations(filter: {and: [{leadStatus: won}, {firstMentorMenteeSession_some: {and: [{topic_some: {order: 1}}, {sessionStatus: completed}]}}]}) {
        id
        client {
          id
        }
        userPaymentPlan {
          id
          user {
            id
          }
          userPaymentInstallments(orderBy: dueDate_ASC) {
            id
            user {
              id
            }
          }
        }
      }
    }
`;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.salesOperations');
};

const updateUserPaymentPlan = async (userPaymentPlanId, userConnectId) => {
  const query = `
mutation{
  updateUserPaymentPlan(
    id: "${userPaymentPlanId}",
    userConnectId: "${userConnectId}",
  ){
    id
  }
}
`;

  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.updateUserPaymentPlan.id');
};

const updateUserPaymentInstallment = async (userPaymentInstallmentId, userConnectId) => {
  const query = `
mutation{
  updateUserPaymentInstallment(
    id: "${userPaymentInstallmentId}",
    userConnectId: "${userConnectId}",
    input: {},
  ){
    id
  }
}
`;

  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.updateUserPaymentInstallment.id');
};

const updateUserInPaymentPlanAndPaymentInstallment = async () => {
  const salesMentorsData = await getSalesOperationWonUsers();
  let userPaymentPlanCount = 0;
  let userPaymentInstallmentCount = 0;
  // eslint-disable-next-line no-restricted-syntax
  for (const salesOperationDoc of salesMentorsData) {
    const userConnectId = get(salesOperationDoc, 'client.id', '');
    const userPaymentPlan = get(salesOperationDoc, 'userPaymentPlan', '');
    const userPaymentInstallments = get(salesOperationDoc, 'userPaymentPlan.userPaymentInstallments', []);
    // eslint-disable-next-line no-await-in-loop
    if (userConnectId && userPaymentPlan && userPaymentPlan.id) {
      const userPaymentPlanId = userPaymentPlan.id;
      const userPaymentPlanConnectId = get(userPaymentPlan, 'user.id', '');
      // update
      if (userConnectId !== userPaymentPlanConnectId) {
        // eslint-disable-next-line no-use-before-define,no-await-in-loop
        const updateUserPaymentPlanData = await updateUserPaymentPlan(userPaymentPlanId, userConnectId);
        // eslint-disable-next-line no-console
        console.log('updated User payment plan:', updateUserPaymentPlanData);
        userPaymentPlanCount += 1;
      }

      if (userPaymentInstallments && userPaymentInstallments.length) {
        // eslint-disable-next-line no-restricted-syntax
        for (const obj of userPaymentInstallments) {
          if (obj && obj.id) {
            const userPaymentInstallmentId = obj.id;
            const userPaymentInstallmentConnectId = get(obj, 'user.id', '');
            // update
            if (userConnectId !== userPaymentInstallmentConnectId) {
              // eslint-disable-next-line no-use-before-define,no-await-in-loop
              const updateUserPaymentInstallmentData = await updateUserPaymentInstallment(userPaymentInstallmentId, userConnectId);
              // eslint-disable-next-line no-console
              console.log('updated User payment Installment:', updateUserPaymentInstallmentData);
              userPaymentInstallmentCount += 1;
            }
          }
        }
      }
    }
  }
  // eslint-disable-next-line no-console
  console.log('updated User payment Plan count:', userPaymentPlanCount);
  // eslint-disable-next-line no-console
  console.log('updated User payment Installment count:', userPaymentInstallmentCount);
};

export default updateUserInPaymentPlanAndPaymentInstallment;
