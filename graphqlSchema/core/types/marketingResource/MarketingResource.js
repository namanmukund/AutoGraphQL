const MarketingResource = `
  type marketingResource @model {
    type: MarketingResourceType
    text: String
    url: File @relation(name: "MarketingResourceUrl", direction: "OneWay")
  }
`;

export default MarketingResource;
