const updateAvailableSlotQuery = (availableSlotId) => `
mutation($input:AvailableSlotUpdate!){
  updateAvailableSlot(id:"${availableSlotId}", input: $input){
    id
  }
}
`;

export default updateAvailableSlotQuery;
