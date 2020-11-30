import { get } from 'lodash';
import moment from 'moment';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const getDueDates = (dateOfEnrollment, sessionsPerMonth, installmentNumber = 1, totalNumberOFInstallmentDocsAlreadyPresent = 0) => {
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
      if (i >= totalNumberOFInstallmentDocsAlreadyPresent) {
        dueDate.push(moment(enrollmentDate).add(gap * i, 'd'));
      }
    }
  }
  return dueDate;
};

const paymentPlanQuery = () => `
query{
  salesOperations(filter: {and: [{leadStatus: won}, {source_not: school}]}, orderBy: createdAt_DESC) {
    id
    userPaymentPlan {
      id
      user {
        id
        name
      }
      userPaymentInstallments(orderBy: dueDate_ASC) {
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
      }
      sessionsPerMonth
      installmentType
      installmentNumber
      productPrice
      finalSellingPrice
      dateOfEnrollment
      comment
    }
  }
}
`;

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
      status: pending,
      comment: "Added through script"
    }) {
      id
    }
  }
    `;

const addPaymentIntallmentsOfPastUsers = async () => {
  const userPaymentLinksQueryRes = await callLocalGraphqlApi(userPaymentLinksQuery());
  const paymentLinks = get(userPaymentLinksQueryRes, 'data.userPaymentLinks');
  let linkConnectId = '';
  if (paymentLinks && paymentLinks.length === 1) {
    linkConnectId = paymentLinks[0].id;
  } else {
    linkConnectId = filter(paymentLinks, (item) => item.amount).id;
  }

  const paymentPlans = await callLocalGraphqlApi(paymentPlanQuery());
  const salesOperationsArray = get(paymentPlans, 'data.salesOperations', []);

  salesOperationsArray.forEach(async (saleOperation) => {
    if (saleOperation.userPaymentPlan) {
      const userPaymentPlan = saleOperation.userPaymentPlan;
      const {
        id: userPaymentPlanId,
        dateOfEnrollment,
        finalSellingPrice,
        installmentNumber,
        sessionsPerMonth,
        user,
        userPaymentInstallments,
      } = userPaymentPlan;

      const userId = user && user.id;
      const totalNumberOFInstallmentDocsAlreadyPresent = userPaymentInstallments && userPaymentInstallments.length;

      if (userPaymentPlanId && userId && totalNumberOFInstallmentDocsAlreadyPresent < installmentNumber) {
        let totalAmountAlreadyPaidOrRequested = 0;
        userPaymentInstallments.forEach((upi) => {
          totalAmountAlreadyPaidOrRequested += upi.amount;
        });

        const totalRemainingAmount = finalSellingPrice - totalAmountAlreadyPaidOrRequested;
        const totalPaymentInstallmentDocToBeCreated = installmentNumber - totalNumberOFInstallmentDocsAlreadyPresent;

        // ideally this should be 0 but to avoid corner cases taking it as 1
        if (totalRemainingAmount > 1) {
          const installmentsDueDate = getDueDates(dateOfEnrollment, sessionsPerMonth, installmentNumber, totalNumberOFInstallmentDocsAlreadyPresent);
          const amountPerInstallment = Math.ceil(totalRemainingAmount / totalPaymentInstallmentDocToBeCreated);
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
        }
      }
    }
  });
};

export default addPaymentIntallmentsOfPastUsers;
