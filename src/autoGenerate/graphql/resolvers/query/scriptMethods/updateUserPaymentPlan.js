import { get } from 'lodash';
import moment from 'moment';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const userPaymentPlanQuery = async () => {
  const query = `
query{
  userPaymentPlans {
    id
    finalSellingPrice
    sessionsPerMonth
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

const mentorMenteeSessionsQuery = async (userId, orderBy = 'latest') => {
  let orderByString = '';
  if (orderBy === 'latest') {
    orderByString = 'orderBy:sessionStartDate_DESC';
  } else {
    orderByString = 'orderBy:sessionStartDate_ASC';
  }
  const query = `
query{
  mentorMenteeSessions(filter:{
    and:[
      {menteeSession_some:{user_some:{id:"${userId}"}}}
      {sessionStatus:completed}
    ]
  }, ${orderByString}, first:1){
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

const updateUserPaymentPlanMutation = async (
  id,
  input,
  topicId,
) => {
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

const getSessionVelocityStatus = (sessionsPerMonth, avgDaysPerSession) => {
  let sessionVelocityStatus = 'onTime';
  const expectedAvgDaysPerSession = Math.round(30 / sessionsPerMonth);
  if (avgDaysPerSession && (expectedAvgDaysPerSession > Math.round(avgDaysPerSession))) {
    sessionVelocityStatus = 'ahead';
  } else if (avgDaysPerSession && (expectedAvgDaysPerSession < Math.round(avgDaysPerSession))) {
    sessionVelocityStatus = 'delayed';
  }
  return sessionVelocityStatus;
};

const updateUserPaymentPlan = async () => {
  const userPaymentPlansData = await userPaymentPlanQuery();
  if (userPaymentPlansData && userPaymentPlansData.length) {
    // eslint-disable-next-line no-restricted-syntax
    for (const userPaymentPlan of userPaymentPlansData) {
      const {
        id: userPaymentPlanId, user, userPaymentInstallments, sessionsPerMonth,
      } = userPaymentPlan;
      const userId = get(user, 'id');
      if (userId) {
        // eslint-disable-next-line no-await-in-loop
        const mmsLastData = await mentorMenteeSessionsQuery(userId);
        const updateObj = {};
        if (mmsLastData && mmsLastData.sessionStartDate) {
          updateObj.lastSessionOn = new Date(mmsLastData.sessionStartDate).toISOString();
          const lastTopicOrder = get(mmsLastData, 'topic.order');
          if (lastTopicOrder > 1) {
            // eslint-disable-next-line no-await-in-loop
            const mmsFirstData = await mentorMenteeSessionsQuery(userId, 'first');
            const diffInDays = moment(mmsLastData.sessionStartDate).diff(mmsFirstData.sessionStartDate, 'days');
            if (diffInDays) {
              updateObj.avgDaysPerSession = Math.round(diffInDays / lastTopicOrder);
              updateObj.sessionVelocityStatus = getSessionVelocityStatus(sessionsPerMonth, updateObj.avgDaysPerSession);
            }
          }
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
        await updateUserPaymentPlanMutation(
          userPaymentPlanId,
          updateObj,
          get(mmsLastData, 'topic.id'),
        );
      }
    }
  }
};

export default updateUserPaymentPlan;
