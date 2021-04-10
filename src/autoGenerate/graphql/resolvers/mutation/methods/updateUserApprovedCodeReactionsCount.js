import { get } from 'lodash';
import { MutationController } from '../../../controllers';
import reactions from '../../../../../../constants/reactions';

const updateUserApprovedCodeReactionsCount = (prevReactionLogData, input, userApprovedCodeID) => {
  const newAuthentication = {
    bypass: true,
  };
  let incrementedCount = 0;
  let decrementedCount = 0;
  const userApprovedCodeReactionCountInput = {};
  /** If previous ReactionLog record exists update count accordingly */
  if (prevReactionLogData && get(prevReactionLogData, 'id')) {
    reactions.forEach((reaction) => {
      if (typeof input[reaction] === 'boolean') {
        if (input[reaction] && !prevReactionLogData[reaction]) {
          incrementedCount += 1;
          userApprovedCodeReactionCountInput[`${reaction}ReactionCount`] = 1;
        }
        if (!input[reaction] && prevReactionLogData[reaction]) {
          decrementedCount -= 1;
          userApprovedCodeReactionCountInput[`${reaction}ReactionCount`] = -1;
        }
      }
    });
  } else {
    reactions.forEach((reaction) => {
      if (typeof input[reaction] === 'boolean') {
        userApprovedCodeReactionCountInput[`${reaction}ReactionCount`] = input[reaction]
          ? 1 : 0;
        incrementedCount = input[reaction] ? incrementedCount + 1 : incrementedCount;
      }
    });
  }
  userApprovedCodeReactionCountInput.totalReactionCount = incrementedCount + decrementedCount;
  const query = {
    id: userApprovedCodeID,
  };
  const updateObj = { $inc: userApprovedCodeReactionCountInput };
  const modelMutation = new MutationController('UserApprovedCode', newAuthentication);
  return modelMutation.update(query, updateObj);
};

export default updateUserApprovedCodeReactionsCount;
