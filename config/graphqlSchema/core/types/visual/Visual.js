const Visual = `
  type Visual @model {
    order: Int!
    description: String
    image: File @relation(name: "VisualImage", direction: "OneWay" )
    createdAt: Date @readOnly
    updatedAt: Date @readOnly
    conceptCard: ConceptCard @relation(name: "ConceptCardVisuals" isSubset: true)
    status: ContentStatus! @defaultValue(value: "unpublished")
  }
`;

export default Visual;
