import { get } from 'lodash';
import moment from 'moment';
import {
  installmentStatus,
} from '../../../../constants';
import { MENTEE } from '../../../../constants/roles';
import { log } from '../../../../utils';
import {
  DatabaseRecordNotFoundError,
} from '../../../../constants/errors';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import { addZeroes } from './utils/addZeroesToANumber';
import { sendEmailInvoiceToUser } from './utils/sendEmailInvoiceToUser';

/* query to get userPaymentInstallment */
const userPaymentInstallmentQuery = (userId, userPaymentPlanId) => `
  	query {
		userPaymentInstallments(filter:{
		and: [
		  {
		    user_some:{
		      id:"${userId}"
		    }
		  }
		  {
		    userPaymentPlan_some:{
		      id: "${userPaymentPlanId}"
		    }
		  }
		]
		}){
			user{
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
		  userPaymentPlan{
		    product{
		      id
		      title
		    }
		    userPaymentInstallments{
		      id
		      amount
		      dueDate
		      status
		    }
		    installmentNumber
		    productPrice
		    finalSellingPrice
		  }
		  userPaymentLink{
		    amount
		    link
		  }
			amount
			dueDate
			paidDate
			paymentRequestedCount
			status
			createdAt
		}
	}
`;

const getSuffix = (i) => {
  switch (i) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
};

/*
  This method sends invoice on mail to users depending upon the intallments and
  whether that is paid or pending
  */
const addUserPaymentInstallmentPostHookMethod = async (input, params, mutationName, context) => {
  	const userId = get(params, 'userConnectId');
  const paymentPlanId = get(params, 'userPaymentPlanConnectId');

  if (!userId || !paymentPlanId) {
    	log('Either one of userId or paymentPlanId is missing in input of addUserPaymentInstallmentPostHookMethod');
  	}

  	const {
	    pending,
	    paid,
  	} = installmentStatus;
  	const userPaymentInstallmentQueryRes = await callLocalGraphqlApi(userPaymentInstallmentQuery(userId, paymentPlanId));
  	let userPaymentInstallmentsInfo = get(userPaymentInstallmentQueryRes, 'data.userPaymentInstallments');

  	if (!userPaymentInstallmentsInfo || (userPaymentInstallmentsInfo && !userPaymentInstallmentsInfo.length)) {
	    throw new DatabaseRecordNotFoundError({
	      data: {
	        error: `UserPaymentInstallmentInfo is not present for the userId: ${userId}`,
	      },
	    });
  	}
  	userPaymentInstallmentsInfo = userPaymentInstallmentsInfo.sort((a, b) => a.createdAt - b.createdAt);
  	const userPaymentInstallmentInfo = userPaymentInstallmentsInfo[userPaymentInstallmentsInfo.length - 1];

  // payload object where we will store the info to be sent in email
  	const payload = {};
  // get firstName, email, phone from user object based on it's role
  payload.firstName = get(userPaymentInstallmentInfo, 'user.name', '');
  if (userPaymentInstallmentInfo.user && userPaymentInstallmentInfo.user.role === MENTEE) {
    payload.email = get(userPaymentInstallmentInfo, 'user.studentProfile.parents[0].user.email', '');
    payload.phone = get(userPaymentInstallmentInfo, 'user.studentProfile.parents[0].user.phone', '');
    payload.countryCode = get(userPaymentInstallmentInfo, 'user.studentProfile.parents[0].user.phone.countryCode', '');
    payload.phoneNumber = get(userPaymentInstallmentInfo, 'user.studentProfile.parents[0].user.phone.number', '');
    payload.parentName = get(userPaymentInstallmentInfo, 'user.studentProfile.parents[0].user.name', '');
  } else {
    payload.parentName = get(userPaymentInstallmentInfo, 'user.name', '');
    payload.email = get(userPaymentInstallmentInfo, 'user.email', '');
    payload.phone = get(userPaymentInstallmentInfo, 'user.phone', '');
    payload.phoneNumber = get(userPaymentInstallmentInfo, 'user.phone.number', '');
    payload.countryCode = get(userPaymentInstallmentInfo, 'user.phone.countryCode', '');
  }

  // getting productInfo
  payload.productInfo = get(userPaymentInstallmentInfo, 'userPaymentPlan.product.title', '');
  const userPaymentInstallments = get(userPaymentInstallmentInfo, 'userPaymentPlan.userPaymentInstallments', []);
  payload.paymentLink = get(userPaymentInstallmentInfo, 'userPaymentLink.link', '');
  const productPrice = get(userPaymentInstallmentInfo, 'userPaymentPlan.productPrice', 0);
  const finalSellingPrice = get(userPaymentInstallmentInfo, 'userPaymentPlan.finalSellingPrice', 0);
  let totalDiscount = productPrice - finalSellingPrice;
  const totalNumberOfInstallments = get(userPaymentInstallmentInfo, 'userPaymentPlan.installmentNumber', 0);

  let totalPaidAmount = 0;
  if (userPaymentInstallments && userPaymentInstallments.length > 0) {
    userPaymentInstallments.forEach((userPaymentInstallmentDoc) => {
	      if (userPaymentInstallmentDoc.status === paid) {
	        totalPaidAmount += userPaymentInstallmentDoc.amount;
	      }
	    });
  }

  let totalDueAmount = finalSellingPrice - totalPaidAmount;
  if (totalDueAmount < 0) totalDueAmount = 0;
  payload.totalDueAmount = addZeroes(totalDueAmount);
  payload.productPrice = addZeroes(productPrice);
  payload.finalSellingPrice = addZeroes(finalSellingPrice);
  if (totalDiscount < 0) totalDiscount = 0;
  payload.totalDiscount = addZeroes(totalDiscount);
  payload.totalNumberOfInstallments = totalNumberOfInstallments;
  payload.installmentNumber = userPaymentInstallments.length;

  const amountToPay = get(userPaymentInstallmentInfo, 'amount', 0);
  const dueDate = get(userPaymentInstallmentInfo, 'dueDate', new Date());
  const paidDate = get(userPaymentInstallmentInfo, 'paidDate', new Date());
  payload.dueDate = moment(dueDate).format('ll');
  payload.paidDate = moment(paidDate).format('ll');
  payload.amountToPay = addZeroes(amountToPay);

  const status = get(userPaymentInstallmentInfo, 'status', pending);
  // paymentRequestedCount

  let subject = 'Payment Receipt from Tekie';
  if (status === paid) {
    if (totalNumberOfInstallments > 1) {
      subject = `${payload.installmentNumber}${getSuffix(payload.installmentNumber)} Installment Payment Receipt from Tekie`;
      sendEmailInvoiceToUser(payload, 'paymentInvoiceWithInstallmentEmailTemplate', subject);
    } else {
      sendEmailInvoiceToUser(payload, 'paymentInvoiceWithoutInstallmentEmailTemplate', subject);
    }
  } else if (totalNumberOfInstallments > 1) {
    if (payload.installmentNumber) {
      subject = `${payload.installmentNumber}${getSuffix(payload.installmentNumber)} Installment Reminder from Tekie`;
    } else {
      subject = 'Installment Reminder from Tekie';
    }
    sendEmailInvoiceToUser(payload, 'paymentReminderWithInstallmentEmailTemplate', subject);
  } else {
    subject = 'Payment Reminder from Tekie';
    sendEmailInvoiceToUser(payload, 'paymentReminderWithoutInstallmentEmailTemplate', subject);
  }
};

export default addUserPaymentInstallmentPostHookMethod;
