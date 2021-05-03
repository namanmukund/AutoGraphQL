import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const fetchBookmarks = async (userId, cheatSheetId) => {
  const query = `
          {
            userCheatSheets(
                filter: {
                and: [
                    { user_some: { id: "${userId}" } }
                    { cheatsheet_some: { id: "${cheatSheetId}" } }
                ]
                }
            ) {
                id
            }
          }
          `;
  const bookmark = await callLocalGraphqlApi(query);
  return get(bookmark, 'data.userCheatSheets', []);
};

export default fetchBookmarks;
