import getAllFileRelationsAndFields from './getAllFileRelationsAndFields';
import fetchFileCountInRelatedCollection from './fetchFileCountInRelatedCollection';

const getFileUsageCountByFileId = (fileId) => {
  let usageCount = 0;
  const promiseArray = [];
  const collectionAndFieldArray = getAllFileRelationsAndFields();
  collectionAndFieldArray.forEach((collectionAndField) => {
    const { collectionName, fieldName } = collectionAndField;
    promiseArray.push(fetchFileCountInRelatedCollection(collectionName, fieldName, fileId));
  });
  return Promise.all(promiseArray).then((usageCounts) => {
    usageCounts.forEach((count) => {
      usageCount += count;
    });
    return usageCount;
  });
};
export default getFileUsageCountByFileId;
