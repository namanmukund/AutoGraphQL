import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { MutationController } from '../../../controllers';

const updateCodeInSchool = async () => {
  const query = `
        query{
          schools{
            id
            code
          }
        }
        `;
  const res = await callLocalGraphqlApi(query);
  const schools = get(res, 'data.schools');
  // eslint-disable-next-line no-restricted-syntax
  for (const school of schools) {
    const { id, code } = school;
    if (code) {
      const modelMutation = new MutationController('School', { bypass: true });
      // eslint-disable-next-line no-await-in-loop
      const updatedDoc = await modelMutation.updateDocument(id, { code: code.toLowerCase() });
      console.log(id, '....updatedDoc', updatedDoc.code);
    }
  }
};

export default updateCodeInSchool;
