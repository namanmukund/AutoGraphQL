import { ifAuthorized, toObject } from '../../../../../../utils';
import { prehook } from '../../../preHook';
import { updateEventSessionAttendanceMutationResolver } from '../index';

const updateEventSessionAttendance = (async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const { parsedASTMap } = context;
  const typeName = 'updateEventSessionAttendance';
  const mutationName = 'updateEventSessionAttendance';
  const { input } = params;
  const hookInput = await prehook(input, mutationName, context, params);

  const newParams = params;
  newParams.input = hookInput;

  return updateEventSessionAttendanceMutationResolver(
    root,
    params,
    context,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    authentication,
  ).then((result) => toObject(result));
});

export default updateEventSessionAttendance;
