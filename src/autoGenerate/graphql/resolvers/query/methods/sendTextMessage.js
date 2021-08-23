import validateAuthentication from '../../../../../../utils/validateAuthentication';
import { sendTextSms } from '../../../../../sms';

const sendTextMessage = async (root, params, context) => {
  validateAuthentication(context);
  const { phoneNumber, body } = params;

  sendTextSms(phoneNumber, body);

  return {
    result: true,
  };
};

export default sendTextMessage;
