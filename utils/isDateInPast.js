const dateInPast = (firstDate, secondDate) => {
  if (firstDate.setHours(0, 0, 0, 0) < secondDate.setHours(0, 0, 0, 0)) {
    return true;
  }

  return false;
};

export default dateInPast;
