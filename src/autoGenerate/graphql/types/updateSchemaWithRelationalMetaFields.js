import insertSubString from '../../../../utils/insertSubString';
import { META } from '../../../../constants';

const getFilterName = (typeName) => `${typeName}Filter`;

// const parsedASTMap = getParsedASTMap(schemaTypes);
const updateSchemaWithRelationalMetaFields = (parsedASTMap, schemaTypes) => {
  Object.keys(parsedASTMap)
    .forEach((type) => {
      const definition = parsedASTMap[type];
      const { name, field, relationFields } = definition;
      const typeName = name.value;
      const relationalFieldNamesArray = Object.keys(relationFields);
      if (relationalFieldNamesArray && relationalFieldNamesArray.length) {
        relationalFieldNamesArray.forEach((fieldName) => {
          const fieldDefinition = field[fieldName];
          const fieldType = fieldDefinition.type;
          const directivesObject = fieldDefinition.directive;
          const finalRelationKey = fieldDefinition.type.dataType;
          const relationFilterName = getFilterName(finalRelationKey);
          if (directivesObject && directivesObject.relation) {
            if (fieldType.isList) {
              const relationMetaFieldSchemaString = ` ${fieldName}${META}(filter : ${relationFilterName}): AggregationResult @relationalMeta @filterOff`;
              schemaTypes.some((schemaTypeString, index) => {
                if (!schemaTypeString.includes(`${typeName} @model`)) {
                  return false;
                }
                const stringEndIndex = schemaTypeString.lastIndexOf('}');
                // append additional relation meta fields
                const appendedTypeString = insertSubString(schemaTypeString,
                  stringEndIndex, relationMetaFieldSchemaString);
                // eslint-disable-next-line no-param-reassign
                schemaTypes[index] = appendedTypeString;
                return true;
              });
            }
          }
        });
      }
    });
  return schemaTypes;
};

export default updateSchemaWithRelationalMetaFields;
