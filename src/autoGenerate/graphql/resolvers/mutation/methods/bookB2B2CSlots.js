import { bookB2B2CSlotsMutationResolver } from '../index';
import { toObject } from '../../../../../../utils';

const bookB2B2CSlots = async (root, params, context, info) => {
  const typeName = 'BookB2B2CSlots';
  const mutationName = 'bookB2B2CSlots';
  const { parsedASTMap } = context;

  return bookB2B2CSlotsMutationResolver(
    root,
    params,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
  ).then((result) => toObject(result));
};

export default bookB2B2CSlots;
