import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const fetchBookmarks = async (userId, bookmarkId) => {
  const query = `
          {
            userCheatSheets(
                filter: {
                    and: [
                        { user_some: { id: "${userId}" } }
                        ${bookmarkId ? `{ id_not: "${bookmarkId}" }` : ''}
                        { isBookmarked: true }
                    ]
                }
            ) {
                id
                isBookmarked
                user {
                id
                name
                }
                cheatsheet {
                id
                title
                order
                status
                }
            }
        }
          `;
  const bookmark = await callLocalGraphqlApi(query);
  return get(bookmark, 'data.userCheatSheets', []);
};

export default fetchBookmarks;
