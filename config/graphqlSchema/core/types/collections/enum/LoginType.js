import loginType from '../../../../../../constants/loginType';

const { facebook, gmail } = loginType;
const LoginType = `
  enum LoginType {
    ${facebook}
    ${gmail}
  }`;

export default LoginType;
