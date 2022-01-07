import { get } from 'lodash';
import { CommsDatafieldAlreadyExist } from '../../../../../constants/errors';
import { MissingMandatoryInputInRequestError } from '../../../../../constants/errors/input';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const fetchCommsDataField = async (dataField) => {
  const query = `
    {
        commsVariables(filter: { dataField_in: "${dataField}"}) {
        id
      }
    }
    `;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.commsVariables', []);
};

const addCommsVariableValidation = async (params) => {
  // check if the document for user is already present
  const dataField = get(params, 'userConnectId');
  const whatsappVariableName = get(params, 'whatsappVariableName');
  const emailVariableName = get(params, 'emailVariableName');

  if (!dataField) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'DataField is missing in input',
      },
    });
  }
  if (!whatsappVariableName) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'WhatsappVariableName is missing in input',
      },
    });
  }
  if (!emailVariableName) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'EmailVariableName is missing in input',
      },
    });
  }
  const commsVariables = await fetchCommsDataField(dataField);
  if (commsVariables && commsVariables.length > 0) {
    throw new CommsDatafieldAlreadyExist();
  }
  return true;
};

export default addCommsVariableValidation;
