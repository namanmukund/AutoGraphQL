import { QueryController } from '../../../src/autoGenerate/graphql/controllers';
// The function fetches the number of times a file contains relation with the given collection
const fetchFileCountInRelatedCollection = (collectionName, fieldName, fileId) => {
  const newAuthentication = {
    bypass: true,
  };
  const fieldNameAndTypeId = `${fieldName}.typeId`;
  const query = {};
  query[fieldNameAndTypeId] = fileId;

  const modelQuery = new QueryController(collectionName, newAuthentication);
  return modelQuery.fetchCount(query);
};

export default fetchFileCountInRelatedCollection;
