const fetchUsers = (phone, email) => `
{
  users(filter: {
    and: [
      {role: parent}
      {or: [
        {phone_number_subDoc: "${phone}"}
        {email: "${email}"}
      ]}
    ]
  }){
    id
    name
    parentProfile{
      children{
        user{
          id
          name
        }
      }
    }
  }
}
`;

export default fetchUsers;
