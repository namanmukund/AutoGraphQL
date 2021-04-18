import { AlreadyBookmarkedOtherCheatSheet } from '../../../../../constants/errors';
import fetchBookmarks from './utils/checkExistingCheatSheetBookmark';

const addUserCheatSheetValidation = async (params) => {
  const { userConnectId: userId, input: { isBookmarked } } = params;
  if (isBookmarked === true) {
    const bookmarkedCheat = await fetchBookmarks(userId);
    if (bookmarkedCheat && bookmarkedCheat.length > 0) {
      throw new AlreadyBookmarkedOtherCheatSheet();
    }
  }
  return true;
};

export default addUserCheatSheetValidation;
