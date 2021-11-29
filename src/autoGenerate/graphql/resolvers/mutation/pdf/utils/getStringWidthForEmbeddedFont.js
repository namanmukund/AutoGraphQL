/* Returns the width of a string in the embedded font with a given font size. */
const getStringWidth = (string) => string
  .split('')
  .map((c) => c.charCodeAt(0))
  .map(() => 10)
  .reduce((total, width) => total + width, 0);

export default getStringWidth;
