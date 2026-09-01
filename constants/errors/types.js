import { createError } from 'apollo-errors';

export const NestingLevelExceedingError = createError('NestingLevelExceedingError', {
  message: 'Nesting level in mutation must not exceed one.',
});

export const BiDirectionalRelationsRequiredError = createError('BiDirectionalRelationsRequiredError', {
  message: 'Relation must be defined on both associated types',
});

export const NoUniqueFieldError = createError('NoUniqueFieldError', {
  message: 'No unique field found in relation fields',
});

export const RelationAppliedOnSameFieldsError = createError('RelationAppliedOnSameFieldsError', {
  message: 'Fields connected by a relation cannot have the same name.',
});

export const RemoteRelationError = createError('RemoteRelationError', {
  message: 'Error resolving relation across remote applications',
});

export const DefaultDirectiveAppliedOnWrongFieldError = createError('DefaultDirectiveAppliedOnWrongFieldError', {
  message: 'Default directive is allowed only on scalar and enum types.',
});

export const InvalidDateFormatError = createError('InvalidDateFormatError', {
  message: 'Input Date format is invalid',
});

export const UnsupportedListFieldInsideSubDocumentObjectError = createError('UnsupportedListFieldInsideSubDocumentObjectError', {
  message: 'List fields inside sub-documents are not supported. Prefer flat hierarchy here.',
});

export const InvalidRuleValueError = createError('InvalidRuleValueError', {
  message: 'Only accepted rules are allow and deny',
});

export const SubscriptionKeyNotDefinedError = createError('SubscriptionKeyNotDefinedError', {
  message: 'Subscription Key is required to iterate.',
});

export const InvalidSubscriptionKeyError = createError('InvalidSubscriptionKeyError', {
  message: 'Subscription Key must be an array.',
});
