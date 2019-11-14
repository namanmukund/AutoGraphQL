const StickerEmoji = `
  type StickerEmoji @model {
    code: String! @trim
    type: StickerEmojiType!
    image: File! @relation(name: "StickerEmojiImage", direction: "OneWay")
    height: Int
    width: Int
  }
`;

export default StickerEmoji;
