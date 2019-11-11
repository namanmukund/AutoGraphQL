import { camelCase } from 'lodash';
import pluralize from 'pluralize';
import { genericApiToFetchRelatedObjectQueryBasedOnTypeId } from '../../../../../api/queries';
import { ConnectionNotExistError } from '../../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const isRelationBetweenTwoModelsOrNot = async (relationObject, typeName, typeField) => {
  const { typeId, relatedTypeId } = relationObject;
  const pluralTypeName = camelCase(pluralize(typeName));
  const queryBasedOnTypeAndRelatedField = genericApiToFetchRelatedObjectQueryBasedOnTypeId(
    camelCase(typeField), relatedTypeId, pluralTypeName, typeId,
  );

  const response = await callLocalGraphqlApi(queryBasedOnTypeAndRelatedField);
  if (response && response.data && response.data[pluralTypeName]) {
    if (response.data[pluralTypeName].length) {
      return true;
    }
    throw new ConnectionNotExistError();
  }
  return true;
};
export { isRelationBetweenTwoModelsOrNot };
