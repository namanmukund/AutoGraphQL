const calculateMentorRating = (mentorInfo) => {
  let ratingNum = 0;
  let ratingDen = 0;
  if (!mentorInfo) return 0;
  Object.keys(mentorInfo).forEach((key) => {
    if (key.includes('pythonCourseRating') && mentorInfo[key] > 0) {
      const ratingValue = key.split('pythonCourseRating')[1];
      ratingNum += ratingValue * mentorInfo[key];
      ratingDen += mentorInfo[key];
    }
  });
  if (ratingNum > 0 && ratingDen > 0) {
    return Number((ratingNum / ratingDen).toFixed(2));
  }
  return '';
};

export default calculateMentorRating;
