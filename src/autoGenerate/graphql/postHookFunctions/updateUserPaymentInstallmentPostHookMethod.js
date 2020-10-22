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
const userPaymentInstallmentQuery = (userPaymentInstallmentId) => `
    query {
    userPaymentInstallment(id: "${userPaymentInstallmentId}"){
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
            paidDate
            paymentRequestedCount
            status
            createdAt
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
const updateUserPaymentInstallmentPostHookMethod = async (input, params) => {
  const userPaymentInstallmentId = get(params, 'id');
  const { status: inputPaymentStatus, paymentRequestedCount } = input;

  if (!userPaymentInstallmentId) {
    log('userPaymentInstallmentId is missing in input of updateUserPaymentInstallmentPostHookMethod');
  }

  const {
    pending,
    paid,
  } = installmentStatus;

  // mail will only be sent if there are fields inputPaymentStatus or
  // paymentRequestedCount in the input fields
  if (inputPaymentStatus === paid || paymentRequestedCount) {
    const userPaymentInstallmentQueryRes = await callLocalGraphqlApi(userPaymentInstallmentQuery(userPaymentInstallmentId));
    const userPaymentInstallmentInfo = get(userPaymentInstallmentQueryRes, 'data.userPaymentInstallment');
    if (!userPaymentInstallmentInfo) {
      throw new DatabaseRecordNotFoundError({
        data: {
          error: `UserPaymentInstallmentInfo is not present for the userPaymentInstallmentId: ${userPaymentInstallmentId}`,
        },
      });
    }
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
    let userPaymentInstallments = get(userPaymentInstallmentInfo, 'userPaymentPlan.userPaymentInstallments', []);
    payload.paymentLink = get(userPaymentInstallmentInfo, 'userPaymentLink.link', '');
    const productPrice = get(userPaymentInstallmentInfo, 'userPaymentPlan.productPrice', 0);
    const finalSellingPrice = get(userPaymentInstallmentInfo, 'userPaymentPlan.finalSellingPrice', 0);
    let totalDiscount = productPrice - finalSellingPrice;
    const totalNumberOfInstallments = get(userPaymentInstallmentInfo, 'userPaymentPlan.installmentNumber', 0);

    let installmentNumber = 1;
    let totalPaidAmount = 0;

    // sorting and iterating over userPaymentInstallments to get amount paid
    // and to get current installment number
    userPaymentInstallments = userPaymentInstallments.sort((a, b) => a.createdAt - b.createdAt);
    if (userPaymentInstallments && userPaymentInstallments.length > 0) {
      userPaymentInstallments.forEach((userPaymentInstallmentDoc, index) => {
        if (userPaymentInstallmentDoc.id === userPaymentInstallmentId) {
          installmentNumber = index + 1;
        }

        if (userPaymentInstallmentDoc.status === paid) {
          totalPaidAmount += userPaymentInstallmentDoc.amount;
        }
      });
    }
    payload.installmentNumber = installmentNumber;

    let totalDueAmount = finalSellingPrice - totalPaidAmount;
    if (totalDueAmount < 0) totalDueAmount = 0;
    payload.totalDueAmount = addZeroes(totalDueAmount);
    payload.productPrice = addZeroes(productPrice);
    payload.finalSellingPrice = addZeroes(finalSellingPrice);
    if (totalDiscount < 0) totalDiscount = 0;
    payload.totalDiscount = addZeroes(totalDiscount);
    payload.totalNumberOfInstallments = totalNumberOfInstallments;

    const amountToPay = get(userPaymentInstallmentInfo, 'amount', 0);
    const dueDate = get(userPaymentInstallmentInfo, 'dueDate', new Date());
    const paidDate = get(userPaymentInstallmentInfo, 'paidDate', new Date());
    payload.dueDate = moment(dueDate).format('ll');
    payload.paidDate = moment(paidDate).format('ll');
    payload.amountToPay = addZeroes(amountToPay);

    const status = get(userPaymentInstallmentInfo, 'status', pending);

    // Sending mails on basis of if there are more than 1 totalNumberOfInstallments
  // and if the status is paid, we will send the invoice otherwise a reminder mail
    let subject = 'Payment Receipt from Tekie';
    if (status === paid) {
      if (totalNumberOfInstallments > 1) {
        if (payload.installmentNumber) {
          subject = `${payload.installmentNumber}${getSuffix(payload.installmentNumber)} Installment Payment Receipt from Tekie`;
        } else {
          subject = 'Installment Payment Receipt from Tekie';
        }
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
  }
};

export default updateUserPaymentInstallmentPostHookMethod;
