/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-loop-func */
import { get } from 'lodash';
import { log } from '../../../../../utils';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { QueryController } from '../../controllers';
import arrayCombinations from './generateOtpMap';

const addSchoolSessionOtp = async ({
  otp, batchSessionId,
}) => {
  const addQuery = `mutation {
    addSchoolSessionOtp(
        input: { otp: ${otp} }
        batchSessionConnectId: "${batchSessionId}"
    ) {
        id
    }
    }
    `;
  const result = await callLocalGraphqlApi(addQuery);
  return get(result, 'data.addSchoolSessionOtp', null);
};

const getBatchSessionAggregation = ({
  batchSessionId,
}) => [
  {
    $match: {
      id: batchSessionId,
    },
  },
  {
    $lookup: {
      from: 'SchoolSessionOtp',
      localField: 'schoolSessionsOtp.typeId',
      foreignField: 'id',
      as: 'schoolSessionOtp',
    },
  },
  {
    $lookup: {
      from: 'Batch',
      localField: 'batch.typeId',
      foreignField: 'id',
      as: 'batch',
    },
  },
  {
    $project: {
      id: 1,
      bookingDate: 1,
      batch: {
        id: 1,
      },
      schoolSessionOtp: {
        id: 1,
        grade: 1,
        section: 1,
        otp: 1,
      },
    },
  },
];

const getTypeQueryController = (
  typeName,
  authentication = {
    bypass: true,
  },
) => new QueryController(typeName, authentication);

const batchSessionModel = getTypeQueryController(
  'BatchSession',
);

const generateOtpForBatchSession = async (batchSessionId, students = []) => {
  if (students.length) {
    const addOtpBatchSessions = await batchSessionModel.aggregate(
      getBatchSessionAggregation({
        batchSessionId,
      }),
    );
    const batchIdsMap = {};
    for (const batchSession of addOtpBatchSessions) {
      const schoolSessionOtpArray = get(batchSession, 'schoolSessionOtp', []);
      const batchId = get(batchSession, 'batch[0].id');
      if (!schoolSessionOtpArray.length && !batchIdsMap[batchId] && batchId) batchIdsMap[batchId] = get(batchSession, 'id');
    }
    const finalOtpMap = await arrayCombinations(Object.keys(batchIdsMap));
    Object.keys(finalOtpMap).forEach((batchId) => {
      addSchoolSessionOtp({ otp: finalOtpMap[batchId], batchSessionId: batchIdsMap[batchId] });
      log(`Creating schoolSessionOtp for batch ${batchId}, with OTP: ${finalOtpMap[batchId]} for batchSession: ${batchIdsMap[batchId]}`);
    });
  }
};

export default generateOtpForBatchSession;
