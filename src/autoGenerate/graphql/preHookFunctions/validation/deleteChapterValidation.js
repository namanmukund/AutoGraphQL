/* eslint no-restricted-syntax: ["error", "FunctionExpression", "WithStatement",
"BinaryExpression[operator='in']"] */
import { get } from 'lodash';
import callGraphqlApi from '../../../../api/callGraphqlApi';
import {
  ChapterIsPublishedError,
} from '../../../../../constants/errors';
import { PUBLISHED } from '../../../../../constants';
import isDocContainsGivenKeyValue from '../../../utils/isDocContainsGivenKeyValue';
import checkDeleteStatusOfATopic from './utils/checkDeleteStatusOfATopic';

const deleteChapterValidation = async (params) => {
  const { id } = params;
  const query = `
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
        questionBankMeta(filter: {status: ${PUBLISHED}}}) {
          count
        }
      }
    }
  }
}
`;

  const res = await callGraphqlApi(query);
  const chapter = get(res, 'data.chapter');
  if (chapter) {
    // prevent delete if chapter status is published
    if (isDocContainsGivenKeyValue(chapter, 'status', PUBLISHED)) {
      throw new ChapterIsPublishedError();
    }
    // check topics delete status
    const { topics } = chapter;
    if (topics && topics.length) {
      for (const topic of topics) {
        checkDeleteStatusOfATopic(topic);
      }
    }
  }
  return true;
};


export default deleteChapterValidation;
