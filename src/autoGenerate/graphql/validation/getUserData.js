import { QueryController } from '../controllers';
import { toObject } from '../../../../utils';

const getUserData = (id) => {
  const query = {
    id,
  };

  const typeName = 'User';
  const newAuthentication = {
    bypass: true,
  };
  const modelQueries = new QueryController(typeName, newAuthentication);
  return modelQueries.fetchOne(query)
    .then(result => toObject(result));
};

export default getUserData;
