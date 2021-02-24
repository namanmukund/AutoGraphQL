/* eslint-disable no-await-in-loop, no-console */
import { get } from 'lodash';
import { MissingMandatoryInputInRequestError } from '../../../../../../constants/errors/input';
import { DatabaseRecordNotFoundError } from '../../../../../../constants/errors/db';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import reactions from '../../../../../../constants/reactions';

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
  variables,
) => {
  const query = `
  mutation($input:UserApprovedCodeReactionLogUpdate!) {
      updateUserApprovedCodeReactionLog(
          id:"${userApprovedCodeReactionLogId}",
          input:$input) {
        id
      }
    }`;
  const response = await callLocalGraphqlApi(query, '', variables);
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
    totalReactionCount: get(userApprovedCode, 'totalReactionCount', 0),
  };
  reactions.forEach((reaction) => {
    userApprovedCodeReactionCountInput[`${reaction}ReactionCount`] = get(userApprovedCode, `${reaction}ReactionCount`, 0);
  });
  /** If previous ReactionLog record exists update count accordingly */
  if (prevReactionLogData && get(prevReactionLogData, 'id')) {
    reactions.forEach((reaction) => {
      if (typeof input[reaction] === 'boolean') {
        if (input[reaction] && !prevReactionLogData[reaction]) {
          userApprovedCodeReactionCountInput[`${reaction}ReactionCount`] += 1;
        }
        if (!input[reaction] && prevReactionLogData[reaction]) {
          userApprovedCodeReactionCountInput[`${reaction}ReactionCount`] -= 1;
        }
      }
    });
  } else {
    reactions.forEach((reaction) => {
      if (typeof input[reaction] === 'boolean') {
        userApprovedCodeReactionCountInput[`${reaction}ReactionCount`] = input[reaction]
          ? userApprovedCodeReactionCountInput[`${reaction}ReactionCount`] + 1
          : userApprovedCodeReactionCountInput[`${reaction}ReactionCount`];
      }
    });
  }
  let totalCount = 0;
  reactions.forEach((reaction) => {
    if (userApprovedCodeReactionCountInput[`${reaction}ReactionCount`]) {
      totalCount += userApprovedCodeReactionCountInput[`${reaction}ReactionCount`];
    }
  });
  userApprovedCodeReactionCountInput.totalReactionCount = totalCount;
  return userApprovedCodeReactionCountInput;
};

const updateVisitorReactionOnUserApprovedCode = async (root, params, context) => {
  await validateAuthentication(context);
  const {
    reactedByID, userApprovedCodeID,
  } = params;
  if (!reactedByID || !userApprovedCodeID) {
    throw new MissingMandatoryInputInRequestError();
  }

  try {
    const userApprovedCodeData = await fetchUserApprovedCode(userApprovedCodeID);
    if (!(userApprovedCodeData && get(userApprovedCodeData, 'id'))) {
      throw new DatabaseRecordNotFoundError();
    }
    const reactionLog = await fetchUserApprovedCodeReactionLogs(
      reactedByID,
      userApprovedCodeID,
    );

    const reactionVariables = { input: {} };
    reactions.forEach((reaction) => {
      if (typeof params[reaction] === 'boolean') {
        reactionVariables.input[reaction] = params[reaction];
      }
    });
    /** Check If ReactionLog Record Already Exists  */
    if (reactionLog && get(reactionLog, 'id')) {
      const updateReactionLogResponseId = await updateUserApprovedCodeReactionLog(
        get(reactionLog, 'id'),
        reactionVariables,
      );
      /** To ReactionLog update successfull then update UserApprovedCode reaction counts */
      if (updateReactionLogResponseId) {
        /** Mapping Boolean Reaction Input to Actual Counts */
        const userApprovedCodeInputData = await mapReactionLogsWithUserApprovedCodeReactionCount(
          reactionLog,
          reactionVariables.input,
          userApprovedCodeData,
        );

        await updateUserApprovedCode(userApprovedCodeID, userApprovedCodeInputData);
      }
    } else {
      /**
        * if ReactionLog Record not exists Create a new Record
        */
      await addUserApprovedCodeReactionLog(reactedByID, userApprovedCodeID, reactionVariables);
      /** Mapping Boolean Reaction Input to Actual Counts */
      const userApprovedCodeInputData = await mapReactionLogsWithUserApprovedCodeReactionCount(
        null,
        reactionVariables.input,
        userApprovedCodeData,
      );
      await updateUserApprovedCode(userApprovedCodeID, userApprovedCodeInputData);
    }
    return {
      result: true,
    };
  } catch (e) {
    return {
      error: e,
    };
  }
};

export default updateVisitorReactionOnUserApprovedCode;
