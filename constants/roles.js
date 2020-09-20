const ADMIN = 'admin';
const SELF_LEARNER = 'selfLearner';
const SCHOOL_STUDENT = 'schoolStudent';
const MENTOR = 'mentor';
const MENTEE = 'mentee';
const PARENT = 'parent';
const UMS_ADMIN = 'umsAdmin';
const UMS_VIEWER = 'umsViewer';
const CMS_ADMIN = 'cmsAdmin';
const CMS_VIEWER = 'cmsViewer';
const CMS_UMS_VIEWER = 'cmsUmsViewer';
const AFFILIATE = 'affiliate';

const CMS_HEAD = `[
"${ADMIN}", 
"${CMS_ADMIN}"
]`;

const NOT_CMS_HEAD = `[
"${SELF_LEARNER}", 
"${SCHOOL_STUDENT}", 
"${UMS_ADMIN}", 
"${MENTOR}", 
"${MENTEE}", 
"${UMS_VIEWER}", 
"${CMS_ADMIN}",
"${CMS_UMS_VIEWER}"
]`;

const UMS_HEAD = `[
"${ADMIN}", 
"${UMS_ADMIN}"
]`;

const NOT_UMS_HEAD = `[
"${CMS_ADMIN}", 
"${SELF_LEARNER}", 
"${SCHOOL_STUDENT}", 
"${MENTOR}", 
"${MENTEE}", 
"${UMS_VIEWER}", 
"${CMS_UMS_VIEWER}",
"${AFFILIATE}"
]`;

const UMS_HEAD_AND_MENTOR = `[
"${ADMIN}", 
"${UMS_ADMIN}",
"${MENTOR}"
]`;

const NOT_UMS_HEAD_AND_MENTOR = `[
"${CMS_ADMIN}", 
"${SELF_LEARNER}", 
"${SCHOOL_STUDENT}", 
"${MENTEE}", 
"${UMS_VIEWER}", 
"${CMS_UMS_VIEWER}"
]`;

const ALL_ROLES = `[
"${ADMIN}", 
"${CMS_ADMIN}", 
"${SELF_LEARNER}", 
"${SCHOOL_STUDENT}", 
"${UMS_ADMIN}", 
"${MENTOR}", 
"${MENTEE}", 
"${UMS_VIEWER}", 
"${CMS_VIEWER}", 
"${CMS_UMS_VIEWER}",
"${AFFILIATE}"
]`;

const NOT_ADMIN = `[
"${CMS_ADMIN}", 
"${SELF_LEARNER}", 
"${SCHOOL_STUDENT}", 
"${UMS_ADMIN}", 
"${MENTOR}", 
"${MENTEE}",
"${UMS_VIEWER}", 
"${CMS_VIEWER}", 
"${CMS_UMS_VIEWER}"
]`;

const ALL_ROLES_ARRAY = [
  CMS_ADMIN,
  ADMIN,
  SELF_LEARNER,
  SCHOOL_STUDENT,
  UMS_ADMIN,
  MENTOR,
  MENTEE,
  PARENT,
  UMS_VIEWER,
  CMS_VIEWER,
  CMS_UMS_VIEWER,
  AFFILIATE,
];

export {
  CMS_ADMIN,
  ADMIN,
  SELF_LEARNER,
  SCHOOL_STUDENT,
  UMS_ADMIN,
  CMS_HEAD,
  NOT_CMS_HEAD,
  UMS_HEAD,
  NOT_UMS_HEAD,
  ALL_ROLES,
  NOT_ADMIN,
  MENTOR,
  MENTEE,
  ALL_ROLES_ARRAY,
  PARENT,
  UMS_VIEWER,
  CMS_VIEWER,
  CMS_UMS_VIEWER,
  UMS_HEAD_AND_MENTOR,
  NOT_UMS_HEAD_AND_MENTOR,
  AFFILIATE,
};
