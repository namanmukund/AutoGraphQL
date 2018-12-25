const getRandomNumber = (min, max) => {
  const diff = max - min;
  return Math.floor(Math.random() * (diff + 1)) + min;
};

export default getRandomNumber;
