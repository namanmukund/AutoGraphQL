/* eslint-disable */
import { get } from 'lodash';
import getUsersWithNoSignUpBonus from './getUsersWithNoSignUpBonus';
import getUserCreditId from './getUserCreditId';
import updateUserCreditsCount from './updateUserCreditsCount';
import { SIGN_UP_BONUS } from '../../../../../../../constants/userCreditReason';
import addUserCredit from './addUserCredit';
import { REGISTRATION_BASE_CREDIT } from '../../../../../../../constants';
import updateUser from './updateUser';
import { sendTextSms } from '../../../../../../sms';

const updateSignUpBonusCreditToUser = async () => {
  const users = await getUsersWithNoSignUpBonus();
  if (users && users.length) {
    console.log('**********Total Users***********: ', users.length);
    for (const user of users) {
      console.log("....11111", user)
      const { id: userId, name } = user;
      if (name) {
        console.log('Processing for user: ', name);
      } else {
        console.log('Processing for user: ', userId);
      }
      const userCreditId = await getUserCreditId(userId);
      // update credit if userCreditId exist else add it
      if (userCreditId) {
        console.log('---------Updating credit for user-----------');
        await updateUserCreditsCount(REGISTRATION_BASE_CREDIT, userId, 'inc', SIGN_UP_BONUS);
      } else {
        console.log('---------Adding credit for user-----------');
        await addUserCredit(REGISTRATION_BASE_CREDIT, userId, SIGN_UP_BONUS);
      }
      const variables = {
        input: {
          signUpBonusCredited: true,
          signUpBonusNotified: false,
        },
      };
      await updateUser(userId, variables);
      // send sms
      const {  phone } = get(user, 'studentProfile.parents[0].user');
      if (name && phone) {
        const phoneNumber = `${phone.countryCode}${phone.number}`;
        const smsText = `Gift for future entrepreneurs: ₹1000 for your kid ${name}! Use it to purchase our course or get it transferred into your bank account(T&C applied). For more visit https://www.tekie.in`;
        sendTextSms(phoneNumber, smsText);
      }
    }
  } else {
    console.log('There are no users to process');
  }
};


export default updateSignUpBonusCreditToUser;
