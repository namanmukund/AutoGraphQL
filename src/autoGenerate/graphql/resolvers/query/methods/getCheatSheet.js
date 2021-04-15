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
    let data;
    const cheatSheetArray = [];
    if (input.topicId || input.searchText) {
      if (input.topicId) {
        filter = `{topic_some:{id:"${input.topicId}"}}, `;
      }
      if (input.searchText) {
        filter = `{title_contains:"${input.searchText}"}`;
      }
      data = await callLocalGraphqlApi(
        getCheatSheets(filter),
        context,
        '',
      );
      const cheatSheets = get(data, 'data.cheatSheets', []);
      cheatSheets.forEach((concept, i) => {
        cheatSheetArray.push({ cheatsheet: { type: 'CheatSheet', typeId: `${concept.id}` }, isSelected: i === 0 });
      });
      return {
        cheatSheetConcepts: [...cheatSheetArray],
      };
      /* eslint-disable no-else-return */
    } else if (input.cheatSheetId) {
      const topicsData = await callLocalGraphqlApi(
        getTopics(),
        context,
        '',
      );
      const topics = get(topicsData, 'data.topics', []);
      const topicsArray = [];
      filter = `{ id:"${input.cheatSheetId}" }, `;
      const cheatsheet = await callLocalGraphqlApi(
        getCheatSheets(filter),
        context,
        '',
      );
      const cheatTopic = get(cheatsheet, 'data.cheatSheets[0].topic.id', '');
      // by default selecting the topic which contains the cheatsheet for which the cheatsheetId is passed in input
      topics.forEach((topic) => {
        topicsArray.push({ topic: { type: 'Topic', typeId: `${topic.id}` }, isSelected: get(topic, 'id') === cheatTopic });
      });
      data = await callLocalGraphqlApi(
        getCheatSheets(`{topic_some:{id:"${cheatTopic}"}}`),
        context,
        '',
      );
      const cheatSheets = get(data, 'data.cheatSheets', []);
      cheatSheets.forEach((concept, i) => {
        cheatSheetArray.push({ cheatsheet: { type: 'CheatSheet', typeId: `${concept.id}` }, isSelected: i === 0 });
      });
      return {
        cheatSheetTopics: [...topicsArray],
        cheatSheetConcepts: [...cheatSheetArray],
      };
    }
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
  const cheatSheetArray = [];
  if (topics.length > 0) {
    const data = await callLocalGraphqlApi(
      getCheatSheets(`{topic_some:{id:"${get(topics[0], 'id')}"}}`),
      context,
      '',
    );
    const cheatsheets = get(data, 'data.cheatSheets', []);
    cheatsheets.forEach((concept, i) => {
      cheatSheetArray.push({ cheatsheet: { type: 'CheatSheet', typeId: `${concept.id}` }, isSelected: i === 0 });
    });
  }
  return {
    cheatSheetTopics: [...topicsArray],
    cheatSheetConcepts: [...cheatSheetArray],
  };
});

export default getCheatSheet;
