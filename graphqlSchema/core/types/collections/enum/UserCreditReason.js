import { userCreditReasons } from '../../../../../constants/userCreditReason';

export const getUserCreditReasonEnum = () => {
  let userCreditReasonEnum = 'enum UserCreditReason {';
  userCreditReasons.forEach((userCreditReason) => {
    userCreditReasonEnum += `${userCreditReason} `;
  });
  userCreditReasonEnum += '}';
  return userCreditReasonEnum;
};

const UserCreditReason = getUserCreditReasonEnum();


export default UserCreditReason;
