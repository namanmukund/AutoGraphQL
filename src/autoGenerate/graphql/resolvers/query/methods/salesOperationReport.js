import { get, groupBy, orderBy } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { QueryController } from '../../../controllers';
import { ifAuthorized } from '../../../../../../utils';
import { UnauthorizedOperationError } from '../../../../../../constants/errors';
import { MENTEE } from '../../../../../../constants/roles';

const topicsQuery = () => `
      query{
        topics(filter:{
          order_in:[1, 2]
        } orderBy: order_ASC){
          id
          title
        }
      }
`;

const aggregateGroupByQuery = (
  typeName,
  groupByField,
  matchQuery = {},
  typeNameCount,
) => {
  const queryController = new QueryController(typeName, { bypass: true });
  return queryController.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: { $dateToString: { format: '%d-%m-%Y', date: `$${groupByField}`, timezone: process.env.TZ } },
        [typeNameCount]: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
  ]);
};

const salesOperationReport = (async (root, params, context) => {
  const authentication = ifAuthorized(context);

  if (!(authentication && authentication.app && authentication.user)) {
    throw new UnauthorizedOperationError();
  }

  let { fromDate, toDate } = params;
  if (!fromDate) {
    fromDate = new Date(2018, 0, 0, 0, 0, 0);
  }
  if (!toDate) {
    toDate = new Date();
  }
  const topicsData = await callLocalGraphqlApi(topicsQuery());
  const firstTopicId = get(topicsData, 'data.topics[0].id');
  const secondTopicId = get(topicsData, 'data.topics[1].id');

  // -----------------------------------------------------------------------------
  const userMatchQuery = {
    createdAt: { $gte: new Date(fromDate), $lte: new Date(toDate) },
    role: MENTEE,
  };
  const users = await aggregateGroupByQuery(
    'User',
    'createdAt',
    userMatchQuery,
    'userRegisteredCount',
  );

  // -----------------------------------------------------------------------------

  const menteeSessionMatchQuery = { bookingDate: { $gte: new Date(fromDate), $lte: new Date(toDate) } };
  const menteeSessions = await aggregateGroupByQuery(
    'MenteeSession',
    'bookingDate',
    menteeSessionMatchQuery,
    'menteeAllSessionsBookedCount',
  );

  // -----------------------------------------------------------------------------

  const menteeFirstSessionMatchQuery = {
    bookingDate: { $gte: new Date(fromDate), $lte: new Date(toDate) },
    'topic.typeId': firstTopicId,
  };
  const menteeFirstSessions = await aggregateGroupByQuery(
    'MenteeSession',
    'bookingDate',
    menteeFirstSessionMatchQuery,
    'menteeFirstSessionBookedCount',
  );

  // -----------------------------------------------------------------------------

  const firstSessionStartedCountMatchQuery = {
    sessionStartDate: { $gte: new Date(fromDate), $lte: new Date(toDate) },
    sessionStatus: 'started',
    'topic.typeId': firstTopicId,
  };

  const firstSessionStarted = await aggregateGroupByQuery(
    'MentorMenteeSession',
    'sessionStartDate',
    firstSessionStartedCountMatchQuery,
    'firstSessionStartedCount',
  );

  // -----------------------------------------------------------------------------

  const firstSessionCompletedCountMatchQuery = {
    sessionStartDate: { $gte: new Date(fromDate), $lte: new Date(toDate) },
    sessionStatus: 'completed',
    'topic.typeId': firstTopicId,
  };

  const firstSessionCompleted = await aggregateGroupByQuery(
    'MentorMenteeSession',
    'sessionStartDate',
    firstSessionCompletedCountMatchQuery,
    'firstSessionCompletedCount',
  );

  // -----------------------------------------------------------------------------

  const secondSessionCompletedCountMatchQuery = {
    sessionStartDate: { $gte: new Date(fromDate), $lte: new Date(toDate) },
    sessionStatus: 'completed',
    'topic.typeId': secondTopicId,
  };

  const secondSessionCompleted = await aggregateGroupByQuery(
    'MentorMenteeSession',
    'sessionStartDate',
    secondSessionCompletedCountMatchQuery,
    'secondSessionCompletedCount',
  );
  // -----------------------------------------------------------------------------
  const sessionStartedCountMatchQuery = {
    sessionStartDate: { $gte: new Date(fromDate), $lte: new Date(toDate) },
    sessionStatus: 'started',
  };

  const sessionStarted = await aggregateGroupByQuery(
    'MentorMenteeSession',
    'sessionStartDate',
    sessionStartedCountMatchQuery,
    'allSessionsStartedCount',
  );
  // -----------------------------------------------------------------------------
  const sessionCompletedCountMatchQuery = {
    sessionStartDate: { $gte: new Date(fromDate), $lte: new Date(toDate) },
    sessionStatus: 'completed',
  };

  const sessionCompleted = await aggregateGroupByQuery(
    'MentorMenteeSession',
    'sessionStartDate',
    sessionCompletedCountMatchQuery,
    'allSessionsCompletedCount',
  );

  // -----------------------------------------------------------------------------
  const finalArray = [];

  const mergedArray = [
    ...users, ...menteeSessions, ...menteeFirstSessions, ...firstSessionStarted, ...firstSessionCompleted, ...secondSessionCompleted, ...sessionStarted, ...sessionCompleted,
  ];
  if (mergedArray && mergedArray.length) {
    const groupedArray = groupBy(mergedArray, (doc) => doc._id);

    Object.keys(groupedArray)
      .forEach((key) => {
        let temp = {};
        groupedArray[key].forEach((obj) => {
          temp = { ...temp, ...obj };
        });
        const dateParts = temp._id.split('-');
        temp.date = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);
        finalArray.push(temp);
      });
  }
  return finalArray.length ? orderBy(finalArray, ['date'], ['desc']) : [];
});

export default salesOperationReport;
