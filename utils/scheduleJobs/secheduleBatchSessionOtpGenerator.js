/* eslint-disable no-param-reassign */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { get } from 'lodash';
import { log } from '..';
import callLocalGraphqlApi from '../../src/api/callLocalGraphqlApi';
import { QueryController } from '../../src/autoGenerate/graphql/controllers';
import findSectionAndGradeCombination from '../../src/autoGenerate/graphql/postHookFunctions/utils/findSectionAndGradeCombination';
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
  otp, grade, section, batchSessionId,
}) => {
  const addQuery = `mutation {
    addSchoolSessionOtp(
        input: { otp: ${otp}, grade: ${grade}, section: ${section} }
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
        grade: 1,
        section: 1,
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
  const deleteOtpSlot = (hourValue - 2) < 0 ? 23 : hourValue - 2;
  const batchSessionModel = getTypeQueryController(
    'BatchSession',
  );
  const addOtpBatchSessions = await batchSessionModel.aggregate(
    getBatchSessionAggregation({
      bookingDate: addOtpSlot === 0 ? tomorrowParsedDate : todayParsedDate,
      slot: addOtpSlot,
    }),
  );
  const deleteOtpBatchSessions = await batchSessionModel.aggregate(
    getBatchSessionAggregation({
      bookingDate: deleteOtpSlot === 23 ? yesterDayDate : todayParsedDate,
      slot: deleteOtpSlot,
    }),
  );
  for (const batchSession of addOtpBatchSessions) {
    if (get(batchSession, 'students', []).length) {
      const uniqueGradesArray = [];
      const uniqueSectionsArray = [];
      const otpMapArray = [];
      const schoolSessionOtpArray = get(batchSession, 'schoolSessionOtp', []);
      for (const student of get(batchSession, 'students', [])) {
        if (get(student, 'grade') && get(student, 'section')) {
          if (!uniqueGradesArray.includes(get(student, 'grade'))) uniqueGradesArray.push(get(student, 'grade'));
          if (!uniqueSectionsArray.includes(get(student, 'section'))) uniqueSectionsArray.push(get(student, 'section'));
          const gradeSectionCombination = findSectionAndGradeCombination(get(student, 'section'), get(student, 'grade'));
          const isExist = otpMapArray.find((otpObj) => otpObj.gradeSectionCombination === gradeSectionCombination);
          const isAlreadyCreated = schoolSessionOtpArray.find((sessionOtp) => findSectionAndGradeCombination(get(sessionOtp, 'section'), get(sessionOtp, 'grade'))
          === gradeSectionCombination);
          if (!isExist && !isAlreadyCreated) {
            otpMapArray.push({
              grade: get(student, 'grade'),
              section: get(student, 'section'),
              otp: 0,
              gradeSectionCombination,
            });
          }
        }
      }
      if (otpMapArray.length) {
        const finalOtpMap = await arrayCombinations(uniqueGradesArray, uniqueSectionsArray);
        otpMapArray.forEach((otpObj) => {
          if (finalOtpMap[get(otpObj, 'gradeSectionCombination')]) {
            otpObj.otp = finalOtpMap[get(otpObj, 'gradeSectionCombination')];
          }
        });
        otpMapArray.forEach((otpObj) => {
          addSchoolSessionOtp({ ...otpObj, batchSessionId: get(batchSession, 'id') });
          log(`Creating schoolSessionOtp for grade ${otpObj.grade}, section ${otpObj.section} with OTP: ${otpObj.otp} for batchSession: ${get(batchSession, 'id')}`);
        });
      }
    }
  }
  for (const batchSession of deleteOtpBatchSessions) {
    if (get(batchSession, 'schoolSessionOtp', []).length) {
      for (const sessionOtp of get(batchSession, 'schoolSessionOtp', [])) {
        deleteSchoolSessionOtp(get(sessionOtp, 'id'));
        log(`Deleting schoolSessionOtp: ${get(sessionOtp, 'id')} in batchSession ${get(batchSession, 'id')}`);
      }
    }
  }
};

export default scheduleBatchSessionOtpGenerator;
