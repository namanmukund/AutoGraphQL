const genericFilterQueryToGetIds = (modal, field, connectionId) => {
  const query = `query {
        ${modal}(filter:{
          ${field}_some:{
            id:"${connectionId}"
          }
        }) {
          id
        }
      }`;
  return query;
};

const genericApiToFetchRelatedObjectQueryBasedOnTypeId = (
  typeName, id, relatedField, relatedFieldId) => {
  const query = `
          query {
        ${relatedField}(filter:{
        and:[
          {
          id:"${relatedFieldId}"
          }
          {
            ${typeName}_some:{
              id:"${id}"
            }
          }
        ]
        }) {
          id
        }
        }
          `;
  return query;
};

const genericSkipFirstQuery = (skip, first, modelName, fields, filter) => {
  const query = `query {
  ${modelName}(${filter} skip: ${skip} first:${first}) {
    ${fields}
  }
}
`;
  return query;
};

const genericFilterQuery = (modelName, outputKeys, filter) => {
  const query = `query {
  ${modelName}(${filter}) {
    ${outputKeys}
  }
}
`;
  return query;
};

export { genericFilterQueryToGetIds, genericSkipFirstQuery,
  genericApiToFetchRelatedObjectQueryBasedOnTypeId, genericFilterQuery };
