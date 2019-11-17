import { QueryController } from '../controllers';
import { log } from '../../../../utils';
import { sendTextSms } from '../../../sms';

// this will send the sms to the user if it is first time user
const sendSmsIfFirstTimeUser = async (data) => {
  const authentication = {
    bypass: true,
  };
  const typeName = 'User';
  const modelQueries = new QueryController(typeName, authentication);
  const { lastTimeLoginDate, firstTimeLoginDate } = data;
  const id = data.account.typeId;
  // compare first time login and last login, if equal it is first time user
  if (lastTimeLoginDate && firstTimeLoginDate
    && lastTimeLoginDate.getTime() === firstTimeLoginDate.getTime()) {
    return modelQueries.fetchById(id).then((res) => {
      if (!res.name || !res.phone || !res.phone.countryCode || !res.phone.number) {
        log('Phone Or name is not present in the database');
        return false;
      }
      const phoneNumber = `${res.phone.countryCode}${res.phone.number}`;
      const smsText = 'sample text';
      sendTextSms(phoneNumber, smsText);
      return true;
    });
  }
  return true;
};

export default sendSmsIfFirstTimeUser;
