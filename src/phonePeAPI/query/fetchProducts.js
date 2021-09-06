const fetchProducts = () => `
{
  products(filter: {
   and: [
      {showOnMerchantSite: true},
      {status: published},
      {userRole: mentee},
      {country: india}
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
