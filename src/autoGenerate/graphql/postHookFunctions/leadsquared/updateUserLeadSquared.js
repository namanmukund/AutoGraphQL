import updateLeadsquared from '../../../../../services/leadsquared/updateLeadSquared';

const updateUserLeadSquared = async (phoneNumber, agentName, verificationStatus, leadStatus) => {
  const leadSqaredInput = {
    Phone: phoneNumber,
    mx_Verification_Agent: agentName,
  };
  if (verificationStatus && leadStatus) {
    const activityInput = {
      ActivityEvent: 103,
      Fields: [
        {
          SchemaName: 'Status',
          Value: 'Booked (Verified)',
        },
        {
          SchemaName: 'mx_Custom_11',
          Value: 'Verified',
        },
      ],
    };
    updateLeadsquared({
      Phone: phoneNumber,
    }, false, activityInput);
  }
  updateLeadsquared(leadSqaredInput, true, {}, true);
};

export default updateUserLeadSquared;
