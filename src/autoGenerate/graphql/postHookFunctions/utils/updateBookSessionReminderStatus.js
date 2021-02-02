import { MutationController } from '../../controllers';

const updateBookSessionReminderStatus = (id, isBookSessionReminderSent) => {
  const modelMutations = new MutationController('User', { bypass: true });
  return modelMutations.updateOne({ id }, { isBookSessionReminderSent });
};

export default updateBookSessionReminderStatus;
