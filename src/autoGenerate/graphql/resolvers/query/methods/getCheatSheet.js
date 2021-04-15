import { get } from 'lodash';
import { GLOBAL_COURSE_TITLE, PUBLISHED } from '../../../../../../constants';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const getTopics = () => `
{
  topics(
    filter: {
      and: [
        { chapter_some: { courses_some: { title: ${GLOBAL_COURSE_TITLE} } } }
        { status: ${PUBLISHED} }
      ]
    }
  ) {
    id
    title
    thumbnail {
      id
      uri
    }
  }
}
`;
const getCheatSheets = (filter) => `
  {
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
    const data = await callLocalGraphqlApi(
      getCheatSheets(filter),
      context,
      '',
    );
    const cheatSheets = get(data, 'data.cheatSheets', []);
    const cheatSheetArray = [];
    cheatSheets.forEach((concept, i) => {
      cheatSheetArray.push({ cheatsheet: { type: 'CheatSheet', typeId: `${concept.id}` }, isSelected: i === 0 });
    });
    return {
      cheatSheetConcepts: [...cheatSheetArray],
    };
  }
  const topicsData = await callLocalGraphqlApi(
    getTopics(),
    context,
    '',
  );
  const topics = get(topicsData, 'data.topics', []);
  const topicsArray = [];
  topics.forEach((topic, i) => {
    topicsArray.push({ topic: { type: 'Topic', typeId: `${topic.id}` }, isSelected: i === 0 });
  });
  return {
    cheatSheetTopics: [...topicsArray],
  };
});

export default getCheatSheet;
