import {
  get, groupBy, orderBy, findIndex,
} from 'lodash';
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

const mentorMenteeSessions = async (fromDate, toDate) => {
  const query = `query{
  mentorMenteeSessions(filter:{
    and:[
      {topic_some:{order:1}}
      {sessionStartDate_gte:"${fromDate}"}
      {sessionStartDate_lte:"${toDate}"}
      {hasRescheduled:true}
      {source_not:school}
    ]
  }orderBy:sessionStartDate_DESC){
    id
    sessionStartDate
    hasRescheduled
    zoomIssue
    internetIssue
    laptopIssue
    chromeIssue
    powerCut
    notResponseAndDidNotTurnUp
    turnedUpButLeftAbruptly
    leadNotVerifiedProperly
    otherReasonForReschedule
  }
}`;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.mentorMenteeSessions');
};

const isoToMMDDYYYY = (dt) => {
  const date = new Date(dt);
  const year = date.getFullYear();
  let month = date.getMonth() + 1;
  let modifiedDate = date.getDate();

  if (modifiedDate < 10) {
    modifiedDate = `0${modifiedDate}`;
  }
  if (month < 10) {
    month = `0${month}`;
  }

  return `${modifiedDate}-${month}-${year}`;
};

const getTrueRescheduledField = (obj) => {
  const keys = Object.keys((obj));
  // eslint-disable-next-line no-restricted-syntax
  for (const key of keys) {
    if (obj[key]) {
      return key;
    }
  }
  return '';
};
const getRescheduledReasonData = async (fromDate, toDate) => {
  const mentorMenteeSessionsData = await mentorMenteeSessions(fromDate, toDate);
  const docsArray = [];
  const hasReScheduledArray = [];
  mentorMenteeSessionsData.forEach((obj) => {
    const {
      id, sessionStartDate, hasRescheduled, ...rest
    } = obj;
    const modifiedDate = isoToMMDDYYYY(sessionStartDate);
    const fieldName = getTrueRescheduledField(rest);
    const index = findIndex(docsArray, ['_id', modifiedDate]);
    if (hasRescheduled) {
      if (index !== -1) {
        // update
        if (hasReScheduledArray[index].hasRescheduled) {
          // eslint-disable-next-line operator-assignment
          hasReScheduledArray[index].hasRescheduled = hasReScheduledArray[index].hasRescheduled + 1;
        } else {
          hasReScheduledArray[index].hasRescheduled = 1;
        }
      } else {
        // add
        hasReScheduledArray.push({
          _id: modifiedDate,
          hasRescheduled: 1,
        });
      }
    }
    if (fieldName) {
      if (index !== -1) {
        // update
        if (docsArray[index][fieldName]) {
          // eslint-disable-next-line operator-assignment
          docsArray[index][fieldName] = docsArray[index][fieldName] + 1;
        } else {
          docsArray[index][fieldName] = 1;
        }
      } else {
        // add
        docsArray.push({
          _id: modifiedDate,
          [fieldName]: 1,
        });
      }
    }
  });
  const finalArray = [];
  hasReScheduledArray.forEach((doc) => {
    const i = findIndex(docsArray, { _id: doc._id });
    if (i !== -1) {
      finalArray.push({
        ...doc,
        ...docsArray[i],
      });
    } else {
      finalArray.push(doc);
    }
  });
  return finalArray;
};

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
    source: { $ne: 'school' },
  };
  const users = await aggregateGroupByQuery(
    'User',
    'createdAt',
    userMatchQuery,
    'userRegisteredCount',
  );

  // -----------------------------------------------------------------------------

  const menteeSessionMatchQuery = {
    bookingDate: {
      $gte: new Date(fromDate),
      $lte: new Date(toDate),
    },
    source: { $ne: 'school' },
  };

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
    source: { $ne: 'school' },
  };
  const menteeFirstSessions = await aggregateGroupByQuery(
    'MenteeSession',
    'bookingDate',
    menteeFirstSessionMatchQuery,
    'menteeFirstSessionBookedCount',
  );

  // -----------------------------------------------------------------------------

  const firstSessionAllottedCountMatchQuery = {
    sessionStartDate: { $gte: new Date(fromDate), $lte: new Date(toDate) },
    sessionStatus: 'allotted',
    'topic.typeId': firstTopicId,
    source: { $ne: 'school' },
  };

  const firstSessionAllotted = await aggregateGroupByQuery(
    'MentorMenteeSession',
    'sessionStartDate',
    firstSessionAllottedCountMatchQuery,
    'firstSessionAllottedCount',
  );

  // -----------------------------------------------------------------------------

  const firstSessionStartedCountMatchQuery = {
    sessionStartDate: { $gte: new Date(fromDate), $lte: new Date(toDate) },
    sessionStatus: 'started',
    'topic.typeId': firstTopicId,
    source: { $ne: 'school' },
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
    source: { $ne: 'school' },
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
    source: { $ne: 'school' },
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
    source: { $ne: 'school' },
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
    source: { $ne: 'school' },
  };

  const sessionCompleted = await aggregateGroupByQuery(
    'MentorMenteeSession',
    'sessionStartDate',
    sessionCompletedCountMatchQuery,
    'allSessionsCompletedCount',
  );

  // -----------------------------------------------------------------------------
  const finalArray = [];
  const mentorMenteeSessionData = await getRescheduledReasonData(fromDate, toDate);
  const mergedArray = [
    ...users, ...menteeSessions, ...menteeFirstSessions,
    ...firstSessionAllotted, ...firstSessionStarted, ...firstSessionCompleted,
    ...secondSessionCompleted, ...sessionStarted, ...sessionCompleted, ...mentorMenteeSessionData,
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
        const {
          firstSessionAllottedCount = 0,
          firstSessionStartedCount = 0,
          firstSessionCompletedCount = 0,
          menteeFirstSessionBookedCount = 0,
        } = temp;
        temp.firstMentorMenteeSessionsCount = firstSessionAllottedCount + firstSessionStartedCount + firstSessionCompletedCount;
        temp.firstUnAssignedSessions = menteeFirstSessionBookedCount - temp.firstMentorMenteeSessionsCount;
        if (temp.firstMentorMenteeSessionsCount) {
          temp.firstCompletedSessionsPercentage = (
            (firstSessionCompletedCount / temp.firstMentorMenteeSessionsCount) * 100).toFixed(2);
        }
        finalArray.push(temp);
      });
  }
  return finalArray.length ? orderBy(finalArray, ['date'], ['desc']) : [];
});

export default salesOperationReport;
