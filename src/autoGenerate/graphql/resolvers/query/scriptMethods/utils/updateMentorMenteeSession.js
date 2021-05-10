import { MutationController } from '../../../../controllers';

const updateMentorMenteeSession = async (id, modifiedData) => {
  const modelMutations = new MutationController('MentorMenteeSession', { bypass: true });
  const data = await modelMutations.updateOne({ id }, modifiedData);
  return data;
};

export default updateMentorMenteeSession;
