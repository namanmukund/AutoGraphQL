import { get } from 'lodash';
import { OrderAlreadyExistsError } from '../../../../constants/errors';

import callGraphqlApi from '../../../api/callGraphqlApi';

// query to fetch id and order related to any collection.
const topicQuery = (collection) => `query{
${collection}{
    id
    order
  }
}
`;

const isUniqueField = async (params, collection, type) => {
  const topicQueryRes = await callGraphqlApi(topicQuery(collection));
  const topicInfo = get(topicQueryRes, `data.${collection}`);

  const topicInfoMap = await Object.assign({}, ...topicInfo.map((s) => ({ [s.id]: s.order })));

  const order = get(params, 'input.order')
  if (type === 'update') {
    if(Object.prototype.hasOwnProperty.call(topicInfoMap, params.id)) {
      if (topicInfoMap[params.id] !== order) {
        if (Object.values(topicInfoMap).indexOf(order) > -1) {
          throw new OrderAlreadyExistsError();
        }
      }
    }
  } else if (Object.values(topicInfoMap).indexOf(order) > -1) {
    throw new OrderAlreadyExistsError();
  }
};
export default isUniqueField;
