import validateAuthentication from '../../../../../../utils/validateAuthentication';
import generateMentorPayoutReport from './generateMentorPayout';

const generateMentorPayoutReportMutationResolver = async (
  root,
  params,
  typeName,
  info,
  mutationName,
  ast,
  context,
) => {
  validateAuthentication(context);
  try {
    await generateMentorPayoutReport(root, params, context);
  } catch (err) {
    return {
      error: 'Error while generating mentor payout reports',
    };
  }
  return {
    result: true,
  };
};

export default generateMentorPayoutReportMutationResolver;
