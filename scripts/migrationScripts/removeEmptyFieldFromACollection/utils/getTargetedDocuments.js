import { QueryController } from '../../../../src/autoGenerate/graphql/controllers';

const getTargetedDocuments = (targetedCollection, targetedField) => {
  const query = {
    $and: [
      { [targetedField]: { $exists: true } },
      {
        $or: [
          { [targetedField]: null },
          { [targetedField]: '' },
        ],
      },
    ],
  };
  const newAuthentication = {
    bypass: true,
  };

  const modelQuery = new QueryController(targetedCollection, newAuthentication);
  return modelQuery.fetchMany(query);
};

export default getTargetedDocuments;
