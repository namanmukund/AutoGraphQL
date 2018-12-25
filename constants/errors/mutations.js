import { createError } from 'apollo-errors';

export const RelationValuesExistError = createError('RelationValuesExistError', {
  message: 'One or more relation values already exist',
});

export const ConnectMutationsArgumentsLimitError = createError('ConnectMutationsArgumentsLimitError', {
  message: 'The connect mutation should only have two arguments',
});

export const OneToOneRelationSentInInputAndAsConnectError = createError('OneToOneRelationSentInInputAndAsConnectError', {
  message: '1-1 relation fields can have only one value, but more than one values input',
});

export const RelationMutationSimilarTypeArgumentError = createError('RelationMutationSimilarTypeArgumentError', {
  message: 'Argument passed in the relation mutation cannot be of the same type',
});


export const MultipleArrayOperationDeniedError = createError('MultipleArrayOperationDeniedError', {
  message: 'Only single operation can be done in an array field on a mutation',
});

export const InvalidArrayUpdateOperationError = createError('InvalidArrayUpdateOperationError', {
  message: 'updateWhere and updateWith inside array update can only be used in conjunction',
});
