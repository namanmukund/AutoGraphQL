import { QueryController } from '../../controllers';

const getTypeQueryController = (
  typeName,
  authentication = {
    bypass: true,
  },
) => new QueryController(typeName, authentication);

const getBatchSessionAggregation = ({
  otp,
}) => [
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
      schoolSessionOtp: {
        id: 1,
        otp: 1,
      },
    },
  },
  {
    $match: {
      'schoolSessionOtp.otp': otp,
    },
  },
];

const checkIfOtpPresent = async (otp) => {
  const batchSessionModel = getTypeQueryController(
    'BatchSession',
  );
  const otpExist = await batchSessionModel.aggregate(
    getBatchSessionAggregation({
      otp,
    }),
  );
  return otpExist.length; // converting to boolean
};

export default checkIfOtpPresent;
