const Episode = `
  type Episode @model {
    title: String! @unique
    description: String @unique
    subtitle: File @relation(name: "EpisodeSubtitle", direction: "OneWay")
    video: File @relation(name: "EpisodeVideo", direction: "OneWay")
    topic: Topic @relation(name: "TopicEpisode")
    thumbnail: File @relation(name: "EpisodeThumbnail", direction: "OneWay")
  }
`;

export default Episode;
