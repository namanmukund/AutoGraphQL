const fetchSalesOperations = (clientId, courseId) => `
{
  salesOperations(filter: {
    and: [
      {client_some: {id: "${clientId}"}},
      {leadStatus: won},
      {course_some:{id:"${courseId}"}}
    ]
  }){
    id
  }
}
`;

export default fetchSalesOperations;
