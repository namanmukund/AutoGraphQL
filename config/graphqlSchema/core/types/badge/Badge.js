const Badge = `
  type Badge @model {
    order: Int!
    type: BadgeType!
    name: String @length(min: 3, max: 8) @trim
    description: String @length(min: 3, max: 150) @trim
    activeImage: File @relation(name: "BadgeActiveImage", direction: "OneWay")
    inactiveImage: File @relation(name: "BadgeInactiveImage", direction: "OneWay")
    topic: Topic! @relation(name: "TopicBadge")
    unlockPoint: CurrentTopicComponentType!
    status: ContentStatus! @defaultValue(value: "unpublished")
  }
`;

export default Badge;
