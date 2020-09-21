const MarketingResource = `
  type MarketingResource @model {
    type: MarketingResourceType
    content: String
    videoLink: String
    fileInfo: File @relation(name: "MarketingResourceUrl", direction: "OneWay")
    status: ContentStatus! @defaultValue(value: "unpublished")
  }
`;

export default MarketingResource;
