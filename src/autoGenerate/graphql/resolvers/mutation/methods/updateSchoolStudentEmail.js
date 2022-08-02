import { ifAuthorized, toObject } from '../../../../../../utils';
import updateSchoolStudentEmailMutationResolver from '../userData/updateSchoolStudentEmailMutationResolver';

const updateSchoolStudentEmail = async (root, params, context, info) => {
  const typeName = 'Batch';
  const mutationName = 'updateSchoolStudentEmail';
  const { parsedASTMap } = context;
  const authentication = ifAuthorized(context);

  return updateSchoolStudentEmailMutationResolver(
    root,
    params,
    authentication,
    context,
    typeName,
    info,
    mutationName,
    parsedASTMap,
  ).then((result) => toObject(result));
};

export default updateSchoolStudentEmail;
