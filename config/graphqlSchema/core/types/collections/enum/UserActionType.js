import { userActionType } from '../../../../../../constants';

const { next, back, appClose, skip } = userActionType;
const UserActionType = `
  enum UserActionType {
      ${next}
      ${back}
      ${appClose}
      ${skip}
  }`;

export default UserActionType;
