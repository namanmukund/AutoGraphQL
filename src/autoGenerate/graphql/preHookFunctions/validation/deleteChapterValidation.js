/* eslint no-restricted-syntax: ["error", "FunctionExpression", "WithStatement",
"BinaryExpression[operator='in']"] */
import { get } from 'lodash';
import {
  ChapterIsPublishedError,
} from '../../../../../constants/errors';
import { PUBLISHED } from '../../../../../constants';
import isDocContainsGivenKeyValue from '../../../utils/isDocContainsGivenKeyValue';
import checkDeleteStatusOfATopic from './utils/checkDeleteStatusOfATopic';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

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
        questionBankMeta(filter: {status: ${PUBLISHED}}) {
          count
        }
      }
    }
  }
}
`;

  const res = await callLocalGraphqlApi(query);
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
