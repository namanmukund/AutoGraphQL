
const getUpdateUserMutation = (userId) => {
  const query =
    `mutation($input: UserUpdate!) {
        updateUser(id: "${userId}"  input: $input) {
          id
      }
     }`;
  return query;
};

const deleteUserMutation = (userId) => {
  const query = `mutation{
  deleteUser(id:"${userId}"){
    id
  }
}
`;
  return query;
};

export { getUpdateUserMutation, deleteUserMutation };
