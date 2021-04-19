import { AlreadyBookmarkedOtherCheatSheet } from '../../../../../constants/errors';
import fetchBookmarks from './utils/checkExistingCheatSheetBookmark';

const addUserCheatSheetValidation = async (params) => {
  const { userConnectId: userId, cheatsheetConnectId: cheatsheetId } = params;
  // checking if the userCheatSheet collection contains doc with userId and cheatSheetId
  const bookmarkedCheat = await fetchBookmarks(userId, cheatsheetId);
  if (bookmarkedCheat && bookmarkedCheat.length > 0) {
    throw new AlreadyBookmarkedOtherCheatSheet();
  }
  return true;
};

export default addUserCheatSheetValidation;
