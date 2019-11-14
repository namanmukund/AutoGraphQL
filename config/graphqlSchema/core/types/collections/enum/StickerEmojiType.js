import { stickerEmojiType } from '../../../../../../constants';

const { sticker, emoji } = stickerEmojiType;
const StickerEmojiType = `
  enum StickerEmojiType {
    ${sticker}
    ${emoji}
  }`;

export default StickerEmojiType;
