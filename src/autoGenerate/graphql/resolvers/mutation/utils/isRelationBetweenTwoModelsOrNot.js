import { camelCase } from 'lodash';
import pluralize from 'pluralize';
import { genericApiToFetchRelatedObjectQueryBasedOnTypeId } from '../../../../../api/queries';
import callGraphqlApi from '../../../../../api/callGraphqlApi';
import { ConnectionNotExistError } from '../../../../../../constants/errors';

const isRelationBetweenTwoModelsOrNot = async (relationObject, typeName, typeField) => {
  const { typeId, relatedTypeId } = relationObject;
  const pluralTypeName = camelCase(pluralize(typeName));
  const queryBasedOnTypeAndRelatedField = genericApiToFetchRelatedObjectQueryBasedOnTypeId(
    camelCase(typeField), relatedTypeId, pluralTypeName, typeId,
  );

  const response = await callGraphqlApi(queryBasedOnTypeAndRelatedField);
  if (response && response.data && response.data[pluralTypeName]) {
    if (response.data[pluralTypeName].length) {
      return true;
    }
    throw new ConnectionNotExistError();
  }
  return true;
};
export { isRelationBetweenTwoModelsOrNot };
