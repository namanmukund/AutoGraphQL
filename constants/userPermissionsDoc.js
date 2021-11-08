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
  NOT_CMS_HEAD_ARRAY,
  CMS_HEAD_ARRAY,
  UMS_ADMIN,
  TRANSFORMATION_ADMIN,
  TRANSFORMATION_TEAM,
  AUDIT_ADMIN,
  PRE_SALES,
  POST_SALES,
  ADMIN,
  NOT_ADMIN,
  AUDITOR,
  BDE,
  BDE_ADMIN,
  SUPPLY_DEMAND_ADMIN,
  SUPPLY_MANAGER,
  DEMAND_MANAGER,
  SUPPLY_DEMAND_ROLES_ARRAY,
} from './roles';

const userPermissionsDoc = {
  User: {
    collection: {
      rule: 'allow',
      crud: [...UMS_HEAD_ARR],
      read: [PRE_SALES, POST_SALES, AUDITOR, BDE, BDE_ADMIN, SUPPLY_DEMAND_ADMIN, SUPPLY_MANAGER, DEMAND_MANAGER],
      exceptDelete: [...NOT_UMS_HEAD_ARR, SCHOOL_ADMIN, TRANSFORMATION_ADMIN, AUDIT_ADMIN],
    },
    fields: {
      role: {
        rule: 'allow',
        crud: [...UMS_HEAD_ARR],
        read: [...NOT_UMS_HEAD_ARR, PRE_SALES, POST_SALES, AUDIT_ADMIN, AUDITOR, BDE, BDE_ADMIN, SUPPLY_DEMAND_ADMIN, DEMAND_MANAGER],
        exceptDelete: [TRANSFORMATION_ADMIN],
      },
      savedPassword: {
        rule: 'allow',
        crud: [...UMS_HEAD_ARR],
        read: [...NOT_UMS_HEAD_ARR],
        exceptDelete: [TRANSFORMATION_ADMIN],
      },
    },
  },
  SalesOperation: {
    collection: {
      rule: 'allow',
      crud: [...UMS_HEAD_ARR, UMS_VIEWER, MENTOR, SALES, SALES_EXECUTIVE],
      read: [MENTEE, TRANSFORMATION_ADMIN, TRANSFORMATION_TEAM, BDE, BDE_ADMIN],
    },
  },
  SalesOperationLog: {
    collection: {
      rule: 'allow',
      crud: [...UMS_HEAD_ARR, UMS_VIEWER, MENTOR, SALES, SALES_EXECUTIVE],
      read: [TRANSFORMATION_ADMIN, TRANSFORMATION_TEAM],
    },
  },
  SalesOperationActivity: {
    collection: {
      rule: 'allow',
      crud: [...UMS_HEAD_ARR, UMS_VIEWER, MENTOR, SALES, SALES_EXECUTIVE],
      read: [TRANSFORMATION_ADMIN, TRANSFORMATION_TEAM],
    },
  },
  UserPaymentPlan: {
    collection: {
      rule: 'allow',
      crud: [...UMS_HEAD_ARR, UMS_VIEWER, MENTOR, SALES, SALES_EXECUTIVE],
      read: [TRANSFORMATION_ADMIN, TRANSFORMATION_TEAM],
    },
  },
  UserPaymentInstallment: {
    collection: {
      rule: 'allow',
      crud: [...UMS_HEAD_ARR, UMS_VIEWER, MENTOR, SALES, SALES_EXECUTIVE],
      read: [TRANSFORMATION_ADMIN, TRANSFORMATION_TEAM],
    },
  },
  UserPaymentLink: {
    collection: {
      rule: 'allow',
      crud: [...UMS_HEAD_ARR, UMS_VIEWER, MENTOR, SALES, SALES_EXECUTIVE],
      read: [TRANSFORMATION_ADMIN, TRANSFORMATION_TEAM],
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
      crud: [...CMS_HEAD_ARRAY],
      read: [...NOT_CMS_HEAD_ARRAY],
    },
  },
  Project: {
    collection: {
      rule: 'allow',
      crud: [...CMS_HEAD_ARRAY],
      read: [...NOT_CMS_HEAD_ARRAY],
    },
  },
  ProjectContent: {
    collection: {
      rule: 'allow',
      crud: [...CMS_HEAD_ARRAY],
      read: [...NOT_CMS_HEAD_ARRAY],
    },
  },
  Product: {
    collection: {
      rule: 'allow',
      crud: [...CMS_HEAD_ARRAY, UMS_ADMIN],
      read: [...NOT_CMS_HEAD_ARRAY, SCHOOL_ADMIN, BDE_ADMIN],
    },
  },
  BlockBasedProject: {
    collection: {
      rule: 'allow',
      crud: [...CMS_HEAD_ARRAY],
      read: [...NOT_CMS_HEAD_ARRAY],
    },
  },
  AuditQuestion: {
    collection: {
      rule: 'allow',
      crud: [...UMS_HEAD_ARR, AUDIT_ADMIN, AUDITOR],
      read: [UMS_VIEWER, MENTOR, PRE_SALES, POST_SALES],
    },
  },
  SessionReport: {
    collection: {
      rule: 'allow',
      crud: [ADMIN, UMS_ADMIN],
      read: [NOT_ADMIN],
    },
  },
  MentorAvailabilitySlot: {
    collection: {
      rule: 'allow',
      crud: [...UMS_HEAD_ARR, ...SUPPLY_DEMAND_ROLES_ARRAY],
      read: [...NOT_UMS_HEAD_ARR],
    },
  },
};

export default userPermissionsDoc;
