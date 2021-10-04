import { get } from 'lodash';
import sendCertificateOnCourseCompletion from '../../../../../../utils/scheduleJobs/jobs/sendCertificateOnCourseCompletion';
import validateAuthentication from '../../../../../../utils/validateAuthentication';

const sendCertificateInMailMutationResolver = async (
  root,
  params,
  typeName,
  info,
  mutationName,
  ast,
  context,
) => {
  validateAuthentication(context);
  const { input } = params;
  const userId = get(input, 'userId', '');
  try {
    await sendCertificateOnCourseCompletion({ userId }, () => { });
  } catch (err) {
    return {
      error: 'Error while trying to send mail',
    };
  }
  return {
    result: true,
  };
};

export default sendCertificateInMailMutationResolver;
