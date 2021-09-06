const fetchProducts = () => `
{
  products(filter: {
   showOnMerchantSite:true
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
