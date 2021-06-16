// method to parse badges according to return type
export const parseBadges = (badges, currentTopicOrder) => {
  const finalCharacters = [];
  badges.forEach((badge, index) => {
    const tempObj = {};
    const {
      name, description, activeImage, inactiveImage, topic, unlockPoint,
    } = badge;
    let isUnlocked = false;
    let imageId = '';
    if (inactiveImage) { imageId = inactiveImage.id; }
    // badge will be unlocked if that topic is unlocked
    if (topic.order < currentTopicOrder) {
      isUnlocked = true;
      if (activeImage) { imageId = activeImage.id; }
    }
    const image = { type: 'File', typeId: `${imageId}` };
    const order = index + 1;
    Object.assign(tempObj, {
      name, description, isUnlocked, image, order, unlockPoint,
    });
    finalCharacters.push(tempObj);
  });
  return finalCharacters;
};
