import { generateCertificateInBulkMutationResolver } from '../index';
import { toObject } from '../../../../../../utils';

const generateCertificateInBulk = async (root, params, context, info) => {
  const typeName = 'generateCertificateInBulk';
  const mutationName = 'generateCertificateInBulk';
  const { parsedASTMap } = context;

  return generateCertificateInBulkMutationResolver(
    root,
    params,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
  ).then((result) => toObject(result));
};

export default generateCertificateInBulk;
