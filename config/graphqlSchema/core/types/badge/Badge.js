const Badge = `
  type Badge @model {
    order: Int!
    type: BadgeType!
    name: String @length(min: 3, max: 8) @trim
    activeImage: File @relation(name: "BadgeActiveImage", direction: "OneWay")
    inactiveImage: File @relation(name: "BadgeInactiveImage", direction: "OneWay")
    topic: Topic! @relation(name: "TopicBadge")
  }
`;

export default Badge;
