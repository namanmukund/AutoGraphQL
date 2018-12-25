// Return ture/false
import { nestingLevelCheck } from './nestingLevelCheck';
import {
  NestingLevelExceedingError,
  NoUniqueFieldError,
  RelationValuesExistError,
} from '../../../../../../constants/errors';
import { checkUniqueFieldsPresence } from './checkUniqueFieldsPresence';
import { ifDataExists } from './ifDataExists';

export const isRelationDataValid = async (fieldType, fieldValue, uniqueFieldForType,
  relatedModelQueries, ast, schemaType) => {
  let isValid = false;
  const isValidNesting = nestingLevelCheck(fieldType, fieldValue, ast, schemaType);
  if (!isValidNesting) {
    throw new NestingLevelExceedingError();
  }

  // check if any unique fields are present in the type,
  // if not present then dont throw error.
  const areUniqueFieldsPresentInTypeSchema = checkUniqueFieldsPresence(ast, schemaType);
  if (!uniqueFieldForType && areUniqueFieldsPresentInTypeSchema) {
    throw new NoUniqueFieldError();
  }

  // validate that none of the documents in the fieldvalue already exist
  if (uniqueFieldForType) {
    const isValidDataNewness = await ifDataExists(fieldType, fieldValue,
      uniqueFieldForType, relatedModelQueries);
    if (!isValidDataNewness) {
      throw new RelationValuesExistError();
    }
  }

  isValid = true;
  return isValid;
};
