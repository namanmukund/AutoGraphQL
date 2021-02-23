/* eslint-disable no-await-in-loop, no-console */
import { get } from 'lodash';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const fetchUserApprovedCodeReactionLogs = async (
  reactedByID,
  userApprovedCodeID) => {
  const query = `{
      userApprovedCodeReactionLogs(filter:{and:[
          {reactedBy_some:{id:"${reactedByID}"}},
          {userApprovedCode_some:{id:"${userApprovedCodeID}"}}
        ]}) {
        id
        heart
        celebrate
        hot
        reactedBy {
            id
        }
        userApprovedCode {
            id
        }
      }
    }`;
  const response = await callLocalGraphqlApi(query);
  return get(response, 'data.userApprovedCodeReactionLogs[0]');
};

const updateUserApprovedCodeReactionLog = async (
  userApprovedCodeReactionLogId,
  heart,
  celebrate,
  hot,
) => {
  const query = `
  mutation {
      updateUserApprovedCodeReactionLog(
          id:"${userApprovedCodeReactionLogId}",
          input:{
              heart: ${heart},
              celebrate: ${celebrate},
              hot: ${hot},
            }) {
        id
      }
    }`;
  const response = await callLocalGraphqlApi(query);
  return get(response, 'data.updateUserApprovedCodeReactionLog.id');
};

const addUserApprovedCodeReactionLog = async (
  reactedByID,
  userApprovedCodeID,
  variables,
) => {
  const query = `
  mutation($input:UserApprovedCodeReactionLogInput!){
      addUserApprovedCodeReactionLog(
          input:$input,
          userConnectId:"${reactedByID}"
          reactedByConnectId:"${reactedByID}",
          userApprovedCodeConnectId:"${userApprovedCodeID}"
          ) {
        id
      }
    }`;
  const response = await callLocalGraphqlApi(query, '', variables);
  return get(response, 'data.addUserApprovedCodeReactionLog');
};

const fetchUserApprovedCode = async (userApprovedCodeID) => {
  const query = `{
      userApprovedCode(id:"${userApprovedCodeID}") {
        id
        heartReactionCount
        celebrateReactionCount
        hotReactionCount
        totalReactionCount
      }
    }`;
  const response = await callLocalGraphqlApi(query);
  return get(response, 'data.userApprovedCode');
};

const updateUserApprovedCode = async (userApprovedCodeID, inputData) => {
  const query = `
  mutation($input: UserApprovedCodeUpdate!){
      updateUserApprovedCode(
          id:"${userApprovedCodeID}"
          input:$input,
          ) {
        id
      }
    }`;
  const response = await callLocalGraphqlApi(query, '', { input: inputData });
  return get(response, 'data.addUserApprovedCodeReactionLog');
};

const mapReactionLogsWithUserApprovedCodeReactionCount = (prevReactionLogData, input, userApprovedCode) => {
  const userApprovedCodeReactionCountInput = {
    heartReactionCount: get(userApprovedCode, 'heartReactionCount', 0),
    celebrateReactionCount: get(userApprovedCode, 'celebrateReactionCount', 0),
    hotReactionCount: get(userApprovedCode, 'hotReactionCount', 0),
    totalReactionCount: get(userApprovedCode, 'totalReactionCount', 0),
  };
  if (input.heart && !prevReactionLogData.heart) {
    userApprovedCodeReactionCountInput.heartReactionCount += 1;
  }
  if (input.celebrate && !prevReactionLogData.celebrate) {
    userApprovedCodeReactionCountInput.celebrateReactionCount += 1;
  }
  if (input.hot && !prevReactionLogData.hot) {
    userApprovedCodeReactionCountInput.hotReactionCount += 1;
  }
  if (!input.heart && prevReactionLogData.heart) {
    userApprovedCodeReactionCountInput.heartReactionCount -= 1;
  }
  if (!input.celebrate && prevReactionLogData.celebrate) {
    userApprovedCodeReactionCountInput.celebrateReactionCount -= 1;
  }
  if (!input.hot && prevReactionLogData.hot) {
    userApprovedCodeReactionCountInput.hotReactionCount -= 1;
  }
  userApprovedCodeReactionCountInput.totalReactionCount = userApprovedCodeReactionCountInput.heartReactionCount
          + userApprovedCodeReactionCountInput.celebrateReactionCount
          + userApprovedCodeReactionCountInput.hotReactionCount;
  return userApprovedCodeReactionCountInput;
};

const updateVisitorReactionOnUserApprovedCode = async (root, params, context) => {
  await validateAuthentication(context);
  const {
    reactedByID, userApprovedCodeID, heart, celebrate, hot,
  } = params;
  if (!reactedByID || !userApprovedCodeID) {
    throw new MissingMandatoryInputInRequestError();
  }

  try {
    const userApprovedCodeData = await fetchUserApprovedCode(userApprovedCodeID);
    const reactionLog = await fetchUserApprovedCodeReactionLogs(
      reactedByID,
      userApprovedCodeID,
    );
    if (reactionLog) {
      const updateReactionLogResponse = await updateUserApprovedCodeReactionLog(
        get(reactionLog, 'id'),
        heart,
        celebrate,
        hot,
      );
      if (updateReactionLogResponse) {
        const userApprovedCodeInputData = await mapReactionLogsWithUserApprovedCodeReactionCount(
          reactionLog,
          {
            hot,
            heart,
            celebrate,
          },
          userApprovedCodeData,
        );

        await updateUserApprovedCode(userApprovedCodeID, userApprovedCodeInputData);
        return {
          result: true,
        };
      }
    } else {
      const variables = {
        input: {
          hot,
          heart,
          celebrate,
        },
      };
      await addUserApprovedCodeReactionLog(reactedByID, userApprovedCodeID, variables);
      const userApprovedCodeInputData = {
        heartReactionCount: heart
          ? userApprovedCodeData.heartReactionCount + 1
          : userApprovedCodeData.heartReactionCount,
        celebrateReactionCount: celebrate
          ? userApprovedCodeData.celebrateReactionCount + 1
          : userApprovedCodeData.celebrateReactionCount,
        hotReactionCount: hot
          ? userApprovedCodeData.hotReactionCount + 1
          : userApprovedCodeData.hotReactionCount,
        totalReactionCount: 0,
      };
      userApprovedCodeInputData.totalReactionCount = userApprovedCodeInputData.heartReactionCount
              + userApprovedCodeInputData.celebrateReactionCount
              + userApprovedCodeInputData.hotReactionCount;

      await updateUserApprovedCode(userApprovedCodeID, userApprovedCodeInputData);
      return {
        result: true,
      };
    }
  } catch (e) {
    return {
      error: e,
    };
  }
};

export default updateVisitorReactionOnUserApprovedCode;
