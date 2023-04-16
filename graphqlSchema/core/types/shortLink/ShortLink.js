const ShortLink = `
  type ShortLink @model 
  {
    link: String
    slug: String @unique @trim
  }
`;

export default ShortLink;
