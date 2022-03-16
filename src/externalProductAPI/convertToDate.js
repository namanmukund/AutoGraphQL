const convertToDate = (dateString) => {
  let dateParts = [];

  if (dateString.includes('-')) {
    dateParts = dateString.split('-');
  } else if (dateString.includes('/')) {
    dateParts.dateString.split('/');
  }

  if (dateParts.length !== 2) return null;
  const dateObject = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);

  return dateObject.toString();
};

export default convertToDate;
