import { get } from 'lodash';
import { AlreadyBookmarkedCheatSheet, DatabaseRecordNotFoundError } from '../../../../../constants/errors';
import fetchBookmarks from './utils/checkExistingCheatSheetBookmark';

const updateUserCheatSheetValidation = async (params) => {
  const {
    input: { isBookmarked },
    id: userCheatSheetId, userConnectId: userId, cheatsheetConnectId: cheatsheetId,
  } = params;
  const bookmarkedCheat = await fetchBookmarks(userId, cheatsheetId, userCheatSheetId);
  // getting the bookmarkedCheatSheet and if exist
  if (bookmarkedCheat && bookmarkedCheat.length > 0) {
    const bookmarkStatus = get(bookmarkedCheat[0], 'isBookmarked', false);
    // if isBookmarked passed from input is true and, bookmarked data we get is already set to true, then will throw error,
    // same, incase of false as well...
    if (isBookmarked === true && bookmarkStatus === true) {
      throw new AlreadyBookmarkedCheatSheet();
    } else if (isBookmarked === false && bookmarkStatus === false) {
      throw new AlreadyBookmarkedCheatSheet();
      // else will allow to update the bookmark data
    } else {
      return true;
    }
  } else {
    // if bookmarked data is not present
    throw new DatabaseRecordNotFoundError();
  }
};

export default updateUserCheatSheetValidation;
