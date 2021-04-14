import { get } from 'lodash';
import { GLOBAL_COURSE_TITLE, PUBLISHED } from '../../../../../../constants';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const getTopicsAndCheatSheet = (filter) => `
  {
    courses(filter:{
        and:[
          {title: ${GLOBAL_COURSE_TITLE}},
          {status: ${PUBLISHED}}
        ]
      }){
        id
        title
        chapters(
            filter: {
              status: ${PUBLISHED}
            }
          ){
          id
          title
          order
          topics(
            filter: {
              status: ${PUBLISHED}
            }
          ){
            id
            title
            order
            isTrial
            description
            isTrial
            thumbnail{
              id
              uri
              name
            }
            thumbnailSmall{
              id
              uri
              name
            }
          }
        }
      }
    cheatSheets(
    filter: {
      and: [${filter}]
        }
    ) {
        id
        title
        order
        status
        topic {
            id
            title
        }
        content {
            order
            type
            statement
            image {
                id
                uri
            }
            emoji {
                id
                code
                image {
                    id
                    uri
                }
            }
            terminalInput
            terminalOutput
        }
    }
  }
  `;

const getCheatSheet = (async (root, params, context) => {
  validateAuthentication(context);
  let filter = '';
  const { input } = params;
  if (input) {
    if (input.topicId) {
      filter = `{topic_some:{id:"${input.topicId}"}}, `;
    }
    if (input.cheatSheetId) {
      filter = `{ id:"${input.cheatSheetId}" }, `;
    }
    if (input.searchText) {
      filter = `{title_contains:"${input.searchText}"}`;
    }
    if (input.isFavourite) {
      filter = '';
    }
  }
  const data = await callLocalGraphqlApi(
    getTopicsAndCheatSheet(filter),
    context,
    '',
  );
  const topics = get(data, 'data.courses[0].chapters[0].topics', []);
  const cheatSheets = get(data, 'data.cheatSheets');
  const topicsArray = [];
  const cheatSheetArray = [];
  topics.forEach((t, i) => {
    topicsArray.push({ topic: { type: 'Topic', typeId: `${t.id}` }, isSelected: i === 0 });
  });
  cheatSheets.forEach((concept, i) => {
    cheatSheetArray.push({ cheatsheet: { type: 'CheatSheet', typeId: `${concept.id}` }, isSelected: i === 0 });
  });
  return {
    cheatSheetTopics: [...topicsArray],
    cheatSheetConcepts: [...cheatSheetArray],
  };
});

export default getCheatSheet;
