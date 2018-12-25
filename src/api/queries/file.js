const getfileNameWhichArePresent = (imageArray) => {
  const query =
          ` query {
          files(filter:{
            name_in:[${imageArray}]
          }) {
            id
            name
          }
        }
        `;
  return query;
};
const getAllfilesQuery = (filter) => {
  const query =
          ` query {
                files(filter:${filter}) {
                    id
                    name
                  }
                }
        `;
  return query;
};

const fileAddQuery = () => {
  const query =
      `mutation($input: FileInput!) {
        addFile(input: $input) {
          id
        }
      }`;
  return query;
};

const getFilesListQuery = () => {
  const query = ` query {
        files {
        id
        name
        uri
    }
  }
`;
  return query;
};

export { getfileNameWhichArePresent, fileAddQuery, getFilesListQuery,
  getAllfilesQuery };
