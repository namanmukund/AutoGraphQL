import { get } from 'lodash';
import { GLOBAL_COURSE_TITLE, PUBLISHED } from '../../../../../../constants';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { getUserIdandAppNameAfterValidation } from '../../../preHookFunctions/validation/utils';

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

const getCheatSheetContents = async ({ input }) => {
  let data;
  const cheatSheetArray = [];
  const topicsArray = [];
  let filter = '';
  if (input.topicId || input.searchText) {
    if (input.topicId) {
      filter = `{topic_some:{id:"${input.topicId}"}}, `;
    }
    if (input.searchText) {
      filter = `{title_contains:"${input.searchText}"}`;
    }
    data = await callLocalGraphqlApi(getCheatSheets(filter));
    const cheatSheets = get(data, 'data.cheatSheets', []);
    cheatSheets.forEach((concept, i) => {
      cheatSheetArray.push({ cheatsheet: { type: 'CheatSheet', typeId: `${concept.id}` }, isSelected: i === 0 });
    });
    /* eslint-disable no-else-return */
  } else if (input.cheatSheetId !== '') {
    const topicsData = await callLocalGraphqlApi(getTopics());
    const topics = get(topicsData, 'data.topics', []);
    filter = `{ id:"${input.cheatSheetId}" }, `;
    const cheatsheet = await callLocalGraphqlApi(getCheatSheets(filter));
    const cheatTopic = get(cheatsheet, 'data.cheatSheets[0].topic.id', '');
    // by default selecting the topic which contains the cheatsheet for which the cheatsheetId is passed in input
    topics.forEach((topic) => {
      topicsArray.push({ topic: { type: 'Topic', typeId: `${topic.id}` }, isSelected: get(topic, 'id') === cheatTopic });
    });
    data = await callLocalGraphqlApi(getCheatSheets(`{topic_some:{id:"${cheatTopic}"}}`));
    const cheatSheets = get(data, 'data.cheatSheets', []);
    cheatSheets.forEach((concept, i) => {
      cheatSheetArray.push({ cheatsheet: { type: 'CheatSheet', typeId: `${concept.id}` }, isSelected: i === 0 });
    });
  }
  return {
    cheatSheetTopics: [...topicsArray],
    cheatSheetConcepts: [...cheatSheetArray],
  };
};
const getCheatSheetContentWithoutInput = async () => {
  const topicsData = await callLocalGraphqlApi(getTopics());
  const topics = get(topicsData, 'data.topics', []);
  const topicsArray = [];
  topics.forEach((topic, i) => {
    topicsArray.push({ topic: { type: 'Topic', typeId: `${topic.id}` }, isSelected: i === 0 });
  });
  const cheatSheetArray = [];
  if (topics.length > 0) {
    const data = await callLocalGraphqlApi(getCheatSheets(`{topic_some:{id:"${get(topics[0], 'id')}"}}`));
    const cheatsheets = get(data, 'data.cheatSheets', []);
    cheatsheets.forEach((concept, i) => {
      cheatSheetArray.push({ cheatsheet: { type: 'CheatSheet', typeId: `${concept.id}` }, isSelected: i === 0 });
    });
  }
  return {
    cheatSheetTopics: [...topicsArray],
    cheatSheetConcepts: [...cheatSheetArray],
  };
};
const getCheatSheet = (async (root, params, context) => {
  const userAndAppInfo = getUserIdandAppNameAfterValidation(context, true);
  const {
    userIdFromContext: userId,
  } = userAndAppInfo;
  const { input } = params;
  let cheatTopic = [];
  let cheatConcept = [];
  if (userId) {
    if (input) {
      const { cheatSheetTopics, cheatSheetConcepts } = await getCheatSheetContents({ ...input });
      cheatTopic = [...cheatSheetTopics];
      cheatConcept = [...cheatSheetConcepts];
    } else {
      const { cheatSheetTopics, cheatSheetConcepts } = await getCheatSheetContentWithoutInput();
      cheatTopic = [...cheatSheetTopics];
      cheatConcept = [...cheatSheetConcepts];
    }
    /* eslint-disable no-lonely-if */
  } else {
    if (input) {
      const { cheatSheetTopics, cheatSheetConcepts } = await getCheatSheetContents({ ...input });
      cheatTopic = [...cheatSheetTopics];
      cheatConcept = [...cheatSheetConcepts];
    } else {
      const { cheatSheetTopics, cheatSheetConcepts } = await getCheatSheetContentWithoutInput();
      cheatTopic = [...cheatSheetTopics];
      cheatConcept = [...cheatSheetConcepts];
    }
  }
  return {
    cheatSheetTopics: [...cheatTopic],
    cheatSheetConcepts: [...cheatConcept],
  };
});

export default getCheatSheet;
