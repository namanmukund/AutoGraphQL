/* eslint-disable no-await-in-loop */
// import { get } from 'lodash';
// import { log } from '../../../../../../utils';
import { QueryController } from '../../../controllers';

const updateMentorMenteeSessionIsAssignmentAttempted = async () => {
  const typeName = 'MentorMenteeSession';
  const newAuthentication = {
    bypass: true,
  };

  const modelQueries = new QueryController(typeName, newAuthentication);
  const mentorMenteeSessions = modelQueries.fetchMany({
    isAssignmentSubmitted: true,
  });
  // if (mentorMenteeSessions && mentorMenteeSessions.length) {
  //   for (const mentorMenteeSession of mentorMenteeSessions) {

  //   }
  // }
};

export default updateMentorMenteeSessionIsAssignmentAttempted;
