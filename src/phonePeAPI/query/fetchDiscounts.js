const fetchDiscounts = (productId, additionalFilter) => `
{
  discounts(filter: {
    and:[
      {product_some: {id: "${productId}"}},
      ${!additionalFilter ? '' : additionalFilter}
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
