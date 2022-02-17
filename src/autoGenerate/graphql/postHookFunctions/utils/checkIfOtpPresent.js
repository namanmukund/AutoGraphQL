import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const checkIfOtpPresent = async (otp) => {
  const query = `
    query{
      batchSessions(filter:{and:[
        {
          schoolSessionsOtp_some:{
            otp:${otp}
          }
        }
      ]}){
          id
        }
      }`;
  const result = await callLocalGraphqlApi(query);
  const otpAlreadyPresent = get(
    result,
    'data.batchSessions[0]',
    null,
  );
  return Boolean(otpAlreadyPresent); // converting to boolean
};

export default checkIfOtpPresent;
