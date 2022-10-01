/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */
import moment from 'moment';
import { get } from 'lodash';
import { QueryController } from '../../src/autoGenerate/graphql/controllers';
import callLocalGraphqlApi from '../../src/api/callLocalGraphqlApi';
import { DAY_BEFORE_DEMO_COMPLETED, LEAD_PARTNERS_TO_CHECK_FOR_DEMO } from '../../constants';
import updateLeadSquared from '../../services/leadsquared/updateLeadSquared';

const getTypeQueryController = (
  typeName,
  authentication = {
    bypass: true,
  },
) => new QueryController(typeName, authentication);

const userModal = getTypeQueryController(
  'User',
);

const getUserAggregation = ({
  startDate,
  endDate,
}) => [
  {
    $match: {
      role: 'parent',
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
      utmSource: {
        $in: [...LEAD_PARTNERS_TO_CHECK_FOR_DEMO],
      },
    },
  },
  {
    $lookup: {
      from: 'ParentProfile',
      let: {
        parentProfileId: '$parentProfile.typeId',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$id', '$$parentProfileId'],
            },
          },
        },
        {
          $lookup: {
            from: 'StudentProfile',
            localField: 'children.typeId',
            foreignField: 'id',
            as: 'children',
          },
        },
        {
          $project: {
            id: 1,
            children: {
              user: 1,
            },
          },
        },
      ],
      as: 'parentProfile',
    },
  },
  {
    $project: {
      id: 1,
      name: 1,
      role: 1,
      phone: 1,
      parentProfile: {
        $arrayElemAt: ['$parentProfile', 0],
      },
      utmSource: 1,
    },
  },
];

const getMmSession = async (userId) => {
  const query = `{
  mentorMenteeSessions(
    filter: {
      and: [
        { menteeSession_some: { user_some: { id: "${userId}" } } }
        { topic_some: { order: 1 } }
        { sessionStatus: completed }
      ]
    }
  ) {
    id
  }
}`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.mentorMenteeSessions', []).length;
};

const updateUsersUtmSource = async (input) => {
  const updateQuery = `mutation($input: [UsersUpdate]!){
    updateUsers(input: $input) {
      id
      utmSource
    }
  }
`;
  const updatedResult = await callLocalGraphqlApi(updateQuery, '', { input });
  return get(updatedResult, 'data.updateUsers');
};

const scheduleUpdateLeadSource = async () => {
  const endDate = moment().startOf('day').subtract(DAY_BEFORE_DEMO_COMPLETED, 'days');
  const startDate = moment(endDate).subtract(2, 'days');
  const users = await userModal.aggregate(
    getUserAggregation({ startDate, endDate }),
  );
  let updatedUserIds = [];
  for (const user of users) {
    const parentPhone = get(user, 'phone.number');
    const parentUserId = get(user, 'id');
    const utmSource = get(user, 'utmSource', '');
    if (utmSource && !utmSource.toLowerCase().includes('tekie')) {
      const updatedUtmSource = `tekie_${utmSource}`;
      if (get(user, 'parentProfile.children', []).length) {
        for (const child of get(user, 'parentProfile.children', [])) {
          const mmSession = await getMmSession(get(child, 'user.typeId'));
          if (!mmSession) {
            console.log(`updating utmSource for user ${get(child, 'user.typeId')} with utm ${updatedUtmSource}, ${parentPhone}`);
            const input = [
              { id: parentUserId, fields: { utmSource: updatedUtmSource } },
              { id: get(child, 'user.typeId'), fields: { utmSource: updatedUtmSource } },
            ];
            updatedUserIds = [...updatedUserIds, parentUserId, get(child, 'user.typeId')];
            await updateUsersUtmSource(input);
            updateLeadSquared({
              Phone: parentPhone,
            }, false, {
              ActivityEvent: 214,
              Fields: [
                {
                  SchemaName: 'mx_Custom_1',
                  Value: updatedUtmSource,
                },
              ],
            });
          }
        }
      }
    }
  }
  console.log('updated userIds with utm_source are ', JSON.stringify(updatedUserIds), updatedUserIds.length);
};

export default scheduleUpdateLeadSource;
