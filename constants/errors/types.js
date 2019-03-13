import { createError } from 'apollo-errors';

export const NestingLevelExceedingError = createError('NestingLevelExceedingError', {
  message: 'Nesting level in mutation must not exceed one.',
});

export const BiDirectionalRelationsRequiredError = createError('BiDirectionalRelationsRequiredError', {
  message: 'relation needs to exist on both types',
});

export const NoUniqueFieldError = createError('NoUniqueFieldError', {
  message: 'No unique field found in relation fields',
});

export const RelationAppliedOnSameFieldsError = createError('RelationAppliedOnSameFieldsError', {
  message: 'Fields connected by a relation cannot have the same name.',
});

export const RemoteRelationError = createError('RemoteRelationError', {
  message: 'If a relation field belongs to a remote application',
});
export const DefaultDirectiveAppliedOnWrongFieldError = createError('DefaultDirectiveAppliedOnWrongFieldError', {
  message: 'Default field is allowed only on scalar and enum types.',
});

export const InvalidDateFormatError = createError('InvalidDateFormatError', {
  message: 'Input Date is of invalid format',
});

export const UnsupportedListFieldInsideSubDocumentObjectError = createError('UnsupportedListFieldInsideSubDocumentObjectError', {
  message: 'List field inside sub document object is not supported. Prefer flat hierarchy here.',
});
