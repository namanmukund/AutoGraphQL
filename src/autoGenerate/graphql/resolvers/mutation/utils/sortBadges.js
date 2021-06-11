// method to sort badge array according to topic order and order inside of a topic
// it will take a array which is already sorted topic order wise
export const sortBadges = (badges) => {
  const sortedArray = [];
  // tempArray is storing objects of same topic temporarily
  const tempArray = [];
  badges.forEach((badge, index) => {
    if (index === 0) {
      tempArray.push(badge);
    } else if (badge.topic.order === badges[index - 1].topic.order) {
      tempArray.push(badge);
    } else {
      // sorting badges of a topic which are stored in tempArray
      tempArray.sort((a, b) => a.order - b.order);
      sortedArray.push(...tempArray);
      tempArray.length = 0;
      tempArray.push(badge);
    }
  });
  // after end of loop there will be entries left in tempArray for last topic
  if (tempArray.length) {
    tempArray.sort((a, b) => a.order - b.order);
    sortedArray.push(...tempArray);
    tempArray.length = 0;
  }
  return sortedArray;
};
