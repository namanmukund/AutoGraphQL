import updateLeadsquared from '../../../../../services/leadsquared/updateLeadSquared';

const updateUserLeadSquared = async (phoneNumber, agentName) => {
  updateLeadsquared({
    Phone: phoneNumber,
    mx_Verification_Agent: agentName,
  }, true, {}, true);
};

export default updateUserLeadSquared;
