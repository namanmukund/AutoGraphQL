/* eslint-disable no-await-in-loop */
import { get } from 'lodash';
import { log } from '../../../../../../utils';
import { QueryController, MutationController } from '../../../controllers';

const updateMentorMenteeSessionIsAssignmentAttempted = async () => {
  const typeName = 'MentorMenteeSession';
  const newAuthentication = {
    bypass: true,
  };

  const modelQueries = new QueryController(typeName, newAuthentication);
  const mentorMenteeSessions = await modelQueries.fetchMany({
    isAssignmentSubmitted: true,
  });
  const modelMutation = new MutationController(typeName, newAuthentication);
  if (mentorMenteeSessions && mentorMenteeSessions.length) {
    log(`Total Doc:  ${mentorMenteeSessions.length}`);
    // eslint-disable-next-line no-restricted-syntax
    for (const mentorMenteeSession of mentorMenteeSessions) {
      log(`MMS ID ---> ${get(mentorMenteeSession, 'id')}`);
      await modelMutation.update(
        { id: get(mentorMenteeSession, 'id') },
        {
          isAssignmentAttempted: true,
        },
      );
    }
  }
  log('Update Successful');
  return true;
};

export default updateMentorMenteeSessionIsAssignmentAttempted;
