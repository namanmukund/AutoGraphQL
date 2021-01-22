import getSlotTimesInString from '../../../../utils/getSlotTimesInString';

const availableSlotsQuery = (date, country) => `
query{
  availableSlots(filter:{
    and:[
      {date:"${date}"}
      {country:"${country}"}
    ]
  }){
    id
    date
    ${getSlotTimesInString()}
  }
}
`;

export default availableSlotsQuery;
