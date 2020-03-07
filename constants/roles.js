const CONTENT_MANAGER = 'contentManager';
const ADMIN = 'admin';
const SELF_LEARNER = 'selfLearner';
const STUDENT = 'student';
const USER_MANAGER = 'userManager';

const CMS_HEAD = `["${ADMIN}", "${CONTENT_MANAGER}"]`;
const NOT_CMS_HEAD = `["${SELF_LEARNER}", "${STUDENT}", "${USER_MANAGER}"]`;
const UMS_HEAD = `["${ADMIN}", "${USER_MANAGER}"]`;
const NOT_UMS_HEAD = `["${CONTENT_MANAGER}", "${SELF_LEARNER}", "${STUDENT}"]`;
const ALL_ROLES = `["${ADMIN}", "${CONTENT_MANAGER}", "${SELF_LEARNER}", "${STUDENT}", "${USER_MANAGER}"]`;
const NOT_ADMIN = `["${CONTENT_MANAGER}", "${SELF_LEARNER}", "${STUDENT}", "${USER_MANAGER}"]`;

export {
  CONTENT_MANAGER,
  ADMIN,
  SELF_LEARNER,
  STUDENT,
  USER_MANAGER,
  CMS_HEAD,
  NOT_CMS_HEAD,
  UMS_HEAD,
  NOT_UMS_HEAD,
  ALL_ROLES,
  NOT_ADMIN,
};
