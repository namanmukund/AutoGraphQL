import { get } from 'lodash';
import { MENTEE } from '../../../../../../constants/roles';
import { InsufficientPermissionError } from '../../../../../../constants/errors';
import { topicTypes } from '../../../../../../constants';

/*
this method validates whether user should be able to hit API on basis of user role
*/
const validateMentorMenteePermissionForVideo = (context, currentTopicOrder, topicOrder, page, currentTopicComponentType) => {
    const {
        video
    } = topicTypes;
    const currentUserRole = get(context, 'currentUser.role');
    const currentMentorId = get(context, 'currentMentor.id');

    // condition if mentee is trying to access a video which is next to be taught
    if (currentUserRole === MENTEE &&
        !currentMentorId &&
        topicOrder === currentTopicOrder &&
        page === video &&
        currentTopicComponentType === video) {
        throw new InsufficientPermissionError();
    }

    return true;
};

export default validateMentorMenteePermissionForVideo;
