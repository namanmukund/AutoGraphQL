const getPossessiveNoun = (studentName) => {
  if (studentName.toLowerCase().endsWith('s')) {
    return `${studentName}'`;
  }
  return `${studentName}'s`;
};

export default getPossessiveNoun;
