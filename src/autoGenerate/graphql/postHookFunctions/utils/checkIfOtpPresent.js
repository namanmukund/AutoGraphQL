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
          schoolSessionsOtp{
            grade
            section
          }
        }
      }`;
  const result = await callLocalGraphqlApi(query);
  const otpAlreadyPresent = get(
    result,
    'data.batchSessions[0].schoolSessionsOtp[0]',
    null,
  );
  return !!otpAlreadyPresent; // converting to boolean
};

export default checkIfOtpPresent;
