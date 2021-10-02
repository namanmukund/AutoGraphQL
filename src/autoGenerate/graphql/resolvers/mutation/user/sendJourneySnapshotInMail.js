import { get } from 'lodash';
import sendJourneySnapshotOnCourseCompletion from '../../../../../../utils/scheduleJobs/jobs/sendJourneySnapshotOnCourseCompletion';
import validateAuthentication from '../../../../../../utils/validateAuthentication';

const sendJourneySnapshotInMailMutationResolver = async (
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
    await sendJourneySnapshotOnCourseCompletion({ userId }, () => { });
  } catch (err) {
    return {
      error: 'Error while trying to send mail',
    };
  }
  return {
    result: true,
  };
};

export default sendJourneySnapshotInMailMutationResolver;
