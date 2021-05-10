/* eslint-disable no-await-in-loop, no-console */
import { get } from 'lodash';
import { MissingMandatoryInputInRequestError } from '../../../../../../constants/errors/input';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import reactions from '../../../../../../constants/reactions';
import updateUserApprovedCodeReactionsCount from './updateUserApprovedCodeReactionsCount';

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

const updateVisitorReactionOnUserApprovedCode = async (root, params, context) => {
  await validateAuthentication(context);
  const {
    reactedByID, userApprovedCodeID,
  } = params;
  if (!reactedByID || !userApprovedCodeID) {
    throw new MissingMandatoryInputInRequestError();
  }

  try {
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
        await updateUserApprovedCodeReactionsCount(
          reactionLog,
          reactionVariables.input,
          userApprovedCodeID,
        );
      }
    } else {
      /**
        * if ReactionLog Record not exists Create a new Record
        */
      await addUserApprovedCodeReactionLog(reactedByID, userApprovedCodeID, reactionVariables);
      /** Mapping Boolean Reaction Input to Actual Counts */
      await updateUserApprovedCodeReactionsCount(
        null,
        reactionVariables.input,
        userApprovedCodeID,
      );
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
