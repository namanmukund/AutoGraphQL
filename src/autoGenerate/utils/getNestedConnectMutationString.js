import { trimEnd } from 'lodash';
import { connectMutationsArgumentsSuffix, historyFieldName } from '../../../constants';

const getNestedConnectMutationString = (relationFields, type, parsedASTMap) => {
  let connectMutationString = '';
  Object.keys(relationFields).forEach((fieldName) => {
    if (fieldName === historyFieldName) {
      return;
    }
    const abc = parsedASTMap[type].field[fieldName];

    if (fieldName === 'user' || fieldName === 'pqAttemptedQuestions') {
      console.log(11111, abc);
    }
    // if field type is array
    if (parsedASTMap[type].field[fieldName].type.isList) {
      connectMutationString += `${fieldName}${connectMutationsArgumentsSuffix.plural} : [ID], `;
    } else {
      connectMutationString += `${fieldName}${connectMutationsArgumentsSuffix.singular} : ID, `;
    }
  });
  connectMutationString = trimEnd(connectMutationString, ',');
  return connectMutationString;
};

export default getNestedConnectMutationString;
