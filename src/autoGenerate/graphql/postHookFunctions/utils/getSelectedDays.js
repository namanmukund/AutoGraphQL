// method to store the days selected in timeTableRules in a Set
const getSelectedDays = (timeTableRule) => {
  const days = new Set();
  if (timeTableRule && timeTableRule.sunday) {
    days.add(0);
  }
  if (timeTableRule && timeTableRule.monday) {
    days.add(1);
  }
  if (timeTableRule && timeTableRule.tuesday) {
    days.add(2);
  }
  if (timeTableRule && timeTableRule.wednesday) {
    days.add(3);
  }
  if (timeTableRule && timeTableRule.thursday) {
    days.add(4);
  }
  if (timeTableRule && timeTableRule.friday) {
    days.add(5);
  }
  if (timeTableRule && timeTableRule.saturday) {
    days.add(6);
  }
  return days;
};

export default getSelectedDays;
