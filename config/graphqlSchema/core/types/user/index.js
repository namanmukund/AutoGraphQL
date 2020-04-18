import User from './User';
import SignUpInput from './SignUpInput';
import LoginInput from './LoginInput';
import ExistingUserInput from './ExistingUserInput';
import SocialLoginInput from './SocialLoginInput';
import EmailLoginInput from './EmailLoginInput';


export default [
  ...User, ...SignUpInput,
  ...LoginInput, ExistingUserInput,
  ...SocialLoginInput,
  ...EmailLoginInput,
];
