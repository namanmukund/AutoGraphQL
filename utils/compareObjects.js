// recursively compares two objects
const compareObjects = (x, y) => {
  const ok = Object.keys;
  const tx = typeof x;
  const ty = typeof y;
  return x && y && tx === 'object' && tx === ty ? (
    ok(x).length === ok(y).length &&
    ok(x).every(key => compareObjects(x[key], y[key]))
  ) : (String(x) === String(y));
};

export default compareObjects;
