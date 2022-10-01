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
        { chapter_some: { courses_some: { title: "${GLOBAL_COURSE_TITLE}" } } }
        { status: ${PUBLISHED} }
      ]
    }
  ) {
    id
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
        topic {
          id
          title
        }
      }
    }
  `;
const getBookmarkedCheats = (id, status) => `
{
  userCheatSheets(
    filter: {
      and: [
        { user_some: { id: "${id}" } }
        ${status ? '{ isBookmarked: true }' : ''}
      ]
    }
  ) {
    id
    isBookmarked
    cheatsheet {
      id
    }
  }
}
`;
const getCheatSheetContents = async ({ input, bookmarkedCheatSheetData }) => {
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
      // iterating through each cheatsheet and finding that particular cheatsheet in bookmarkedData
      // to get the corresponding bookmarked data i.e (bookmarkId and its status),
      // same is done for below cases if(if cheatsheetId is passed or if no input is passed)
      const bookmarkData = bookmarkedCheatSheetData && bookmarkedCheatSheetData.find((bData) => get(bData, 'cheatsheet.id') === get(concept, 'id'));
      const bookmarkId = get(bookmarkData, 'id', '');
      const isBookmark = get(bookmarkData, 'isBookmarked', false);
      cheatSheetArray.push({
        cheatsheet: { type: 'CheatSheet', typeId: `${concept.id}` },
        isBookmarked: isBookmark,
        isSelected: i === 0,
        userCheatSheetId: bookmarkId,
      });
    });
  } else if (input.isFavourite) {
    bookmarkedCheatSheetData.forEach(({ isBookmarked, id, ...concept }, i) => {
      cheatSheetArray.push({
        cheatsheet: { type: 'CheatSheet', typeId: `${get(concept, 'cheatsheet.id')}` },
        isBookmarked,
        isSelected: i === 0,
        userCheatSheetId: id,
      });
    });
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
    // constructing the data as defined in schema for cheatSheetConcepts and cheatSheetTopics and returning value
    cheatSheets.forEach((concept, i) => {
      const bookmarkData = bookmarkedCheatSheetData && bookmarkedCheatSheetData.find((bData) => get(bData, 'cheatsheet.id') === get(concept, 'id'));
      const bookmarkId = get(bookmarkData, 'id', '');
      const isBookmark = get(bookmarkData, 'isBookmarked', false);
      cheatSheetArray.push({
        cheatsheet: { type: 'CheatSheet', typeId: `${concept.id}` },
        isBookmarked: isBookmark,
        isSelected: i === 0,
        userCheatSheetId: bookmarkId,
      });
    });
  }
  return {
    cheatSheetTopics: [...topicsArray],
    cheatSheetConcepts: [...cheatSheetArray],
  };
};
const getCheatSheetContentWithoutInput = async (bookmarkedCheatSheetData) => {
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
      const bookmarkData = bookmarkedCheatSheetData && bookmarkedCheatSheetData.find((bData) => get(bData, 'cheatsheet.id') === get(concept, 'id'));
      const bookmarkId = get(bookmarkData, 'id', '');
      const isBookmark = get(bookmarkData, 'isBookmarked', false);
      cheatSheetArray.push({
        cheatsheet: { type: 'CheatSheet', typeId: `${concept.id}` },
        isBookmarked: isBookmark,
        isSelected: i === 0,
        userCheatSheetId: bookmarkId,
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
    // if user is loggedIn will also fetch its bookmarked cheatSheets to pass it's isBookmarked status (true/false) and
    // also its corresponding bookmarkId to perform (update/delete) operation
    let bookmarkedCheatSheet;
    if (input && input.isFavourite === true) {
      bookmarkedCheatSheet = await callLocalGraphqlApi(getBookmarkedCheats(userId, true));
    } else {
      bookmarkedCheatSheet = await callLocalGraphqlApi(getBookmarkedCheats(userId));
    }
    const bookmarkedCheatSheetData = get(bookmarkedCheatSheet, 'data.userCheatSheets', []);
    if (input) {
      const { cheatSheetTopics, cheatSheetConcepts } = await getCheatSheetContents({ input, bookmarkedCheatSheetData });
      cheatTopics = cheatSheetTopics;
      cheatConcepts = cheatSheetConcepts;
    } else {
      const { cheatSheetTopics, cheatSheetConcepts } = await getCheatSheetContentWithoutInput(bookmarkedCheatSheetData);
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
