import { DatabaseRecordNotFoundError } from '../../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

export const idBasedOnCodeAndModel = async (query, typeName) => {
  const response = await callLocalGraphqlApi(query);
  if (!response || !response.data || response.data[typeName] === null) {
    throw new DatabaseRecordNotFoundError();
  }
  return response.data[typeName].id;
};
