// method to store the days selected in timeTableRules in a Set
const getSelectedDays = (timeTableRules) => {
  const days = new Set();
  if (timeTableRules.sunday) {
    days.add(0);
  }
  if (timeTableRules.monday) {
    days.add(1);
  }
  if (timeTableRules.tuesday) {
    days.add(2);
  }
  if (timeTableRules.wednesday) {
    days.add(3);
  }
  if (timeTableRules.thursday) {
    days.add(4);
  }
  if (timeTableRules.friday) {
    days.add(5);
  }
  if (timeTableRules.saturday) {
    days.add(6);
  }
  return days;
}

export default getSelectedDays;
