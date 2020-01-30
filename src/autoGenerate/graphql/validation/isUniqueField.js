import { get } from 'lodash';
import { QueryController } from '../controllers';
import { OrderAlreadyExistsError } from '../../../../constants/errors';


const isUniqueField = (params, collection) => {
  const newAuthentication = {
    bypass: true,
  };
  const modelQueries = new QueryController(collection, newAuthentication);

  const { order } = get(params, 'input');
  if (params.input.order) {
    return modelQueries.fetchOne({ order })
      .then((result) => {
        if (result) throw new OrderAlreadyExistsError();
      });
  }
};
export default isUniqueField;
