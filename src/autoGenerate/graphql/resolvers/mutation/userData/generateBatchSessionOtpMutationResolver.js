/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import get from 'lodash/get';
import { UnauthorizedOperationError } from '../../../../../../constants/errors';
import { MissingMandatoryInputInRequestError } from '../../../../../../constants/errors/input';
import { log } from '../../../../../../utils';
import { callLocalGraphqlApi } from '../../../../../api';
import { QueryController } from '../../../controllers';
import arrayCombinations from '../../../postHookFunctions/utils/generateOtpMap';

const BATCHSESSION_TYPE = 'BatchSession';

const getBatchSessionAggregation = ({
  batchSessionIds,
}) => [
  {
    $match: {
      id: {
        $in: batchSessionIds,
      },
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

const generateBatchSessionOtp = async (root, params, authentication) => {
  const { batchSessionIds = [] } = params;
  const currentUser = authentication && authentication.user;
  if (!currentUser) {
    throw new UnauthorizedOperationError();
  }
  if (!batchSessionIds || !batchSessionIds.length) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'BatchSession Id`s is missing in input',
      },
    });
  }
  const batchSessionModel = getTypeQueryController(
    BATCHSESSION_TYPE,
  );

  const batchSessionsResponse = await batchSessionModel.aggregate(
    getBatchSessionAggregation({
      batchSessionIds,
    }),
  );
  if (!batchSessionsResponse || !batchSessionsResponse.length) return [];
  const batchIdsMap = {};
  for (const batchSession of batchSessionsResponse) {
    const schoolSessionOtpArray = get(batchSession, 'schoolSessionOtp', []);
    const batchId = get(batchSession, 'batch[0].id');
    if (!schoolSessionOtpArray.length && !batchIdsMap[batchId] && batchId) batchIdsMap[batchId] = get(batchSession, 'id');
  }
  const modelQuery = new QueryController(BATCHSESSION_TYPE, { bypass: true });
  if (!Object.keys(batchIdsMap).length) {
    const modelQueryRes = await modelQuery.fetchMultiple({ id: { $in: batchSessionIds } });
    return modelQueryRes;
  }
  const finalOtpMap = await arrayCombinations(Object.keys(batchIdsMap));
  let addSchoolSessionOtpQuery = '';
  for (const batchId of Object.keys(finalOtpMap)) {
    const batchSessionId = batchIdsMap[batchId];
    const batchSessionOtp = finalOtpMap[batchId];
    addSchoolSessionOtpQuery += `schoolSessionOtp_${batchSessionId}: addSchoolSessionOtp(
        input: { otp: ${batchSessionOtp} }
        batchSessionConnectId: "${batchSessionId}"
    ) {
        id
    }`;
    log(`Creating schoolSessionOtp for batch: ${batchId}, with OTP: ${batchSessionOtp} for batchSession: ${batchSessionId}`);
  }
  addSchoolSessionOtpQuery = `mutation{ ${addSchoolSessionOtpQuery} }`;
  await callLocalGraphqlApi(addSchoolSessionOtpQuery);
  const modelQueryRes = await modelQuery.fetchMultiple({ id: { $in: batchSessionIds } });
  return modelQueryRes;
};

export default generateBatchSessionOtp;
