const TimestampTag = `
type TimestampTag {
  title: String
  showByDefault: Boolean @defaultValue(value: "false")
  order: Int
}
`;

export default TimestampTag;
