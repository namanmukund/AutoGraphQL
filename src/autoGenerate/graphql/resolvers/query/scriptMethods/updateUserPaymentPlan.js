import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const userPaymentPlanQuery = async () => {
  const query = `
query{
  userPaymentPlans{
    id
    finalSellingPrice
    user{
      id
    }
    userPaymentInstallments(orderBy:dueDate_ASC){
      amount
      dueDate
      paidDate
      status
    }
  }
}
`;
  const res = await callLocalGraphqlApi(query);
  const data = get(res, 'data.userPaymentPlans');
  return data;
};

const mentorMenteeSessionsQuery = async (userId) => {
  const query = `
query{
  mentorMenteeSessions(filter:{
    and:[
      {menteeSession_some:{user_some:{id:"${userId}"}}}
      {sessionStatus:completed}
    ]
  }, orderBy:sessionStartDate_DESC, first:1){
    id
    sessionStartDate
    topic{
      id
      order
    }
  }
}
`;
  const res = await callLocalGraphqlApi(query);
  const data = get(res, 'data.mentorMenteeSessions[0]');
  return data;
};

const updateUserPaymentPlanMutation = async (id, topicId, input) => {
  const query = `
mutation($input:UserPaymentPlanUpdate){
  updateUserPaymentPlan(
    id:"${id}", 
    lastSessionTopicConnectId:"${topicId}",
    input:$input
  ){
    id
  }
}
`;
  const res = await callLocalGraphqlApi(query, '', { input });
  const data = get(res, 'data.updateUserPaymentPlan');
  // eslint-disable-next-line no-console
  console.log('Updated updateUserPaymentPlan', data.id);
  return data;
};
const updateUserPaymentPlan = async () => {
  const userPaymentPlansData = await userPaymentPlanQuery();
  if (userPaymentPlansData && userPaymentPlansData.length) {
    // eslint-disable-next-line no-restricted-syntax
    for (const userPaymentPlan of userPaymentPlansData) {
      const { id: userPaymentPlanId, user, userPaymentInstallments } = userPaymentPlan;
      const userId = get(user, 'id');
      if (userId) {
        // eslint-disable-next-line no-await-in-loop
        const mmsData = await mentorMenteeSessionsQuery(userId);
        const updateObj = {};
        if (mmsData && mmsData.sessionStartDate) {
          updateObj.lastSessionOn = new Date(mmsData.sessionStartDate).toISOString();
        }
        let collectedAmount = 0;
        let isPaid = true;
        let nextPaymentDate;
        if (userPaymentInstallments && userPaymentInstallments.length) {
          // eslint-disable-next-line no-restricted-syntax
          for (const userPaymentInstallment of userPaymentInstallments) {
            const {
              amount,
              dueDate,
              status,
            } = userPaymentInstallment;
            if (status === 'paid') {
              collectedAmount += amount;
            } else {
              isPaid = false;
              if (!nextPaymentDate) {
                nextPaymentDate = dueDate;
                updateObj.nextPaymentDate = new Date(nextPaymentDate).toISOString();
              }
            }
          }
          updateObj.collectedAmount = collectedAmount;
        } else {
          isPaid = false;
        }
        updateObj.isPaid = isPaid;
        // eslint-disable-next-line no-await-in-loop
        await updateUserPaymentPlanMutation(userPaymentPlanId, get(mmsData, 'topic.id'), updateObj);
      }
    }
  }
};

export default updateUserPaymentPlan;
