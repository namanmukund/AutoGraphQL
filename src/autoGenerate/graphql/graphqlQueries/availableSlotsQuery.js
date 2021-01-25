import getSlotTimesInString from '../../../../utils/getSlotTimesInString';

const availableSlotsQuery = (date) => `
query{
  availableSlots(filter:{
    date:"${date}"
  }){
    id
    date
    ${getSlotTimesInString()}
  }
}
`;

export default availableSlotsQuery;
