import moment from 'moment';
import { get } from 'lodash';
import { MutationController } from '../../../controllers';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { generateCuid } from '../../../../../../utils';
import { PHONE_OTP_LIMIT_PER_DAY, PHONE_OTP_MAX_RETRY_WAIT_SECOND } from '../../../../../../constants';
import { PhoneOtpMaxRetryTimeLimitError, PhoneOtpPerDayLimitError } from '../../../../../../constants/errors';

const USER_OTP_LOG_TYPE = 'UserOtpLog';

const FETCH_USER_OTP_LOG_META = (userId, fromDate, toDate) => `{
  userOtpLogsMeta(filter:{
    and:[
      {
        user_some:{
          id: "${userId}"
        }
      }
      {
        createdAt_gt: "${fromDate}"
      }
      {
        createdAt_lt: "${toDate}"
      }
    ]
  }){
    count
  }
}`;

const userLogsActivity = async (userData, phoneOtp, action) => {
  if (process.env.NODE_ENV !== 'production') return;
  if (action === 'addOTPLog') {
    const userOtpLogModelMutations = new MutationController(USER_OTP_LOG_TYPE, { bypass: true });
    const newUserOtpLog = {
      phoneOtp,
    };
    if (userData && userData.id) {
      newUserOtpLog.user = {
        type: 'User',
        typeId: userData.id,
      };
    }
    const userOtpLogData = generateCuid(newUserOtpLog);
    userOtpLogModelMutations.addDocument(userOtpLogData);
  } else if (action === 'phoneOTPTime') {
    const phoneOtpCreationDate = get(userData, 'phoneOtpCreationDate');
    if (phoneOtpCreationDate && Math.abs(moment().diff(moment(new Date(phoneOtpCreationDate)), 'seconds')) < PHONE_OTP_MAX_RETRY_WAIT_SECOND) {
      throw new PhoneOtpMaxRetryTimeLimitError();
    }
  } else if (action === 'OTPLimit') {
    // fetching userOtpLogs count for past 1 day for a user
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 1);
    const userOtpLogMetaRes = await callLocalGraphqlApi(FETCH_USER_OTP_LOG_META(get(userData, 'id'), fromDate, new Date()));
    const userOtpLogCount = get(userOtpLogMetaRes, 'data.userOtpLogsMeta.count', 0);
    if (userOtpLogCount >= PHONE_OTP_LIMIT_PER_DAY) {
      throw new PhoneOtpPerDayLimitError();
    }
  }
};

export default userLogsActivity;
