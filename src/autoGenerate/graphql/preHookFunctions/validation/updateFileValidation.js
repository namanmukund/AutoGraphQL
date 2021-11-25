import { get } from 'lodash';
import { FileNameAlreadyExists } from '../../../../../constants/errors/db';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const FETCH_FILE_BY_NAME_QUERY = (id, name = '') => `
    {
        files(filter: {
            and: [
                {
                    name: "${name}"
                }
                {
                    id_not: "${id}"
                }
            ]
        }) {
            id
        }
    }
`;
const updateFileValidation = async (input, mutationOrQueryName, context, params) => {
  if (input && input.name) {
    const files = await callLocalGraphqlApi(FETCH_FILE_BY_NAME_QUERY(get(params, 'id'), input.name), context);
    if (files && get(files, 'data') && get(files, 'data.files', []).length > 0) {
      throw new FileNameAlreadyExists();
    }
  }
};

export default updateFileValidation;
