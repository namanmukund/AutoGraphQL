import { get } from 'lodash';
import { AlreadyBookmarkedOtherCheatSheet } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import fetchBookmarks from './utils/checkExistingCheatSheetBookmark';

const fetchUserForBookmark = async (bookmarkId) => {
  const query = `
        {
        userCheatSheet(id:"${bookmarkId}") {
            user {
            id
            name
            }
        }
        }
          `;
  const bookmark = await callLocalGraphqlApi(query);
  return get(bookmark, 'data.userCheatSheet', []);
};

const updateUserCheatSheetValidation = async (params) => {
  const { input: { isBookmarked }, id: bookmarkId } = params;
  if (isBookmarked === true) {
    const bookmarkUser = await fetchUserForBookmark(bookmarkId);
    const userId = get(bookmarkUser, 'user.id');
    const bookmarkedCheat = await fetchBookmarks(userId, bookmarkId);
    if (bookmarkedCheat && bookmarkedCheat.length > 0) {
      throw new AlreadyBookmarkedOtherCheatSheet();
    }
  }
  return true;
};

export default updateUserCheatSheetValidation;
