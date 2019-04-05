import { userActionType } from '../../../../../../constants';

const { next, back, appClose } = userActionType;
const UserActionType = `
  enum UserActionType {
      ${next}
      ${back}
      ${appClose}
  }`;

export default UserActionType;
