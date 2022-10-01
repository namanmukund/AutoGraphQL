const fetchCourseIdFromProduct = (productId) => `
{
  products(filter: {
    and: [
      {id: "${productId}"}
    ]
  }){
    id
    course{
      id
    }
  }
}
`;

export default fetchCourseIdFromProduct;
