import { get } from 'lodash';
import {
  OrderAlreadyExistsError,
} from '../../../../../constants/errors';
import callGraphqlApi from '../../../../api/callGraphqlApi';

const learningObjectiveOrderValidation = async (params) => {
  const { order } = params;
  const query = `
  query{
  learningObjectives{
    order
  }
}
`;

  const res = await callGraphqlApi(query);
  const learningObjectives = get(res, 'data.learningObjectives');
  if (learningObjectives) {
    learningObjectives.forEach((lo) => {
      if (lo.order !== order) {
        throw new OrderAlreadyExistsError();
      }
    });
  }
  return true;
};

export default learningObjectiveOrderValidation;
