import { get } from 'lodash';
import toObject from '../../../../../utils/toObject';
import { QueryController } from '..';

// params: {'_id', typename}
const getHistoryModelFromId = (historyModelId, typeName) => {
  const historyModelName = `${typeName}History`;
  const queryModel = new QueryController(historyModelName, { bypass: true });
  const queryParams = { _id: historyModelId };
  return queryModel.fetchMultiple(queryParams);
};

const appendModelHistoryToQueriedResult = (resultArray, typeName) => {
  const promiseArray = resultArray.map(async (record) => {
    const doc = toObject(record);
    /* eslint-disable no-underscore-dangle */
    const historyModelId = doc._id;
    /* eslint-enable no-underscore-dangle */
    const historyModel = await getHistoryModelFromId(historyModelId, typeName);
    doc.history = get(historyModel, '[0]data');
    return doc;
  });
  return Promise.all(promiseArray);
};

export default appendModelHistoryToQueriedResult;
