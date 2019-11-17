const StickerEmoji = `
  type StickerEmoji @model {
    code: String! @trim @unique
    type: StickerEmojiType!
    image: File @relation(name: "StickerEmojiImage", direction: "OneWay")
  }
`;

export default StickerEmoji;
