/* eslint-disable no-restricted-syntax */
import { get } from 'lodash';
import { callLocalGraphqlApi } from '../../src/api';
import { log } from '../log';

const getUserBlackListedTokens = async (previousWeekISOEndDate) => {
  const blacklistedTokenQuery = `{
  blacklistedTokens(
    filter: { and: [
      { createdAt_lte: "${previousWeekISOEndDate}" }, 
      { type: userToken }
    ] }
  ) {
    id
  }
}
`;
  const blacklistedTokenRes = await callLocalGraphqlApi(blacklistedTokenQuery);
  return get(blacklistedTokenRes, 'data.blacklistedTokens', []);
};

const deleteBlacklistedTokens = async (blacklistedTokens) => {
  const deleteBlacklistedTokenQuery = `mutation {
    deleteBlacklistedTokens(
      filter: { id_in: [${blacklistedTokens.map((token) => `"${token.id}"`).join(', ')}] }
    ) {
      id
    }
  }`;
  const deleteBlacklistedTokenRes = await callLocalGraphqlApi(deleteBlacklistedTokenQuery);
  return get(deleteBlacklistedTokenRes, 'data.deleteBlacklistedTokens', []);
};

const deleteUserBlacklistedTokens = async () => {
  const previousWeekISOEndDate = new Date(new Date().setDate(new Date().getDate() - 6)).toISOString();

  const blacklistedTokens = await getUserBlackListedTokens(previousWeekISOEndDate);
  if (blacklistedTokens && blacklistedTokens.length) {
    const res = await deleteBlacklistedTokens(blacklistedTokens);
    log(`Deleted ${res.length} blacklisted tokens.`);
  }
};

export default deleteUserBlacklistedTokens;
