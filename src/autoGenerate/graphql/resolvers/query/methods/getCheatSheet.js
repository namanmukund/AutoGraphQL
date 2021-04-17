/* eslint-disable no-unused-vars */
import { get } from 'lodash';
import { GLOBAL_COURSE_TITLE, PUBLISHED } from '../../../../../../constants';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
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
const getBookmarked = (id) => `
{
  userCheatSheets(filter: { user_some: { id: "${id}" } }) {
    isBookmarked
    cheatsheet {
      id
      title
    }
  }
}
`;
const getCheatSheetContents = async ({ input, bookmarkedCheat }) => {
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
    // constructing the data as defined in schema for cheatSheetConcepts
    cheatSheets.forEach((concept, i) => {
      cheatSheetArray.push({
        cheatsheet: { type: 'CheatSheet', typeId: `${concept.id}` },
        isBookmarked: (bookmarkedCheat && bookmarkedCheat === get(concept, 'id')) || false,
        isSelected: i === 0,
      });
    });
    /* eslint-disable no-else-return */
  } else if (input.cheatSheetId !== '') {
    const topicsData = await callLocalGraphqlApi(getTopics());
    const topics = get(topicsData, 'data.topics', []);
    filter = `{ id:"${input.cheatSheetId}" }, `;
    // if we get the cheatsheetId in input the will fetch the cheatsheet for the provided ID and extract the topicId
    const cheatsheet = await callLocalGraphqlApi(getCheatSheets(filter));
    const cheatTopic = get(cheatsheet, 'data.cheatSheets[0].topic.id', '');
    // by default selecting the topic which contains the cheatsheet for which the cheatsheetId is passed in input
    topics.forEach((topic) => {
      topicsArray.push({ topic: { type: 'Topic', typeId: `${topic.id}` }, isSelected: get(topic, 'id') === cheatTopic });
    });
    // and then will fetch all the cheatSheets for that topicId
    data = await callLocalGraphqlApi(getCheatSheets(`{topic_some:{id:"${cheatTopic}"}}`));
    const cheatSheets = get(data, 'data.cheatSheets', []);
    cheatSheets.forEach((concept, i) => {
      cheatSheetArray.push({
        cheatsheet: { type: 'CheatSheet', typeId: `${concept.id}` },
        isBookmarked: (bookmarkedCheat && bookmarkedCheat === get(concept, 'id')) || false,
        isSelected: i === 0,
      });
    });
    // constructing the data as defined in schema for cheatSheetConcepts and cheatSheetTopics and returning value
  }
  return {
    cheatSheetTopics: [...topicsArray],
    cheatSheetConcepts: [...cheatSheetArray],
  };
};
const getCheatSheetContentWithoutInput = async (bookmarkedCheat) => {
  // if not input is provided then this function will be called
  const topicsData = await callLocalGraphqlApi(getTopics());
  const topics = get(topicsData, 'data.topics', []);
  const topicsArray = [];
  // getting all the topics and constructing the data as defined in schema
  topics.forEach((topic, i) => {
    topicsArray.push({ topic: { type: 'Topic', typeId: `${topic.id}` }, isSelected: i === 0 });
  });
  const cheatSheetArray = [];
  // as input is not provided so we are considering the 1st topic to get its corresponding cheatSheets
  if (topics.length > 0) {
    const data = await callLocalGraphqlApi(getCheatSheets(`{topic_some:{id:"${get(topics[0], 'id')}"}}`));
    const cheatsheets = get(data, 'data.cheatSheets', []);
    cheatsheets.forEach((concept, i) => {
      cheatSheetArray.push({
        cheatsheet: { type: 'CheatSheet', typeId: `${concept.id}` },
        isBookmarked: (bookmarkedCheat && bookmarkedCheat === get(concept, 'id')) || false,
        isSelected: i === 0,
      });
    });
  }
  return {
    cheatSheetTopics: [...topicsArray],
    cheatSheetConcepts: [...cheatSheetArray],
  };
};

const getCheatSheet = (async (root, params, context) => {
  const userAndAppInfo = getUserIdandAppNameAfterValidation(context, true);
  validateAuthentication(context, 'app');
  context.currentUser = true;
  // getting the userId of the loggedIn user
  const {
    userIdFromContext: userId,
  } = userAndAppInfo;
  // getting input from params
  const { input } = params;
  let cheatTopics = [];
  let cheatConcepts = [];
  // if the user is not loggedIn
  if (!userId) {
    if (input) {
      const { cheatSheetTopics, cheatSheetConcepts } = await getCheatSheetContents({ input });
      cheatTopics = cheatSheetTopics;
      cheatConcepts = cheatSheetConcepts;
    } else {
      const { cheatSheetTopics, cheatSheetConcepts } = await getCheatSheetContentWithoutInput();
      cheatTopics = cheatSheetTopics;
      cheatConcepts = cheatSheetConcepts;
    }
    /* eslint-disable no-lonely-if */
  } else {
    // if user is loggedIn will also fetch its bookmarked cheatSheets and enable the flag isBookmark to true
    const isBookmarked = await callLocalGraphqlApi(getBookmarked(userId));
    const bookmarkedCheat = get(isBookmarked, 'data.userCheatSheets[0].cheatsheet.id');
    if (input) {
      const { cheatSheetTopics, cheatSheetConcepts } = await getCheatSheetContents({ input, bookmarkedCheat });
      cheatTopics = cheatSheetTopics;
      cheatConcepts = cheatSheetConcepts;
    } else {
      const { cheatSheetTopics, cheatSheetConcepts } = await getCheatSheetContentWithoutInput(bookmarkedCheat);
      cheatTopics = cheatSheetTopics;
      cheatConcepts = cheatSheetConcepts;
    }
  }
  return {
    cheatSheetTopics: [...cheatTopics],
    cheatSheetConcepts: [...cheatConcepts],
  };
});

export default getCheatSheet;
