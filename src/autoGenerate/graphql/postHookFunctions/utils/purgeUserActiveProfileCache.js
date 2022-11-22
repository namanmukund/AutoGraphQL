import { callLocalGraphqlApi } from '../../../../api';

const purgeCache = async (context, pattern) => {
  try {
    await callLocalGraphqlApi(
      `
        query{
          purgeCache(pattern: "${pattern}") {
            result
          }
        }
      `,
      context,
    );
    return {
      result: true,
    };
  } catch (e) {
    return {
      result: false,
      error: e,
    };
  }
};

const purgeUserActiveProfileCache = async (context) => {
  const res = await purgeCache(context, 'userProfile::activeClassroom::*');
  return res;
};

export default purgeUserActiveProfileCache;
