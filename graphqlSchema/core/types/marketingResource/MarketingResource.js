const MarketingResource = `
  type MarketingResource @model {
    type: MarketingResourceType
    content: String
    url: File @relation(name: "MarketingResourceUrl", direction: "OneWay")
    status: ContentStatus! @defaultValue(value: "unpublished")
  }
`;

export default MarketingResource;
