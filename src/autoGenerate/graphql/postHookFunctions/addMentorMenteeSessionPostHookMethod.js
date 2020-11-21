import { get } from 'lodash';
import { setSessionStartedLeadsquared } from './leadsquared';
import getMenteeInfo from './utils/getMenteeInfo';
import getTopicInfo from './utils/getTopicInfo';

const addMentorMenteeSessionPostHookMethod = async (input, params, context) => {
  // add user on leadsquared
  const { currentUser } = context;
  const userInfo = await getMenteeInfo(get(currentUser, 'id'));
  const topicInfo = await getTopicInfo(get(params, 'topicConnectId'));
  if (get(input, 'sessionStatus') === 'started') {
    setSessionStartedLeadsquared(userInfo, topicInfo);
  }
};

export default addMentorMenteeSessionPostHookMethod;
