const Episode = `
  type Episode @model {
    title: String! @unique
    description: String @unique
    subtitle: File @relation(name: "EpisodeVideo", direction: "OneWay")
    video: File @relation(name: "EpisodeVideo", direction: "OneWay")
    topic: Topic @relation(name: "TopicEpisode")
  }
`;

export default Episode;
