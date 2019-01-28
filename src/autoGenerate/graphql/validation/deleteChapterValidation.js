import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  DeleteChapterError,
  ChapterIsPublishedError,
  ChapterTopicVideoIsPublishedError,
  ChapterTopicLoIsPublishedError,
  ChapterTopicLoMessageIsPublishedError,
  ChapterTopicLoQuestionIsPublishedError } from '../../../../constants/errors';

/* eslint "no-restricted-syntax": 0 */
const isPublishedCheck = (statusType, publishStatus) => {
  let bool = false;
  for (const topics of publishStatus) {
    const status = topics[statusType];

    if (status === 'published') {
      bool = true;
      break;
    }
  }
  return bool;
};

const deleteChapterValidation = async (params) => {
  const { id } = params;
  const query = `
  query{
    chapter(id:"${id}"){
      topicsMeta(filter:{
        status:published
      }){
        count
      }
    }
  }
  `;
  const chapterChildrenQuery = `
  query{
  chapter(id:"${id}") {
    id
    status
    topics {
      id
      status
      videoStatus
      learningObjectives {
        id
        status
        messageStatus
        questionBankMeta(filter: {status: published}) {
          count
        }
      }
    }
  }
}
`;


  const response = await callGraphqlApi(query);
  const publishedTopicsCount = get(response, 'data.chapter.topicsMeta.count', 0);

  const chapterChildrenResponse = await callGraphqlApi(chapterChildrenQuery);
  const chapterStatus = get(chapterChildrenResponse, 'data.chapter.status', 0);
  const chapterTopics = get(chapterChildrenResponse, 'data.chapter.topics', 0);

  if (publishedTopicsCount && publishedTopicsCount > 0) {
    throw new DeleteChapterError();
  }

  if (chapterStatus && chapterStatus === 'published') {
    throw new ChapterIsPublishedError();
  }

  if (isPublishedCheck('videoStatus', chapterTopics)) throw new ChapterTopicVideoIsPublishedError();

  for (const lo of chapterTopics) {
    const { learningObjectives } = lo;
    if (isPublishedCheck('status', learningObjectives)) throw new ChapterTopicLoIsPublishedError();
    break;
  }

  for (const lo of chapterTopics) {
    const { learningObjectives } = lo;
    if (isPublishedCheck('messageStatus', learningObjectives)) throw new ChapterTopicLoMessageIsPublishedError();
    break;
  }

  for (const lo of chapterTopics) {
    const { learningObjectives: { count } } = lo;
    if (count && count > 0) throw new ChapterTopicLoQuestionIsPublishedError();
    break;
  }
};

export default deleteChapterValidation;
