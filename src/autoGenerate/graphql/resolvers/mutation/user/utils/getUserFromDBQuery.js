const getUserFromDBQuery = (
  input,
  modelQueries,
) => {
  const {
    username, email, phone, id,
  } = input;

  let query = {};
  if (username) query.username = username;
  if (email) query.email = email.trim().toLowerCase();
  if (id) query.id = id;
  if (phone) {
    const { countryCode, number } = phone;
    query = {
      'phone.countryCode': countryCode,
      'phone.number': number,
    };
  }
  if (Object.keys(query).length) {
    return modelQueries.fetchOne(query);
  }
  return {};
};

export default getUserFromDBQuery;
