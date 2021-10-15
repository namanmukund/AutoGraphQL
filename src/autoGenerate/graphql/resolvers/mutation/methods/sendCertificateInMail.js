import { sendCertificateInMailMutationResolver } from '../index';
import { toObject } from '../../../../../../utils';

const sendCertificateInMail = async (root, params, context, info) => {
  const typeName = 'sendCertificateInMail';
  const mutationName = 'sendCertificateInMail';
  const { parsedASTMap } = context;

  return sendCertificateInMailMutationResolver(
    root,
    params,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
  ).then((result) => toObject(result));
};

export default sendCertificateInMail;
