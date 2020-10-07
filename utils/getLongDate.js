const getLongDate = (dt) => {
  const options = {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  };
  return dt.toLocaleDateString('en-US', options);
};

export default getLongDate;
