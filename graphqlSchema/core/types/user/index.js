import User from './User';
import SignUpInput from './SignUpInput';
import SignUpAffiliateInput from './SignUpAffiliateInput';
import LoginInput from './LoginInput';
import ExistingUserInput from './ExistingUserInput';
import SignupOrLoginUserInput from './SignupOrLoginUserInput';
import SocialLoginInput from './SocialLoginInput';
import EmailLoginInput from './EmailLoginInput';
import ValidateUserInput from './ValidateUserInput';

export default [
  ...User, ...SignUpInput,
  ...SignUpAffiliateInput,
  ...LoginInput, ExistingUserInput,
  SignupOrLoginUserInput,
  ...SocialLoginInput,
  ...EmailLoginInput,
  ValidateUserInput,
];
