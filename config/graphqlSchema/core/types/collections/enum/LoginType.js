import loginType from '../../../../../../constants/loginType';

const { facebook, gmail, tekieLearningApp } = loginType;
const LoginType = `
  enum LoginType {
    ${facebook}
    ${gmail}
    ${tekieLearningApp}
  }`;

export default LoginType;
