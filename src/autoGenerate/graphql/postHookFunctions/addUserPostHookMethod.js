import { get } from 'lodash';
import { MENTOR } from '../../../../constants/roles';
import generateMentorChild from './utils/generateMentorChild';

const addUserPostHookMethod = async (input, params) => {
  if (get(params, 'input.role') === MENTOR) {
    const mentorId = get(input, 'id');
    const mentorName = get(input, 'name');
    const { mentorConnectId } = await generateMentorChild(mentorId, mentorName);
    Object.assign(input, {
      mentorProfile: {
        type: 'MentorProfile',
        typeId: mentorConnectId,
      },
    });
  }
};

export default addUserPostHookMethod;
