import getSlotTimesInString from '../../../../utils/getSlotTimesInString';

const batchQuery = (batchId) => `
query{
  batch(id: "${batchId}"){
    id
    createdAt
    updatedAt
    timeTableRule{
      startDate
      endDate
      ${getSlotTimesInString()}
      monday
      tuesday
      wednesday
      thursday
      friday
      saturday
      sunday
    }
    allottedMentor{
      username
      id
    }
    course{
      id
    }
    code
    type
  }
}
`;

export default batchQuery;
