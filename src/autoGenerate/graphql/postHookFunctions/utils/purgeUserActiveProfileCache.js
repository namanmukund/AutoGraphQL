import { callLocalGraphqlApi } from '../../../../api';

const purgeUserActiveProfileCache = async (context) => {
  try {
    await callLocalGraphqlApi(`
            query{
              purgeCache(pattern: "userProfile::activeClassroom::*") {
                result
              }
            }
          `, context);
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

export default purgeUserActiveProfileCache;
