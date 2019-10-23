import { QueryController } from '../../../src/autoGenerate/graphql/controllers';
// the function fetches all the ids in file and store them in array
const getFileIds = () => {
  const newAuthentication = {
    bypass: true,
  };
  const query = {};
  const modelQuery = new QueryController('File', newAuthentication);
  return modelQuery.fetchMultiple(query).then((files) => files.map((file) => file.id));
};

export default getFileIds;
