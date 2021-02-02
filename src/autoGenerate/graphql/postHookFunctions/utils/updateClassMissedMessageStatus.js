import { MutationController } from '../../controllers';

const updateScheduleStatusOfMenteeSession = (id, classMissedMessageStatus) => {
  const modelMutations = new MutationController('MentorMenteeSession', { bypass: true });
  return modelMutations.updateOne({ id }, { classMissedMessageStatus });
};

export default updateScheduleStatusOfMenteeSession;
