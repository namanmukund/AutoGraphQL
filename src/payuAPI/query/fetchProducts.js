const fetchProducts = (productId) => `
{
  products(filter: {
    id: "${productId}"
  }){
    id
    price{
      amount
    }
  }
}
`;

export default fetchProducts;
