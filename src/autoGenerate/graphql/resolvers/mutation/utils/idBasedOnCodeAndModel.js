import callGraphqlApi from '../../../../../api/callGraphqlApi';
import { DatabaseRecordNotFoundError } from '../../../../../../constants/errors';

export const idBasedOnCodeAndModel = async (query, typeName) => {
  const response = await callGraphqlApi(query);
  if (!response || !response.data || response.data[typeName] === null) {
    throw new DatabaseRecordNotFoundError();
  }
  return response.data[typeName].id;
};
