import { generateCertificateMutationResolver } from '../index';
import { toObject } from '../../../../../../utils';

const generateCertificate = async (root, params, context, info) => {
  const typeName = 'generateCertificate';
  const mutationName = 'generateCertificate';
  const { parsedASTMap } = context;

  return generateCertificateMutationResolver(
    root,
    params,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
  ).then((result) => toObject(result));
};

export default generateCertificate;
