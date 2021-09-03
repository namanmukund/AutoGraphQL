const fetchDiscounts = (discountCode, productId) => `
{
  discounts(filter: {
    and:[
      {product_some: {id: "${productId}"}},
      {code: "${discountCode}"}
    ]
  }){
    id
    code
    expiryDate
    percentage
  }
}
`;

export default fetchDiscounts;
