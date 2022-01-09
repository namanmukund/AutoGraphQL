import { get } from 'lodash';
import { CommsVariableAlreadyExist } from '../../../../../constants/errors';
import { MissingMandatoryInputInRequestError } from '../../../../../constants/errors/input';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const fetchCommsDataField = async (dataField) => {
  const query = `
    {
        commsVariables(filter: { dataField: ${dataField}}) {
        id
      }
    }
    `;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.commsVariables', []);
};

const addCommsVariableValidation = async (params) => {
  const { input: { dataField, whatsappVariableName, emailVariableName } } = params;
  if (!dataField || !whatsappVariableName || !emailVariableName) {
    throw new MissingMandatoryInputInRequestError();
  }
  const commsVariables = await fetchCommsDataField(dataField);
  if (commsVariables && commsVariables.length > 0) {
    throw new CommsVariableAlreadyExist();
  }
  return true;
};

export default addCommsVariableValidation;
