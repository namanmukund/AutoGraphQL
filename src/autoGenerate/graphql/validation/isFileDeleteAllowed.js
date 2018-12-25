import { QueryController } from '../controllers';
import { DatabaseRecordNotFoundError } from '../../../../constants/errors';
/*
The function will only allow a file to be deleted if its usageCount is zero
*/
const isFileDeleteAllowed = (params) => {
  const { id } = params;
  const query = {
    id,
  };
  const typeName = 'File';
  const newAuthentication = {
    bypass: true,
  };
  const modelQueries = new QueryController(typeName, newAuthentication);
  return modelQueries.fetchOne(query)
    .then((result) => {
      if (!result) {
        throw new DatabaseRecordNotFoundError({ data: { type: 'File' } });
      }
      const { usageCount } = result;
      let isDeleteAllowed = true;
      if (usageCount && usageCount > 0) {
        isDeleteAllowed = false;
      }
      return isDeleteAllowed;
    });
};

export default isFileDeleteAllowed;
