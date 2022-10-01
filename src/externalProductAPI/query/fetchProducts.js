const fetchProducts = (id) => `
{
  products(filter: {
   and: [
      {showOnMerchantSite: true},
      {status: published},
      {userRole: mentee},
      {country: india}
      ${id ? `{
        id: "${id}"
      }` : ''}
    ]
  }){
    id
    title
    merchantDescription
    totalSessions
    price{
      amount
    }
    smallThumnail{
      uri
    }
    mediumThumbnail{
      uri
    }
    largeThumbnail{
      uri
    }
    features{
      statement
    }
  }
}
`;

export default fetchProducts;
