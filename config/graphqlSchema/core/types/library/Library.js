const Library = `
  type Library @model {
    order: Int! @unique
    title: String! @unique
    description: String @unique
    status: Status! @defaultValue(value: "inactive")
  }
`;

export default Library;
