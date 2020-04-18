const getUserFromDBQuery = (
  input,
  modelQueries,
) => {
  const { username, email, phone } = input;

  let query = {};
  if (username) query.username = username;
  if (email) query.email = email;
  if (phone) {
    const { countryCode, number } = phone;
    query = {
      'phone.countryCode': countryCode,
      'phone.number': number,
    };
  }
  return modelQueries.fetchOne(query);
};

export default getUserFromDBQuery;
