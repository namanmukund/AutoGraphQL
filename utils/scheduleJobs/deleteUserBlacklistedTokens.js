import { log } from '../log';
import { MutationController } from '../../src/autoGenerate/graphql/controllers';

const deleteUserBlacklistedTokens = async () => {
  const previousWeekISOEndDate = new Date(new Date().setDate(new Date().getDate() - 6)).toISOString();
  const blackListedTokenType = new MutationController('BlacklistedToken', { bypass: true });
  const res = await blackListedTokenType.deleteMany({ createdAt: { $lte: previousWeekISOEndDate }, type: 'userToken' });

  // const res = await deleteBlacklistedTokens({previousWeekISOEndDate});
  log(`Deleted ${res ? res.deletedCount || 0 : 0} blacklisted tokens.`);
};

export default deleteUserBlacklistedTokens;
