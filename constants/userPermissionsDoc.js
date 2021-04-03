import {
  BATCH_HEAD_ARR,
  MENTEE,
  MENTOR,
  NOT_BATCH_HEAD_ARR,
  NOT_UMS_HEAD_ARR,
  SALES,
  SALES_EXECUTIVE,
  SCHOOL_ADMIN,
  UMS_HEAD_ARR,
  UMS_VIEWER,
  WORKBOOK_CMS_HEAD,
  WORKBOOK_NOT_CMS_HEAD,
} from './roles';

const userPermissionsDoc = {
  User: {
    collection: {
      rule: 'allow',
      crud: [...UMS_HEAD_ARR],
      exceptDelete: [...NOT_UMS_HEAD_ARR, SCHOOL_ADMIN],
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
  UserCurrentTopicComponentStatus: {
    collection: {
      rule: 'allow',
      crud: [...UMS_HEAD_ARR],
      read: [...NOT_UMS_HEAD_ARR, SCHOOL_ADMIN],
    },
  },
  BatchCurrentComponentStatus: {
    collection: {
      rule: 'allow',
      crud: [...BATCH_HEAD_ARR],
      read: [...NOT_BATCH_HEAD_ARR, SCHOOL_ADMIN],
    },
  },
  Workbook: {
    collection: {
      rule: 'allow',
      crud: [...WORKBOOK_CMS_HEAD],
      read: [...WORKBOOK_NOT_CMS_HEAD],
    },
  },
  Project: {
    collection: {
      rule: 'allow',
      crud: [...WORKBOOK_CMS_HEAD],
      read: [...WORKBOOK_NOT_CMS_HEAD],
    },
  },
  ProjectContent: {
    collection: {
      rule: 'allow',
      crud: [...WORKBOOK_CMS_HEAD],
      read: [...WORKBOOK_NOT_CMS_HEAD],
    },
  },
};

// CMS_HEAD

// NOT_CMS_HEAD

export default userPermissionsDoc;
