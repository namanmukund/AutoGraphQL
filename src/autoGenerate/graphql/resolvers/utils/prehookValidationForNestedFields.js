import { camelCase } from 'lodash';
import { prehook } from '../../preHook';

// TODO: Pass updated input params from prehook.
/**
 * If Aggregation mode is enabled prehooks are not invoked for nested fields.
 * so we are looping over each nested fields and calling corresponding Type's prehook.
 * */
const prehookValidationForNestedFields = async ({
  typeName,
  parsedASTMap,
  fieldsForFetch,
  context,
  params,
}) => {
  const queryFieldKeys = Object.keys(fieldsForFetch);
  // eslint-disable-next-line no-restricted-syntax
  for (const key of queryFieldKeys) {
    /* if field key is relation field then recursive strategy will be used
    to check the permission and throw error at once
    */
    if (Object.keys(parsedASTMap[typeName].relationFields)
      .includes(key)) {
      const subTypeName = parsedASTMap[typeName].field[key].type.dataType;
      // eslint-disable-next-line no-await-in-loop
      await prehook('', camelCase(subTypeName), context, params);

      // eslint-disable-next-line no-await-in-loop
      await prehookValidationForNestedFields({
        typeName: subTypeName,
        parsedASTMap,
        fieldsForFetch: fieldsForFetch[key],
        context,
        params,
      });
    }
  }
};

export default prehookValidationForNestedFields;
