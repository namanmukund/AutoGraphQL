import { RelationAppliedOnSameFieldsError } from '../../../constants/errors';

const validateFieldToAddForConnectMutationGeneration = (fieldName, relatedTypeField) => {
  let isValid = false;
  if (fieldName === relatedTypeField) {
    throw new RelationAppliedOnSameFieldsError();
  }
  if (fieldName && fieldName !== relatedTypeField) {
    isValid = true;
  }
  return isValid;
};

export default validateFieldToAddForConnectMutationGeneration;
