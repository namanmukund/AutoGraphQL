/* eslint-disable no-restricted-syntax */
import { get } from 'lodash';
import { log } from '..';
import callLocalGraphqlApi from '../../src/api/callLocalGraphqlApi';
import { QueryController } from '../../src/autoGenerate/graphql/controllers';
import arrayCombinations from '../../src/autoGenerate/graphql/postHookFunctions/utils/generateOtpMap';

const deleteSchoolSessionOtp = async (schoolSessionOtpIn) => {
  const deleteQuery = `mutation {
    deleteSchoolSessionOtp(id: "${schoolSessionOtpIn}") {
        id
    }
    }
    `;
  const result = await callLocalGraphqlApi(deleteQuery);
  return get(result, 'data.deleteSchoolSessionOtp');
};

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

const getTypeQueryController = (
  typeName,
  authentication = {
    bypass: true,
  },
) => new QueryController(typeName, authentication);

const getBatchSessionAggregation = ({
  bookingDate,
  slot,
}) => [
  {
    $match: {
      bookingDate: new Date(bookingDate),
      [`slot${slot}`]: true,
    },
  },
  {
    $lookup: {
      from: 'StudentProfile',
      localField: 'attendance.student.typeId',
      foreignField: 'id',
      as: 'students',
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
    $lookup: {
      from: 'SchoolSessionOtp',
      localField: 'schoolSessionsOtp.typeId',
      foreignField: 'id',
      as: 'schoolSessionOtp',
    },
  },
  {
    $project: {
      id: 1,
      bookingDate: 1,
      students: {
        id: 1,
      },
      batch: {
        id: 1,
        type: 1,
      },
      schoolSessionOtp: {
        id: 1,
        otp: 1,
      },
    },
  },
];

const getSchoolSessionOtpAggregation = ({ sessionStatus }) => [
  {
    $lookup: {
      from: 'BatchSession',
      localField: 'batchSession.typeId',
      foreignField: 'id',
      as: 'batchSession',
    },
  },
  {
    $match: {
      'batchSession.sessionStatus': sessionStatus,
    },
  },
  {
    $project: {
      id: 1,
      batchSession: {
        id: 1,
        bookingDate: 1,
        sessionStatus: 1,
      },
    },
  },
];

const scheduleBatchSessionOtpGenerator = async () => {
  const dt = new Date().setHours(0, 0, 0, 0);
  const todayParsedDate = new Date(dt).toISOString();
  const hourValue = new Date().getHours();
  const addOtpSlot = (hourValue + 2) <= 23 ? hourValue + 2 : 0;
  const tomorrow = new Date(dt);
  const yesterDayDate = new Date(dt);
  tomorrow.setDate(tomorrow.getDate() + 1);
  yesterDayDate.setDate(yesterDayDate.getDate() - 1);
  const tomorrowParsedDate = tomorrow.toISOString();
  const batchSessionModel = getTypeQueryController(
    'BatchSession',
  );
  const schoolSessionOtpModal = getTypeQueryController(
    'SchoolSessionOtp',
  );
  const addOtpBatchSessions = await batchSessionModel.aggregate(
    getBatchSessionAggregation({
      bookingDate: addOtpSlot === 0 ? tomorrowParsedDate : todayParsedDate,
      slot: addOtpSlot,
    }),
  );
  const schoolSessionOtps = await schoolSessionOtpModal.aggregate(getSchoolSessionOtpAggregation({ sessionStatus: 'completed' }));
  const batchIdsMap = {};
  for (const batchSession of addOtpBatchSessions) {
    const schoolSessionOtpArray = get(batchSession, 'schoolSessionOtp', []);
    if (get(batchSession, 'students', []).length) {
      const batchId = get(batchSession, 'batch[0].id');
      const batchType = get(batchSession, 'batch[0].type');
      if (!schoolSessionOtpArray.length && !batchIdsMap[batchId] && batchId && batchType === 'b2b') batchIdsMap[batchId] = get(batchSession, 'id');
    }
  }
  const finalOtpMap = await arrayCombinations(Object.keys(batchIdsMap));
  Object.keys(finalOtpMap).forEach((batchId) => {
    addSchoolSessionOtp({ otp: finalOtpMap[batchId], batchSessionId: batchIdsMap[batchId] });
    log(`Creating schoolSessionOtp for batch ${batchId}, with OTP: ${finalOtpMap[batchId]} for batchSession: ${batchIdsMap[batchId]}`);
  });
  for (const schoolSessionOtp of schoolSessionOtps) {
    if (get(schoolSessionOtp, 'batchSession', []).length) {
      deleteSchoolSessionOtp(get(schoolSessionOtp, 'id'));
      log(`Deleting schoolSessionOtp: ${get(schoolSessionOtp, 'id')} for batchSession ${get(schoolSessionOtp, 'batchSession[0].id', '')}`);
    }
  }
};

export default scheduleBatchSessionOtpGenerator;
