import { get } from 'lodash';
import { validateTimeTableRule } from './utils/updateCampaignPrehookHelperMethods';

/* eslint-disable no-unused-vars */
const updateCampaignValidation = async (params, mutationName, context) => {
  const {
    input: {
      timeTableRules,
    },
  } = params;
  const timeTableRulesArray = get(timeTableRules, 'replace', []);

  for (let i = 0; i < timeTableRulesArray.length; i += 1) {
    await validateTimeTableRule(timeTableRulesArray[i]);
  }
};

export default updateCampaignValidation;
