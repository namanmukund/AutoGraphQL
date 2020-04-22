const CONTENT_MANAGER = 'contentManager';
const ADMIN = 'admin';
const SELF_LEARNER = 'selfLearner';
const SCHOOL_STUDENT = 'schoolStudent';
const USER_MANAGER = 'userManager';
const MENTOR = 'mentor';
const MENTEE = 'mentee';
const PARENT = 'parent';

const CMS_HEAD = `["${ADMIN}", "${CONTENT_MANAGER}"]`;
const NOT_CMS_HEAD = `["${SELF_LEARNER}", "${SCHOOL_STUDENT}", "${USER_MANAGER}", "${MENTOR}", "${MENTEE}"]`;
const UMS_HEAD = `["${ADMIN}", "${USER_MANAGER}"]`;
const NOT_UMS_HEAD = `["${CONTENT_MANAGER}", "${SELF_LEARNER}", "${SCHOOL_STUDENT}", "${MENTOR}", "${MENTEE}"]`;
const ALL_ROLES = `["${ADMIN}", "${CONTENT_MANAGER}", "${SELF_LEARNER}", "${SCHOOL_STUDENT}", "${USER_MANAGER}", "${MENTOR}", "${MENTEE}"]`;
const NOT_ADMIN = `["${CONTENT_MANAGER}", "${SELF_LEARNER}", "${SCHOOL_STUDENT}", "${USER_MANAGER}", "${MENTOR}", "${MENTEE}"]`;

const ALL_ROLES_ARRAY = [
  CONTENT_MANAGER,
  ADMIN,
  SELF_LEARNER,
  SCHOOL_STUDENT,
  USER_MANAGER,
  MENTOR,
  MENTEE,
  PARENT,
];

export {
  CONTENT_MANAGER,
  ADMIN,
  SELF_LEARNER,
  SCHOOL_STUDENT,
  USER_MANAGER,
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
};
