import { MutationController } from '../../src/autoGenerate/graphql/controllers';

const updateScheduleStatusOfMenteeSession = (id, scheduleRunStatus) => {
  const modelMutations = new MutationController('MenteeSession', { bypass: true });
  return modelMutations.updateOne({ id }, { scheduleRunStatus });
};

export default updateScheduleStatusOfMenteeSession;
