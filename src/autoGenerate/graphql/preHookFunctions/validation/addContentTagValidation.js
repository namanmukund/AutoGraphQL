import { get } from 'lodash';
import { SimilarDocumentAlreadyExistError } from '../../../../../constants/errors';
import { MissingMandatoryInputInRequestError } from '../../../../../constants/errors/input';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const fetchContentTags = async (title) => {
  const query = `
    {
        contentTags(filter: { title: "${title}" } ) {
        id
      }
    }
    `;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.contentTags', []);
};

const addContentTagValidation = async (params) => {
  const title = get(params, 'input.title');
  const isEventTag = get(params, 'input.isEventTag');

  if (!title) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'Title for tag is missing',
      },
    });
  }
  if (isEventTag) {
    const contentTags = await fetchContentTags(title);
    if (contentTags && contentTags.length > 0) {
      throw new SimilarDocumentAlreadyExistError();
    }
  }
  return true;
};

export default addContentTagValidation;
