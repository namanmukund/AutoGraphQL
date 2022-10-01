/* eslint-disable no-restricted-syntax */
// schedule sessions groupBy day (like Object.day.field)
const getScheduleSessionsRulesGroupedByDay = (scheduleSessionsRules) => {
  const daysRule = {};
  scheduleSessionsRules.forEach((rule) => {
    // loop through keys in rule
    for (const key in rule) {
      if (key.includes('day') && !key.includes('ClassMode') && rule[key]) {
        if (!daysRule[key]) {
          daysRule[key] = {};
        }
        // loop through same keys in rule and store the nonRecurringslots, mode, start and end times
        for (const key2 in rule) {
          if ((key2.includes('slot') && rule[key2])
            || (key2 === `${key}ClassMode`)
            || (key2 === 'startTime' || key2 === 'endTime')) {
            daysRule[key][key2] = key2.includes('slot') ? true : rule[key2];
          }
        }
      }
    }
  });
  return daysRule;
};

export default getScheduleSessionsRulesGroupedByDay;
