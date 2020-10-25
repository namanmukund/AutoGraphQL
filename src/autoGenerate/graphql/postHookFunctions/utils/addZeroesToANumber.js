export const addZeroes = (num) => {
// Convert input string to a number and store as a variable.
  let value = Number(num);
  // Split the input string into two arrays containing integers/decimals
  const res = num.toString() && num.toString().split('.');
  // If there is no decimal point or only one decimal place found.
  if (res.length === 1 || res[1].length < 3) {
    // Set the number to two decimal places
    value = value.toFixed(2);
  }
  // Return updated or original number.
  return value;
};
