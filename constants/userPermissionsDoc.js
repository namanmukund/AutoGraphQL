import {
  MENTEE, MENTOR, NOT_UMS_HEAD_ARR, SALES, SALES_EXECUTIVE, UMS_HEAD_ARR, UMS_VIEWER,
} from './roles';

const userPermissionsDoc = {
  User: {
    collection: {
      rule: 'allow',
      crud: [...UMS_HEAD_ARR],
      exceptDelete: [...NOT_UMS_HEAD_ARR],
    },
    fields: {
      role: {
        rule: 'allow',
        crud: [...UMS_HEAD_ARR],
        read: [...NOT_UMS_HEAD_ARR],
      },
      savedPassword: {
        rule: 'allow',
        crud: [...UMS_HEAD_ARR],
        read: [...NOT_UMS_HEAD_ARR],
      },
    },
  },
  SalesOperation: {
    collection: {
      rule: 'allow',
      crud: [...UMS_HEAD_ARR, UMS_VIEWER, MENTOR, SALES, SALES_EXECUTIVE],
      read: [MENTEE],
    },
  },
  SalesOperationLog: {
    collection: {
      rule: 'allow',
      crud: [...UMS_HEAD_ARR, UMS_VIEWER, MENTOR, SALES, SALES_EXECUTIVE],
    },
  },
  SalesOperationActivity: {
    collection: {
      rule: 'allow',
      crud: [...UMS_HEAD_ARR, UMS_VIEWER, MENTOR, SALES, SALES_EXECUTIVE],
    },
  },
  UserPaymentPlan: {
    collection: {
      rule: 'allow',
      crud: [...UMS_HEAD_ARR, UMS_VIEWER, MENTOR, SALES, SALES_EXECUTIVE],
    },
  },
  UserPaymentInstallment: {
    collection: {
      rule: 'allow',
      crud: [...UMS_HEAD_ARR, UMS_VIEWER, MENTOR, SALES, SALES_EXECUTIVE],
    },
  },
  UserPaymentLink: {
    collection: {
      rule: 'allow',
      crud: [...UMS_HEAD_ARR, UMS_VIEWER, MENTOR, SALES, SALES_EXECUTIVE],
    },
  },
};

export default userPermissionsDoc;
