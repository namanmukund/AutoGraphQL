import QueryController from '../../../../controllers/QueryController';

const getUserData = async (email, authentication) => {
  const queryController = new QueryController('User', authentication);
  return queryController.fetchOne({ email });
};

export default getUserData;
