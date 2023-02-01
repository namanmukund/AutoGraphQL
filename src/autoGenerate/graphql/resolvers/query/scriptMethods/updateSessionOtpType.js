import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { MutationController } from '../../../controllers';

const getSchoolSessions = async () => {
  const query = `
    query{
      schoolSessionOtps {
        id
        otp
      }
    }
`;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.schoolSessionOtps', []);
};

const updateSessionOtpType = async () => {
  const newAuthentication = {
    bypass: true,
  };
  const schoolSessions = await getSchoolSessions();
  if (schoolSessions && schoolSessions.length) {
    // eslint-disable-next-line no-restricted-syntax
    for (const session of schoolSessions) {
      const sessionId = get(session, 'id');
      const otp = get(session, 'otp');
      if (sessionId) {
        const controller = new MutationController('SchoolSessionOtp', newAuthentication);
        // eslint-disable-next-line no-await-in-loop
        await controller.updateOne({ id: sessionId }, { otp: otp.toString() });
      }
    }
  }
};

export default updateSessionOtpType;
