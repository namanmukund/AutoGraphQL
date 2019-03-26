import { userActionType } from '../../../../../../constants';

const UserActionType = `
  enum UserActionType {
      ${userActionType.next}
      ${userActionType.back}
      ${userActionType.appClose}
  }`;

export default UserActionType;
