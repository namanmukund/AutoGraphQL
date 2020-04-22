import { ALL_ROLES_ARRAY } from '../../../../../constants/roles';

export const getUserRoleEnum = () => {
  let userRoleEnum = 'enum UserRole {';
  ALL_ROLES_ARRAY.forEach((role) => {
    userRoleEnum += `${role} `;
  });
  userRoleEnum += '}';
  return userRoleEnum;
};

const UserRole = getUserRoleEnum();

export default UserRole;
