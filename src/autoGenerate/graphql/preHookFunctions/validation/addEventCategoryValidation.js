import { get } from 'lodash';
import { EventTitleAlreadyExist } from '../../../../../constants/errors';
import { MissingMandatoryInputInRequestError } from '../../../../../constants/errors/input';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const fetchEventCategories = async (title) => {
  const query = `
    {
        eventCategories(filter: { title: "${title}" } ) {
        id
      }
    }
    `;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.eventCategories', []);
};

const addEventCategoryValidation = async (params) => {
  const title = get(params, 'title');

  if (!title) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'Title for event is missing',
      },
    });
  }
  const eventCategories = await fetchEventCategories(title);
  if (eventCategories && eventCategories.length > 0) {
    throw new EventTitleAlreadyExist();
  }
  return true;
};

export default addEventCategoryValidation;
