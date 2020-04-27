const addAvailableSlotQuery = () => `
mutation($input:AvailableSlotInput!){
  addAvailableSlot(input:$input){
    id
    date
  }
}`;

export default addAvailableSlotQuery;
