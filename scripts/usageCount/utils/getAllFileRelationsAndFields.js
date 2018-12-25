import { getParsedASTMap, hasDirective } from '../../../src/autoGenerate/utils';
import { types } from '../../../utils';

const parsedASTMap = getParsedASTMap(types);
// The function creates a map of collection with the field name which are related to a file
const getAllFileRelationsAndFields = () => {
  const collectionAndFieldArray = [];
  Object.keys(parsedASTMap).forEach((typeMe) => {
    const definition = parsedASTMap[typeMe];
    const { directives } = definition;
    // if not model, then wont have relation fields so return
    const isModel = directives && hasDirective(directives, 'model');
    if (!isModel) {
      return;
    }
    const { field, localRelationFields } = parsedASTMap[typeMe];
    Object.keys(localRelationFields).forEach((fieldName) => {
      const dataType = field[fieldName].type.dataType;
      if (dataType === 'File') {
        collectionAndFieldArray.push({
          collectionName: typeMe,
          fieldName,
        });
      }
    });
  });
  return collectionAndFieldArray;
};
export default getAllFileRelationsAndFields;
