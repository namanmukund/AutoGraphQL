const getMentorAvailabilitySlots = (date) => `
{
  mentorAvailabilitySlots(filter: { date: "${date}" }) {
    id
    slotName
    date
    menteeSessionsMeta {
      count
    }
    mentorSessionsMeta {
      count
    }
    batchSessionsMeta(filter: { batch_some: { type_not: b2b } }) {
      count
    }
  }
}

`;

export default getMentorAvailabilitySlots;
