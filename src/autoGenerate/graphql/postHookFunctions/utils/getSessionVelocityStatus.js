const getSessionVelocityStatus = (sessionsPerMonth, avgDaysPerSession) => {
  let sessionVelocityStatus = 'onTime';
  const expectedAvgDaysPerSession = Math.round(30 / sessionsPerMonth);
  if (avgDaysPerSession && (expectedAvgDaysPerSession > Math.round(avgDaysPerSession))) {
    sessionVelocityStatus = 'ahead';
  } else if (avgDaysPerSession && (expectedAvgDaysPerSession < Math.round(avgDaysPerSession))) {
    sessionVelocityStatus = 'delayed';
  }
  return sessionVelocityStatus;
};

export default getSessionVelocityStatus;
