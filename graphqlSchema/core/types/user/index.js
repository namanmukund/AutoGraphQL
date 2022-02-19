import User from './User';
import SignUpInput from './SignUpInput';
import SignUpAffiliateInput from './SignUpAffiliateInput';
import LoginInput from './LoginInput';
import ExistingUserInput from './ExistingUserInput';
import SignupOrLoginUserInput from './SignupOrLoginUserInput';
import SocialLoginInput from './SocialLoginInput';
import EmailUsernameLoginInput from './EmailUsernameLoginInput';
import ValidateUserInput from './ValidateUserInput';
import ValidateMagicLinkInput from './ValidateMagicLinkInput';
import ResetPasswordAndLoginInput from './ResetPasswordAndLoginInput';
import SchoolLiveClassLoginInput from './SchoolLiveClassLoginInput';

export default [
  ...User, ...SignUpInput,
  ...SignUpAffiliateInput,
  ...LoginInput, ExistingUserInput,
  SignupOrLoginUserInput,
  ...SocialLoginInput,
  ...EmailUsernameLoginInput,
  ValidateUserInput,
  ValidateMagicLinkInput,
  ...ResetPasswordAndLoginInput,
  ...SchoolLiveClassLoginInput,
];
