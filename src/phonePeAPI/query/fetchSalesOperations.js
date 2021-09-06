const fetchSalesOperations = (clientId) => `
{
  salesOperations(filter: {
    and: [
      {client_some: {id: "${clientId}"}},
      {leadStatus: won}
    ]
  }){
    id
  }
}
`;

export default fetchSalesOperations;
